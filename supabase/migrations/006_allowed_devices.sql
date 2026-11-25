-- ============================================================
-- ProSant — Migration 006: Allowed Devices (Max 3 Devices: 2 Laptops + 1 Phone)
-- ============================================================
-- Ushbu jadval tizimga faqat 3 ta ruxsat etilgan qurilma
-- (2 ta Laptop va 1 ta Telefon) ulanishini ta'minlaydi.
-- Begona har qanday qurilma avtomatik ravishda bloklanadi.
-- ============================================================

CREATE TABLE IF NOT EXISTS allowed_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL UNIQUE,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'other', -- 'laptop', 'mobile', 'other'
  browser_info TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS yoqish va boshqaruv siyosatlari
ALTER TABLE allowed_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allowed_devices_select" ON allowed_devices;
DROP POLICY IF EXISTS "allowed_devices_all" ON allowed_devices;

CREATE POLICY "allowed_devices_select" ON allowed_devices
  FOR SELECT USING (true);

CREATE POLICY "allowed_devices_all" ON allowed_devices
  FOR ALL USING (true);

-- Indekslar
CREATE INDEX IF NOT EXISTS idx_allowed_devices_device_id ON allowed_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_allowed_devices_approved ON allowed_devices(is_approved);
