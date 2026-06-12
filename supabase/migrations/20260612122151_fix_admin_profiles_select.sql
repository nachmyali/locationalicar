-- Fix: ajout politique SELECT sur admin_profiles pour les admins
-- Sans cette politique, la sous-requête EXISTS dans les autres RLS est bloquée
CREATE POLICY "admin_profiles_select_own" ON admin_profiles
  FOR SELECT USING (
    auth.role() = 'authenticated' AND id = auth.uid()
  );
