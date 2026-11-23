-- ============================================================
-- 004_fix_products_realtime.sql
-- Products va categories jadvallarida Realtime va replikatsiyani to'liq sozlash
-- ============================================================

-- Products jadvalida barcha ustunlar (shu jumladan katta text/rasm ustunlari) Realtime da to'liq uzatilishi uchun:
ALTER TABLE IF EXISTS products REPLICA IDENTITY FULL;

-- Categories jadvalini realtime publication ga qo'shish (agar yo'q bo'lsa)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'categories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE categories;
  END IF;
END;
$$;
