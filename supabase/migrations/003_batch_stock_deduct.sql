-- ============================================================
-- SantexPro — Migration 003: Batch Stock Updates & Composite Indexes
-- ============================================================
-- 1. stock_in_batch: Atomik ko'p mahsulotli stock yangilash (1 ta tarmoq so'rovi)
-- 2. Tezkor so'rovlar uchun qo'shimcha kompozit indekslar
-- ============================================================

CREATE OR REPLACE FUNCTION stock_in_batch(
  p_items JSONB,
  p_note  TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  item         JSONB;
  v_product_id UUID;
  v_quantity   NUMERIC;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (item->>'productId')::UUID;
    v_quantity   := (item->>'quantity')::NUMERIC;

    -- Mahsulot qoldig'ini yangilash
    UPDATE products
    SET    stock      = stock + v_quantity,
           updated_at = now()
    WHERE  id = v_product_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Mahsulot topilmadi: %', v_product_id;
    END IF;

    -- Stock harakatini kiritish
    INSERT INTO stock_movements (product_id, type, quantity, note)
    VALUES (
      v_product_id,
      CASE WHEN v_quantity < 0 THEN 'out' ELSE 'in' END,
      ABS(v_quantity),
      COALESCE(item->>'note', p_note)
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Tezkor qidiruv va filtrlash uchun kompozit indekslar
-- ============================================================

-- Faol mahsulotlarni alfavit bo'yicha tezkor saralash
CREATE INDEX IF NOT EXISTS products_active_name_idx
  ON products(is_active, name);

-- Faol sotuvlarni sana bo'yicha kamayish tartibida olish
CREATE INDEX IF NOT EXISTS sales_active_created_at_idx
  ON sales(is_deleted, created_at DESC);
