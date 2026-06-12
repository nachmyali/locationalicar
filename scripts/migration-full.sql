-- Migration complète — AliCar (tout en un)
-- Execute this in Supabase SQL Editor, then run: node scripts/seed.mjs

-- 1. Cars
CREATE TABLE IF NOT EXISTS cars (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('CAT A','CAT B','CAT C','CAT D')),
  price       NUMERIC NOT NULL,
  duration    TEXT DEFAULT 'jour',
  seats       INT NOT NULL,
  transmission TEXT NOT NULL,
  doors       INT NOT NULL,
  fuel        TEXT NOT NULL,
  image       TEXT NOT NULL,
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tariffs
CREATE TABLE IF NOT EXISTS tariffs (
  id          SERIAL PRIMARY KEY,
  category    TEXT NOT NULL CHECK (category IN ('CAT A','CAT B','CAT C','CAT D')),
  min_days    INT NOT NULL,
  max_days    INT NOT NULL,
  normal_rate NUMERIC NOT NULL,
  haute_rate  NUMERIC NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Reservations
CREATE TABLE IF NOT EXISTS reservations (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT NOT NULL,
  car_name         TEXT NOT NULL,
  car_category     TEXT NOT NULL,
  car_price        NUMERIC NOT NULL,
  car_duration     TEXT DEFAULT 'jour',
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  location         TEXT,
  transport_eur    NUMERIC DEFAULT 0,
  season           TEXT NOT NULL,
  duration_days    INT NOT NULL,
  daily_rate_eur   NUMERIC NOT NULL,
  rental_total_eur NUMERIC NOT NULL,
  total_eur        NUMERIC NOT NULL,
  status           TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','confirmed','cancelled')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Admin profiles
CREATE TABLE IF NOT EXISTS admin_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id),
  name        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Transport prices
CREATE TABLE IF NOT EXISTS transport_prices (
  id SERIAL PRIMARY KEY,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  price_eur NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_location, to_location)
);

-- 6. Settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Franchises
CREATE TABLE IF NOT EXISTS franchises (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('CAT A','CAT B','CAT C','CAT D')),
  amount_eur NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category)
);

-- ===== RLS =====

ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;

-- Cars
DROP POLICY IF EXISTS "cars_all_admin" ON cars;
CREATE POLICY "cars_select_public" ON cars FOR SELECT USING (true);
CREATE POLICY "cars_select_admin" ON cars FOR SELECT USING (
  auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);
CREATE POLICY "cars_insert_admin" ON cars FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);
CREATE POLICY "cars_update_admin" ON cars FOR UPDATE USING (
  auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);
CREATE POLICY "cars_delete_admin" ON cars FOR DELETE USING (
  auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);

-- Tariffs
DROP POLICY IF EXISTS "tariffs_all_admin" ON tariffs;
CREATE POLICY "tariffs_select_public" ON tariffs FOR SELECT USING (true);
CREATE POLICY "tariffs_select_admin" ON tariffs FOR SELECT USING (
  auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);
CREATE POLICY "tariffs_insert_admin" ON tariffs FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);
CREATE POLICY "tariffs_update_admin" ON tariffs FOR UPDATE USING (
  auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);
CREATE POLICY "tariffs_delete_admin" ON tariffs FOR DELETE USING (
  auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);

-- Reservations
CREATE POLICY "reservations_insert_public" ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "reservations_select_admin" ON reservations FOR SELECT USING (
  auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);
CREATE POLICY "reservations_update_admin" ON reservations FOR UPDATE USING (
  auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);
CREATE POLICY "reservations_delete_admin" ON reservations FOR DELETE USING (
  auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);

-- Transport prices
CREATE POLICY "transport_prices_select_public" ON transport_prices FOR SELECT USING (true);
CREATE POLICY "transport_prices_insert_admin" ON transport_prices FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);
CREATE POLICY "transport_prices_update_admin" ON transport_prices FOR UPDATE USING (
  auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);
CREATE POLICY "transport_prices_delete_admin" ON transport_prices FOR DELETE USING (
  auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);

-- Settings
CREATE POLICY "settings_select_public" ON settings FOR SELECT USING (true);
CREATE POLICY "settings_insert_admin" ON settings FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);
CREATE POLICY "settings_update_admin" ON settings FOR UPDATE USING (
  auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);
CREATE POLICY "settings_delete_admin" ON settings FOR DELETE USING (
  auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);

-- Franchises
CREATE POLICY "franchises_select_public" ON franchises FOR SELECT USING (true);
CREATE POLICY "franchises_insert_admin" ON franchises FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);
CREATE POLICY "franchises_update_admin" ON franchises FOR UPDATE USING (
  auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);
CREATE POLICY "franchises_delete_admin" ON franchises FOR DELETE USING (
  auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);
