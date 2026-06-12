-- Migration complète 2026 + fix RLS
-- Execute this in Supabase SQL Editor, then run: node scripts/seed.mjs

-- 1. Nouveaux tableaux
CREATE TABLE IF NOT EXISTS transport_prices (
  id SERIAL PRIMARY KEY,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  price_eur NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_location, to_location)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS franchises (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('CAT A','CAT B','CAT C','CAT D')),
  amount_eur NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category)
);

-- 2. RLS sur les nouveaux tableaux
ALTER TABLE transport_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;

-- 3. Fix RLS : remplacer FOR ALL USING par WITH CHECK pour INSERT
-- Cars
DROP POLICY IF EXISTS "cars_all_admin" ON cars;
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
