-- ============================================================
-- SantexPro — Migration 005: Fix RLS, Public/Anon Access and Active Products
-- ============================================================
-- 1. Barcha jadvallar (products, categories, sales, sale_items, stock_movements, contacts)
--    uchun RLS siyosatlarini yangilash (anon va authenticated rollari uchun to'liq ruxsat).
--    Bu kassa terminali va telefonlardan anon/PIN orqali kirilganda ma'lumotlar
--    bloklanib qolishining va mahsulotlar yo'qolib ketishining oldini oladi.
-- 2. is_active ustuni NULL bo'lib qolgan barcha mahsulotlarni TRUE ga o'tkazish.
-- ============================================================

-- 1. PRODUCTS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_read" ON products;
DROP POLICY IF EXISTS "products_write" ON products;
DROP POLICY IF EXISTS "products_read_all" ON products;
DROP POLICY IF EXISTS "products_write_all" ON products;

CREATE POLICY "products_read_all" ON products
  FOR SELECT USING (true);

CREATE POLICY "products_write_all" ON products
  FOR ALL USING (true);

-- is_active ustuni null bo'lgan barcha tovarlarni faol holatga keltirish
UPDATE products SET is_active = true WHERE is_active IS NULL;
ALTER TABLE products ALTER COLUMN is_active SET DEFAULT true;

-- 2. CATEGORIES
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_read" ON categories;
DROP POLICY IF EXISTS "categories_write" ON categories;
DROP POLICY IF EXISTS "categories_read_all" ON categories;
DROP POLICY IF EXISTS "categories_write_all" ON categories;

CREATE POLICY "categories_read_all" ON categories
  FOR SELECT USING (true);

CREATE POLICY "categories_write_all" ON categories
  FOR ALL USING (true);

-- 3. SALES
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sales_read" ON sales;
DROP POLICY IF EXISTS "sales_write" ON sales;
DROP POLICY IF EXISTS "sales_read_all" ON sales;
DROP POLICY IF EXISTS "sales_write_all" ON sales;

CREATE POLICY "sales_read_all" ON sales
  FOR SELECT USING (true);

CREATE POLICY "sales_write_all" ON sales
  FOR ALL USING (true);

-- 4. SALE_ITEMS
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sale_items_read" ON sale_items;
DROP POLICY IF EXISTS "sale_items_write" ON sale_items;
DROP POLICY IF EXISTS "sale_items_read_all" ON sale_items;
DROP POLICY IF EXISTS "sale_items_write_all" ON sale_items;

CREATE POLICY "sale_items_read_all" ON sale_items
  FOR SELECT USING (true);

CREATE POLICY "sale_items_write_all" ON sale_items
  FOR ALL USING (true);

-- 5. STOCK_MOVEMENTS
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stock_movements_read" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_write" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_read_all" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_write_all" ON stock_movements;

CREATE POLICY "stock_movements_read_all" ON stock_movements
  FOR SELECT USING (true);

CREATE POLICY "stock_movements_write_all" ON stock_movements
  FOR ALL USING (true);

-- 6. CONTACTS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contacts_read" ON contacts;
DROP POLICY IF EXISTS "contacts_write" ON contacts;
DROP POLICY IF EXISTS "contacts_read_all" ON contacts;
DROP POLICY IF EXISTS "contacts_write_all" ON contacts;

CREATE POLICY "contacts_read_all" ON contacts
  FOR SELECT USING (true);

CREATE POLICY "contacts_write_all" ON contacts
  FOR ALL USING (true);
