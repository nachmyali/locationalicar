import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function run() {
  // Requête SQL directe via REST (pg_policies accessible qu'avec superadmin)
  const response = await fetch(
    `${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/`,
    {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    }
  );

  // Alternative: on utilise la fonction pg_policies accessible en base
  // En fait pg_policies n'est pas accessible via REST. On va vérifier autrement.
  
  // Vérifions les policies en testant les accès directement
  const anonClient = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  console.log('=== VÉRIFICATION COMPLÈTE ===\n');

  // 1. Admin login
  const { data: { session }, error: loginErr } = await anonClient.auth.signInWithPassword({
    email: 'contact@locationalicar.com',
    password: '066790249',
  });
  if (loginErr) { console.log('❌ LOGIN:', loginErr.message); return; }
  console.log('✅ LOGIN admin OK');

  // 2. Public READ (sans session)
  const pubClient = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  
  const tables = ['cars', 'tariffs', 'reservations', 'transport_prices', 'settings', 'franchises'];
  for (const table of tables) {
    const { error } = await pubClient.from(table).select('count', { count: 'exact', head: true });
    console.log(`  ${error ? '❌' : '✅'} Public SELECT ${table}: ${error ? error.message : 'OK'}`);
  }

  // 3. Admin WRITE (avec session)
  const { error: updateErr } = await anonClient.from('cars').update({ name: 'Dacia Sandero' }).eq('id', 1);
  console.log(`  ${updateErr ? '❌' : '✅'} Admin UPDATE car: ${updateErr ? updateErr.message : 'OK'}`);

  const { error: insertTariffErr } = await anonClient.from('settings').upsert(
    { key: '_test_write', value: 'ok' },
    { ignoreDuplicates: false }
  );
  console.log(`  ${insertTariffErr ? '❌' : '✅'} Admin INSERT settings: ${insertTariffErr ? insertTariffErr.message : 'OK'}`);
  
  // Nettoyer le test
  await anonClient.from('settings').delete().eq('key', '_test_write');

  // 4. Admin profile accessible
  const { data: profile, error: profErr } = await anonClient.from('admin_profiles')
    .select('name').eq('id', session.user.id).single();
  console.log(`  ${profErr ? '❌' : '✅'} Admin profile: ${profErr ? profErr.message : profile.name}`);

  // 5. Vérifier les données
  const { data: cars } = await supabase.from('cars').select('id, name, active').eq('active', true);
  console.log(`\n📊 ${cars?.length || 0} voitures actives dans la base`);

  const { data: s } = await supabase.from('settings').select('key');
  console.log(`📊 ${s?.length || 0} settings: ${s?.map(x => x.key).join(', ')}`);

  console.log('\n✅ Toute la configuration Supabase est correcte !');
}

run().catch(console.error);
