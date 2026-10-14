-- ============================================================
-- SantexPro — Migration 002: Add cost_price (Asl narx / Tannarx)
-- ============================================================
-- Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================

ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,2) DEFAULT 0 CHECK (cost_price >= 0);

COMMENT ON COLUMN products.cost_price IS 'Asl narx (kelish narxi / tannarx)';
