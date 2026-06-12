/**
 * Seed script — initialise Supabase avec :
 *   1. Admin user (email + mot de passe)
 *   2. 10 voitures (cars)
 *   3. 16 tarifs saisonniers (tariffs)
 *
 * Usage : node scripts/seed.mjs
 *
 * Prérequis : SUPABASE_SERVICE_ROLE_KEY dans .env
 * (Settings → API → service_role key dans le dashboard Supabase)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

config({ path: resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Erreur : VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Admin user ────────────────────────────────────────────

const ADMIN_EMAIL = 'contact@locationalicar.com';
const ADMIN_PASSWORD = '066790249';

async function createAdmin() {
  console.log(`\nCréation de l'admin : ${ADMIN_EMAIL}`);

  const { data: user, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
  });

  if (error) {
    if (error.message.includes('already been registered') || error.message.includes('already exists')) {
      console.log('  → Admin déjà existant');
      const { data: existing } = await supabase.auth.admin.listUsers();
      const found = existing?.users.find((u) => u.email === ADMIN_EMAIL);
      return found ?? null;
    }
    throw error;
  }

  console.log(`  ✓ Admin créé (ID: ${user.user.id})`);
  return user.user;
}

async function createAdminProfile(userId) {
  console.log('Création du profil admin...');

  const { error } = await supabase.from('admin_profiles').upsert(
    { id: userId, name: 'Admin AliCar' },
    { ignoreDuplicates: false },
  );

  if (error && !error.message.includes('violates foreign key')) {
    throw error;
  }
  console.log('  ✓ Profil admin créé');
}

// ─── Cars ──────────────────────────────────────────────────

const CARS = JSON.parse(
  readFileSync(resolve(__dirname, '../public/data/cars.json'), 'utf-8'),
);

async function seedCars() {
  console.log('\nInsertion des voitures...');

  const { error: delError } = await supabase.from('cars').delete().neq('id', 0);
  if (delError) throw delError;

  const { error } = await supabase.from('cars').insert(
    CARS.map((car) => ({
      id: car.id,
      name: car.name,
      category: car.category,
      price: car.price,
      duration: car.duration || 'jour',
      seats: car.seats,
      transmission: car.transmission,
      doors: car.doors,
      fuel: car.fuel,
      image: car.image,
      active: true,
    })),
  );

  if (error) throw error;
  console.log(`  ✓ ${CARS.length} voitures insérées`);
}

// ─── Tariffs ───────────────────────────────────────────────

const TARIFFS = [
  { category: 'CAT A', min_days: 1, max_days: 4, normal_rate: 30, haute_rate: 43 },
  { category: 'CAT A', min_days: 5, max_days: 8, normal_rate: 25, haute_rate: 38 },
  { category: 'CAT A', min_days: 9, max_days: 21, normal_rate: 23, haute_rate: 33 },
  { category: 'CAT A', min_days: 22, max_days: 999, normal_rate: 20, haute_rate: 28 },
  { category: 'CAT B', min_days: 1, max_days: 4, normal_rate: 35, haute_rate: 50 },
  { category: 'CAT B', min_days: 5, max_days: 8, normal_rate: 30, haute_rate: 45 },
  { category: 'CAT B', min_days: 9, max_days: 21, normal_rate: 27, haute_rate: 40 },
  { category: 'CAT B', min_days: 22, max_days: 999, normal_rate: 25, haute_rate: 35 },
  { category: 'CAT C', min_days: 1, max_days: 4, normal_rate: 45, haute_rate: 55 },
  { category: 'CAT C', min_days: 5, max_days: 8, normal_rate: 42, haute_rate: 50 },
  { category: 'CAT C', min_days: 9, max_days: 21, normal_rate: 38, haute_rate: 45 },
  { category: 'CAT C', min_days: 22, max_days: 999, normal_rate: 35, haute_rate: 40 },
  { category: 'CAT D', min_days: 1, max_days: 4, normal_rate: 70, haute_rate: 80 },
  { category: 'CAT D', min_days: 5, max_days: 8, normal_rate: 60, haute_rate: 75 },
  { category: 'CAT D', min_days: 9, max_days: 21, normal_rate: 50, haute_rate: 70 },
  { category: 'CAT D', min_days: 22, max_days: 999, normal_rate: 40, haute_rate: 60 },
];

async function seedTariffs() {
  console.log('Insertion des tarifs...');

  const { error: delError } = await supabase.from('tariffs').delete().neq('id', 0);
  if (delError) throw delError;

  const { error } = await supabase.from('tariffs').insert(TARIFFS);

  if (error) throw error;
  console.log(`  ✓ ${TARIFFS.length} tarifs insérés`);
}

// ─── Settings ──────────────────────────────────────────────

const SETTINGS = [
  { key: 'haute_saison_start', value: '07-01' },
  { key: 'haute_saison_end', value: '08-25' },
];

async function seedSettings() {
  console.log('Insertion des paramètres...');
  const { error } = await supabase.from('settings').upsert(SETTINGS, { ignoreDuplicates: false });
  if (error) throw error;
  console.log(`  ✓ ${SETTINGS.length} paramètres insérés`);
}

// ─── Franchises ───────────────────────────────────────────

const FRANCHISES = [
  { category: 'CAT A', amount_eur: 350 },
  { category: 'CAT B', amount_eur: 600 },
  { category: 'CAT C', amount_eur: 700 },
  { category: 'CAT D', amount_eur: 1200 },
];

async function seedFranchises() {
  console.log('Insertion des franchises...');
  const { error: delError } = await supabase.from('franchises').delete().neq('id', 0);
  if (delError && !delError.message.includes('does not exist')) throw delError;

  const { error } = await supabase.from('franchises').insert(FRANCHISES);
  if (error && !error.message.includes('does not exist')) throw error;
  console.log(`  ✓ ${FRANCHISES.length} franchises insérées`);
}

// ─── Transport Prices ─────────────────────────────────────

const LOCATIONS = [
  'Marrakech Ville', 'Marrakech Aéroport',
  'Casablanca Ville', 'Casablanca Aéroport',
  'Agadir Ville', 'Agadir Aéroport',
  'Tanger Ville', 'Tanger Aéroport',
  'Essaouira Ville', 'Essaouira Aéroport',
  'Rabat Ville', 'Rabat Aéroport',
  'Fès Ville', 'Fès Aéroport',
  'Ouarzazate Ville', 'Ouarzazate Aéroport',
];

function buildTransportPrices() {
  const prices = [];

  function add(from, to, price) {
    if (from !== to) {
      prices.push({ from_location: from, to_location: to, price_eur: price });
    }
  }

  const M = 'Marrakech Ville', MA = 'Marrakech Aéroport';
  const C = 'Casablanca Ville', CA = 'Casablanca Aéroport';
  const A = 'Agadir Ville', AA = 'Agadir Aéroport';
  const T = 'Tanger Ville', TA = 'Tanger Aéroport';
  const E = 'Essaouira Ville', EA = 'Essaouira Aéroport';
  const R = 'Rabat Ville', RA = 'Rabat Aéroport';
  const F = 'Fès Ville', FA = 'Fès Aéroport';
  const O = 'Ouarzazate Ville', OA = 'Ouarzazate Aéroport';

  // Marrakech
  add(M, C, 53); add(M, CA, 53); add(M, A, 53); add(M, AA, 53); add(M, T, 125); add(M, TA, 125); add(M, E, 53); add(M, EA, 53); add(M, R, 63); add(M, RA, 63); add(M, F, 115); add(M, FA, 115); add(M, O, 53); add(M, OA, 53);
  add(MA, C, 53); add(MA, CA, 53); add(MA, A, 53); add(MA, AA, 53); add(MA, T, 125); add(MA, TA, 125); add(MA, E, 53); add(MA, EA, 53); add(MA, R, 63); add(MA, RA, 63); add(MA, F, 115); add(MA, FA, 115); add(MA, O, 53); add(MA, OA, 53);

  // Casablanca
  add(C, M, 53); add(C, MA, 53); add(C, A, 105); add(C, AA, 105); add(C, T, 180); add(C, TA, 175); add(C, E, 105); add(C, EA, 105); add(C, R, 115); add(C, RA, 115); add(C, F, 165); add(C, FA, 165);
  add(CA, M, 53); add(CA, MA, 53); add(CA, A, 105); add(CA, AA, 105); add(CA, T, 180); add(CA, TA, 175); add(CA, E, 105); add(CA, EA, 53); add(CA, R, 115); add(CA, RA, 115); add(CA, F, 165); add(CA, FA, 165);

  // Agadir
  add(A, M, 53); add(A, MA, 53); add(A, C, 105); add(A, CA, 105); add(A, T, 175); add(A, TA, 175); add(A, E, 105); add(A, EA, 105); add(A, R, 115); add(A, RA, 115); add(A, F, 165); add(A, FA, 165);
  add(AA, M, 53); add(AA, MA, 53); add(AA, C, 105); add(AA, CA, 105); add(AA, T, 175); add(AA, TA, 175); add(AA, E, 105); add(AA, EA, 105); add(AA, R, 115); add(AA, RA, 115); add(AA, F, 165); add(AA, FA, 165);

  // Tanger
  add(T, M, 125); add(T, MA, 130); add(T, C, 180); add(T, CA, 180); add(T, A, 175); add(T, AA, 175); add(T, E, 155); add(T, EA, 175); add(T, R, 185); add(T, RA, 185); add(T, F, 235); add(T, FA, 235);
  add(TA, M, 125); add(TA, MA, 125); add(TA, C, 175); add(TA, CA, 175); add(TA, A, 175); add(TA, AA, 175); add(TA, E, 155); add(TA, EA, 175); add(TA, R, 185); add(TA, RA, 185); add(TA, F, 235); add(TA, FA, 235);

  // Essaouira
  add(E, M, 53); add(E, MA, 53); add(E, C, 105); add(E, CA, 105); add(E, A, 105); add(E, AA, 105); add(E, T, 175); add(E, TA, 175); add(E, R, 115); add(E, RA, 115); add(E, F, 165); add(E, FA, 165);
  add(EA, M, 53); add(EA, MA, 53); add(EA, C, 105); add(EA, CA, 53); add(EA, A, 105); add(EA, AA, 105); add(EA, T, 175); add(EA, TA, 175); add(EA, R, 115); add(EA, RA, 115); add(EA, F, 165); add(EA, FA, 165);

  // Rabat
  add(R, M, 63); add(R, MA, 63); add(R, C, 115); add(R, CA, 110); add(R, A, 115); add(R, AA, 115); add(R, T, 185); add(R, TA, 185); add(R, E, 115); add(R, EA, 115); add(R, F, 175); add(R, FA, 175);
  add(RA, M, 63); add(RA, MA, 63); add(RA, C, 110); add(RA, CA, 115); add(RA, A, 115); add(RA, AA, 115); add(RA, T, 185); add(RA, TA, 185); add(RA, E, 115); add(RA, EA, 115); add(RA, F, 175); add(RA, FA, 175);

  // Fès
  add(F, M, 115); add(F, MA, 115); add(F, C, 165); add(F, CA, 165); add(F, A, 165); add(F, AA, 165); add(F, T, 235); add(F, TA, 235); add(F, E, 165); add(F, EA, 165); add(F, R, 175); add(F, RA, 175);
  add(FA, M, 115); add(FA, MA, 115); add(FA, C, 165); add(FA, CA, 165); add(FA, A, 165); add(FA, AA, 165); add(FA, T, 235); add(FA, TA, 235); add(FA, E, 165); add(FA, EA, 165); add(FA, R, 175); add(FA, RA, 175);

  // Ouarzazate
  add(O, M, 53); add(O, MA, 53); add(O, C, 105); add(O, CA, 105); add(O, A, 105); add(O, AA, 105); add(O, T, 175); add(O, TA, 175); add(O, E, 105); add(O, EA, 105); add(O, R, 115); add(O, RA, 115); add(O, F, 165); add(O, FA, 165);
  add(OA, M, 53); add(OA, MA, 53); add(OA, C, 105); add(OA, CA, 105); add(OA, A, 105); add(OA, AA, 105); add(OA, T, 175); add(OA, TA, 175); add(OA, E, 105); add(OA, EA, 105); add(OA, R, 115); add(OA, RA, 115); add(OA, F, 165); add(OA, FA, 165);

  return prices;
}

async function seedTransportPrices() {
  console.log('Insertion des prix transport...');

  const { error: delError } = await supabase.from('transport_prices').delete().neq('id', 0);
  if (delError && !delError.message.includes('does not exist')) throw delError;

  const prices = buildTransportPrices();
  const { error } = await supabase.from('transport_prices').insert(prices);
  if (error && !error.message.includes('does not exist')) throw error;
  console.log(`  ✓ ${prices.length} prix transport insérés`);
}

// ─── Main ──────────────────────────────────────────────────

async function main() {
  console.log('=== Seed Supabase ===\n');

  try {
    const adminUser = await createAdmin();
    if (adminUser?.id) {
      await createAdminProfile(adminUser.id);
    } else {
      console.log('  ⏭ Profil admin déjà existant, ignoré');
    }
    await seedCars();
    await seedTariffs();
    await seedSettings();
    await seedFranchises();
    await seedTransportPrices();

    console.log(`\n✅ Terminé ! Connectez-vous sur /admin/login avec :
   Email    : ${ADMIN_EMAIL}
   Mot de passe : ${ADMIN_PASSWORD}
`);
  } catch (err) {
    console.error('\n❌ Erreur :', err.message);
    process.exit(1);
  }
}

main();
