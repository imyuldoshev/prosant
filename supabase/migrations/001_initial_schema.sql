-- ============================================================
-- SantexPro — Migration 001: Initial Schema (CLEAN INSTALL)
-- ============================================================
-- Supabase dashboard -> SQL Editor -> New query -> bu SQL ni joylashtiring
-- So'ng "Run" tugmasini bosing
-- DIQQAT: Bu script avvalgi jadvallarni o'chirib yangidan yaratadi
-- ============================================================

-- ============================================================
-- 0. ESKI JADVALLARNI TOZALASH (CASCADE — bog'liq narsalar ham o'chadi)
-- ============================================================
DROP TABLE IF EXISTS stock_movements  CASCADE;
DROP TABLE IF EXISTS sale_items       CASCADE;
DROP TABLE IF EXISTS sales            CASCADE;
DROP TABLE IF EXISTS customers        CASCADE;
DROP TABLE IF EXISTS products         CASCADE;
DROP TABLE IF EXISTS categories       CASCADE;
DROP TABLE IF EXISTS profiles         CASCADE;

DROP FUNCTION IF EXISTS update_timestamp()    CASCADE;
DROP FUNCTION IF EXISTS stock_in(UUID, NUMERIC, TEXT) CASCADE;
DROP FUNCTION IF EXISTS search_products(TEXT) CASCADE;

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;       -- Trigram qidiruv
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- UUID generatsiya

-- ============================================================
-- 2. KATEGORIYALAR
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. MAHSULOTLAR
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  artikul       TEXT UNIQUE,
  price         NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  unit          TEXT NOT NULL DEFAULT 'dona',
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_key     TEXT,
  image_url     TEXT,
  stock         INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock     INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  -- Full-text search (name + artikul, russian config — Cyrillic va lotin uchun)
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('russian',
      coalesce(name, '') || ' ' || coalesce(artikul, '')
    )
  ) STORED
);

-- Indekslar
CREATE INDEX IF NOT EXISTS products_search_idx
  ON products USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS products_name_trgm_idx
  ON products USING GIN(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS products_category_idx
  ON products(category_id);

CREATE INDEX IF NOT EXISTS products_is_active_idx
  ON products(is_active);

-- ============================================================
-- 4. MIJOZLAR
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  phone      TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. SOTUVLAR
-- ============================================================
CREATE TABLE IF NOT EXISTS sales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number     BIGINT GENERATED ALWAYS AS IDENTITY,
  created_at      TIMESTAMPTZ DEFAULT now(),
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name   TEXT,
  customer_phone  TEXT,
  payment_method  TEXT NOT NULL
    CHECK (payment_method IN ('naqd','karta','transfer','nasiya')),
  subtotal        NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount        NUMERIC(12,2) DEFAULT 0,
  total           NUMERIC(12,2) NOT NULL DEFAULT 0,
  received_amount NUMERIC(12,2),
  change_amount   NUMERIC(12,2),
  note            TEXT,
  is_deleted      BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS sales_created_at_idx
  ON sales(created_at DESC);

CREATE INDEX IF NOT EXISTS sales_payment_idx
  ON sales(payment_method);

CREATE INDEX IF NOT EXISTS sales_is_deleted_idx
  ON sales(is_deleted);

-- ============================================================
-- 6. SOTUV TARKIBI
-- ============================================================
CREATE TABLE IF NOT EXISTS sale_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id      UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  category     TEXT,
  quantity     NUMERIC(10,3) NOT NULL CHECK (quantity > 0),
  price        NUMERIC(12,2) NOT NULL,
  total        NUMERIC(12,2) NOT NULL,
  unit         TEXT NOT NULL DEFAULT 'dona',
  artikul      TEXT
);

CREATE INDEX IF NOT EXISTS sale_items_sale_idx
  ON sale_items(sale_id);

CREATE INDEX IF NOT EXISTS sale_items_product_idx
  ON sale_items(product_id);

-- ============================================================
-- 7. STOCK HARAKATLARI
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type       TEXT NOT NULL
    CHECK (type IN ('in','out','return','adjustment')),
  quantity   NUMERIC(10,3) NOT NULL,
  reference  TEXT,   -- sale_id yoki boshqa havola
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_movements_product_idx
  ON stock_movements(product_id);

-- ============================================================
-- 8. FOYDALANUVCHILAR PROFILI
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  role       TEXT NOT NULL DEFAULT 'cashier'
    CHECK (role IN ('admin','cashier','viewer')),
  store_name TEXT DEFAULT 'SantexPro',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 9. TRIGGER — updated_at avtomatik yangilanish
-- ============================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- 10. STORED PROCEDURES
-- ============================================================

-- stock_in: Atomik stock kirim (stock + stock_movements bir transaksiyada)
CREATE OR REPLACE FUNCTION stock_in(
  p_product_id UUID,
  p_quantity   NUMERIC,
  p_note       TEXT DEFAULT NULL
)
RETURNS products AS $$
DECLARE
  updated_product products;
BEGIN
  UPDATE products
  SET   stock      = stock + p_quantity,
        updated_at = now()
  WHERE id = p_product_id
  RETURNING * INTO updated_product;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mahsulot topilmadi: %', p_product_id;
  END IF;

  INSERT INTO stock_movements (product_id, type, quantity, note)
  VALUES (p_product_id, 'in', p_quantity, p_note);

  RETURN updated_product;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- search_products: Full-text + trigram qidiruv
CREATE OR REPLACE FUNCTION search_products(search_query TEXT)
RETURNS SETOF products AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM   products
  WHERE  is_active = true
    AND (
      search_vector @@ plainto_tsquery('russian', search_query)
      OR name ILIKE '%' || search_query || '%'
    )
  ORDER BY
    ts_rank(search_vector, plainto_tsquery('russian', search_query)) DESC,
    name ASC
  LIMIT 30;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Kategoriyalar — barcha autentifikatsiya qilinganlar o'qishi mumkin
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_read" ON categories
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "categories_write" ON categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Mahsulotlar
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_read" ON products
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "products_write" ON products
  FOR ALL USING (auth.role() = 'authenticated');

-- Sotuvlar
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_read" ON sales
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "sales_write" ON sales
  FOR ALL USING (auth.role() = 'authenticated');

-- Sotuv tarkibi
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sale_items_read" ON sale_items
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "sale_items_write" ON sale_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Stock harakatlari
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock_movements_read" ON stock_movements
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "stock_movements_write" ON stock_movements
  FOR ALL USING (auth.role() = 'authenticated');

-- Profillar
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self" ON profiles
  FOR ALL USING (auth.uid() = id);
CREATE POLICY "profiles_admin_read" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- 12. REALTIME
-- ============================================================
-- Jadvallar uchun realtime yoqish
-- (Agar allaqachon qo'shilgan bo'lsa xato bermaydi)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE products;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'sales'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE sales;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'sale_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE sale_items;
  END IF;
END;
$$;

-- ============================================================
-- MIGRATION TUGADI
-- ============================================================
