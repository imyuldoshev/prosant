-- ============================================================
-- SantexPro — Seed: Boshlangich kategoriyalar
-- ============================================================
-- Bu SQL ni 001_initial_schema.sql DAN KEYIN ishga tushiring
-- Supabase SQL Editor -> New query -> Run
-- ============================================================

-- Kategoriyalar
INSERT INTO categories (name, slug) VALUES
  ('Trubalar', 'trubalar')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- ADMIN FOYDALANUVCHI YARATISH
-- ============================================================
-- Avval Authentication -> Users -> "Invite user" orqali
-- admin@santexpro.uz ni qo'shing. U ro'yxatdan o'tgandan keyin
-- quyidagi so'rov bilan admin rolini bering:
--
-- UPDATE profiles SET role = 'admin' WHERE id = 'USER_UUID_HERE';
--
-- Yoki auth.users jadvalidan id ni topib:
-- UPDATE profiles
--   SET role = 'admin', full_name = 'Admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@santexpro.uz');
-- ============================================================
