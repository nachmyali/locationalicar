# Configuration Supabase — Yahya Car

Ce document décrit exhaustivement la configuration Supabase utilisée par l'application. Il permet de recréer à l'identique l'ensemble de l'infrastructure sur un nouveau projet Supabase.

---

## Table des matières

1. [Création du projet](#1-création-du-projet)
2. [Variables d'environnement](#2-variables-denvironnement)
3. [Authentication (Auth)](#3-authentication-auth)
4. [Tables de la base de données](#4-tables-de-la-base-de-données)
5. [Row Level Security (RLS)](#5-row-level-security-rls)
6. [Storage Buckets](#6-storage-buckets)
7. [Edge Functions](#7-edge-functions)
8. [Données initiales (seed)](#8-données-initiales-seed)
9. [CI/CD](#9-cicd)
10. [Proxy de développement](#10-proxy-de-développement)
11. [Fichiers à modifier dans le code](#11-fichiers-à-modifier-dans-le-code)

---

## 1. Création du projet

1. Créez un projet sur [app.supabase.com](https://app.supabase.com)
2. Notez les informations suivantes depuis **Settings → API** :
   - **Project URL** (ex: `https://XXXXXXXXXXXXXXX.supabase.co`)
   - **Project Reference ID** (ex: `XXXXXXXXXXXXXXX`)
   - **Anon Key** (clé publique, commence par `eyJ...`)
   - **Service Role Key** (clé admin, **ne jamais exposer côté client**)

---

## 2. Variables d'environnement

### Fichier `.env` (local)

```env
# Supabase — obligatoires
VITE_SUPABASE_URL=https://XXXXXXXXXXXXXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Seed script uniquement (Settings → API → service_role key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Récapitulatif des variables

| Variable | Utilisation | Endroit |
|---|---|---|
| `VITE_SUPABASE_URL` | Initialisation du client Supabase, appels Edge Function | `src/lib/supabase.ts`, `src/lib/email.ts`, `vite.config.ts`, seed script |
| `VITE_SUPABASE_ANON_KEY` | Initialisation du client Supabase (côté client) | `src/lib/supabase.ts`, CI/CD |
| `SUPABASE_SERVICE_ROLE_KEY` | Seed script (bypass RLS), Edge Function (Deno) | `scripts/seed.mjs`, `supabase/functions/send-email/index.ts` |
| `SUPABASE_URL` | Identique à `VITE_SUPABASE_URL`, utilisé côté Deno | Edge Function `send-email` |
| `SUPABASE_SERVICE_ROLE_KEY` | Idem, utilisé côté Deno | Edge Function `send-email` |

---

## 3. Authentication (Auth)

### Méthode d'authentification

- **Provider :** Email / Password (uniquement)
- **Inscription :** Désactivée (les admins sont créés via seed script avec `supabase.auth.admin.createUser()`)
- **Session :** Gérée par `supabase.auth.getSession()` et `supabase.auth.onAuthStateChange()` dans `ProtectedRoute.tsx`

### Compte admin unique

- **Email :** `contact@locationalicar.com`
- **Mot de passe :** `066790249`
- Créé via `scripts/seed.mjs` avec `email_confirm: true`
- Lié à la table `admin_profiles` via `auth.users.id`

### Pages utilisant l'auth

| Page | Opération |
|---|---|
| `/admin/login` | `supabase.auth.signInWithPassword()` |
| AdminLayout | `supabase.auth.signOut()` |
| ProtectedRoute | `supabase.auth.getSession()`, `supabase.auth.onAuthStateChange()` |

---

## 4. Tables de la base de données

Exécuter les scripts SQL suivants dans l'ordre, dans le **SQL Editor** de Supabase.

### 4.1 — Tables principales (`plan-supabase.md`)

```sql
-- 1. Cars (catalogue)
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

-- 2. Tariffs (grille saisonnière)
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

-- 4. Admin profiles (lié à auth.users)
CREATE TABLE IF NOT EXISTS admin_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id),
  name        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 — Tables supplémentaires (`scripts/migration-complete.sql`)

```sql
-- 5. Transport prices
CREATE TABLE IF NOT EXISTS transport_prices (
  id SERIAL PRIMARY KEY,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  price_eur NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_location, to_location)
);

-- 6. Settings (key-value)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Franchises (assurance)
CREATE TABLE IF NOT EXISTS franchises (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('CAT A','CAT B','CAT C','CAT D')),
  amount_eur NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category)
);
```

### Schéma relationnel simplifié

```
auth.users (géré par Supabase)
  └── admin_profiles (id → auth.users.id)

cars, tariffs, franchises     → liés par category ('CAT A'…'CAT D')
reservations                  → table autonome (contient les données dénormalisées)
settings                      → key-value global
transport_prices              → from_location → to_location avec prix
```

---

## 5. Row Level Security (RLS)

Activer RLS sur **toutes les tables**, puis appliquer les politiques ci-dessous.

Exécuter l'intégralité de `scripts/migration-complete.sql` dans le SQL Editor.

### Principe général

| Accès | Condition |
|---|---|
| **Lecture publique** | `FOR SELECT USING (true)` |
| **Écriture admin** | `auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())` |

### 5.1 — Table `cars`

```sql
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

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
```

### 5.2 — Table `tariffs`

```sql
ALTER TABLE tariffs ENABLE ROW LEVEL SECURITY;

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
```

### 5.3 — Table `reservations`

```sql
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

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
```

### 5.4 — Table `transport_prices`

```sql
ALTER TABLE transport_prices ENABLE ROW LEVEL SECURITY;

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
```

### 5.5 — Table `settings`

```sql
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

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
```

### 5.6 — Table `franchises`

```sql
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;

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
```

---

## 6. Storage Buckets

### Bucket `car-images`

| Propriété | Valeur |
|---|---|
| Nom | `car-images` |
| Usage | Upload d'images de voitures depuis l'admin (`CarForm.tsx`) |
| Public | **Oui** (les images sont servies publiquement via `getPublicUrl()`) |

### Politiques de sécurité (Storage)

Dans le dashboard Supabase → Storage → `car-images` → Policies, configurer :

```sql
-- Lecture publique de tous les fichiers
CREATE POLICY "car_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'car-images');

-- Upload réservé aux admins authentifiés
CREATE POLICY "car_images_insert_admin" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'car-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );
```

### Utilisation dans le code

| Fichier | Ligne | Opération |
|---|---|---|
| `src/components/admin/CarForm.tsx:64` | `supabase.storage.from('car-images').upload(fileName, file)` | Upload |
| `src/components/admin/CarForm.tsx:71` | `supabase.storage.from('car-images').getPublicUrl(fileName)` | Récupération URL publique |

---

## 7. Edge Functions

### Fonction `send-email`

| Propriété | Valeur |
|---|---|
| Nom | `send-email` |
| Runtime | Deno (`https://deno.land/std@0.168.0/http/server.ts`) |
| Chemin source | `supabase/functions/send-email/index.ts` |
| JWT | Désactivé (`--no-verify-jwt`) |
| CORS | `Access-Control-Allow-Origin: *` |

### Endpoints

| Type | Méthode | Description |
|---|---|---|
| `reservation_status` | POST | Envoie un email de notification de réservation |
| `test` | POST | Envoie un email de test SMTP |

### Variables d'environnement (Deno)

| Variable | Valeur |
|---|---|
| `SUPABASE_URL` | `https://XXXXXXXXXXXXXXX.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key du projet |

### Flux

1. Le frontend appelle `POST /api/send-email` (dev) ou `POST https://<ref>.supabase.co/functions/v1/send-email` (prod)
2. L'Edge Function lit les paramètres SMTP depuis la table `settings` (clés `smtp_host`, `smtp_port`, `smtp_email`, `smtp_password`, `smtp_from_name`)
3. Elle envoie l'email via `nodemailer` (SMTP Gmail)
4. Elle retourne `{ ok: true, messageId: "..." }` ou `{ ok: false, error: "..." }`

### Déploiement

```bash
# Installer Supabase CLI (une seule fois)
# npm install -g supabase

# Lier le projet
npx supabase link --project-ref XXXXXXXXXXXXXXX

# Déployer
npx supabase functions deploy send-email --no-verify-jwt
```

### SMTP par défaut dans le code

En l'absence de configuration dans la table `settings`, l'Edge Function utilise :

```json
{
  "smtp_host": "smtp.gmail.com",
  "smtp_port": "587",
  "smtp_from_name": "Yahya Car"
}
```

---

## 8. Données initiales (seed)

Le script `scripts/seed.mjs` initialise la base de données.

### Prérequis

```env
VITE_SUPABASE_URL=https://XXXXXXXXXXXXXXX.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Settings → API → service_role key
```

### Exécution

```bash
node scripts/seed.mjs
```

### Données insérées

#### 8.1 — Admin user

| Champ | Valeur |
|---|---|
| Email | `contact@locationalicar.com` |
| Mot de passe | `066790249` |
| Profil | `{ name: 'Admin Yahya Car' }` |

#### 8.2 — Voitures (10)

Lues depuis `public/data/cars.json`.

#### 8.3 — Tarifs (16 entrées)

| Catégorie | 1-4 jours | 5-8 jours | 9-21 jours | 22+ jours |
|---|---|---|---|---|
| **CAT A** | 30/43 € | 25/38 € | 23/33 € | 20/28 € |
| **CAT B** | 35/50 € | 30/45 € | 27/40 € | 25/35 € |
| **CAT C** | 45/55 € | 42/50 € | 38/45 € | 35/40 € |
| **CAT D** | 70/80 € | 60/75 € | 50/70 € | 40/60 € |

(Valeurs : `normal_rate` / `haute_rate`)

#### 8.4 — Settings

| key | value |
|---|---|
| `haute_saison_start` | `07-01` |
| `haute_saison_end` | `08-25` |

#### 8.5 — Franchises

| Catégorie | Montant (EUR) |
|---|---|
| CAT A | 350 |
| CAT B | 600 |
| CAT C | 700 |
| CAT D | 1200 |

#### 8.6 — Transport prices

Trajets entre 16 localités (8 villes × 2 variantes : Ville + Aéroport) :

- Marrakech Ville / Aéroport
- Casablanca Ville / Aéroport
- Agadir Ville / Aéroport
- Tanger Ville / Aéroport
- Essaouira Ville / Aéroport
- Rabat Ville / Aéroport
- Fès Ville / Aéroport
- Ouarzazate Ville / Aéroport

#### 8.7 — Drivers settings

| key | value |
|---|---|
| enabled | true |
| price_per_hour | 10 |
| half_day_price | 40 |
| full_day_price | 70 |
| price_24h | 120 |
| airport_extra | 15 |
| night_extra | 20 |

---

## 9. CI/CD

### GitHub Actions (`.github/workflows/pages.yml`)

Le build nécessite les secrets suivants dans le dépôt GitHub :

**Settings → Secrets and variables → Actions → Repository secrets**

| Secret | Valeur |
|---|---|
| `VITE_SUPABASE_URL` | `https://XXXXXXXXXXXXXXX.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Anon key du projet |

Ces variables sont injectées au moment du `npm run build` :

```yaml
- run: npm run build
  env:
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

### Vercel

Le projet peut aussi être déployé sur Vercel. Ajouter les mêmes variables dans le dashboard Vercel :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 10. Proxy de développement

En développement local, le proxy Vite redirige `/api/send-email` vers l'Edge Function Supabase.

Dans `vite.config.ts` :

```ts
server: {
  port: 3000,
  proxy: {
    '/api/send-email': {
      target: 'https://XXXXXXXXXXXXXXX.supabase.co/functions/v1/send-email',
      changeOrigin: true,
      rewrite: () => '',
    },
  },
},
```

Le code client (`src/lib/email.ts`) détecte automatiquement `localhost` et utilise le proxy :

```ts
function getEndpoint(): string {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return DEV_PROXY_URL;     // '/api/send-email'
  }
  return SUPABASE_EDGE_URL;   // 'https://<ref>.supabase.co/functions/v1/send-email'
}
```

---

## 11. Fichiers à modifier dans le code

Lors du changement de projet Supabase, modifier les 3 fichiers suivants :

### 11.1 — `.env`

```env
VITE_SUPABASE_URL=https://NOUVEAU_PROJET.supabase.co
VITE_SUPABASE_ANON_KEY=nouvelle_clé_anon
SUPABASE_SERVICE_ROLE_KEY=nouvelle_clé_service_role
```

### 11.2 — `src/lib/email.ts` (ligne 1)

```ts
const SUPABASE_EDGE_URL = 'https://NOUVEAU_PROJET.supabase.co/functions/v1/send-email';
```

### 11.3 — `vite.config.ts` (lignes 72-77)

```ts
proxy: {
  '/api/send-email': {
    target: 'https://NOUVEAU_PROJET.supabase.co/functions/v1/send-email',
    changeOrigin: true,
    rewrite: () => '',
  },
},
```

---

## Résumé des dépendances

| Package | Version | Utilisation |
|---|---|---|
| `@supabase/supabase-js` | `^2.106.2` | Client SDK (frontend + seed) |
| `@supabase/supabase-js` (Deno) | `@2` | Edge Function (esm.sh) |
| `nodemailer` (Deno) | `@6.9.16` | Envoi d'emails SMTP (Edge Function) |
| `Deno` (std) | `@0.168.0` | HTTP server (Edge Function) |

---

## Procédure complète de migration (checklist)

- [ ] Créer le projet Supabase
- [ ] Récupérer Project URL, Anon Key, Service Role Key
- [ ] Exécuter les scripts SQL dans cet ordre :
  1. Création des 8 tables (sections 4.1 + 4.2)
  2. Activation RLS et politiques (section 5)
- [ ] Activer Auth Email/Password (section 3)
- [ ] Créer le bucket Storage `car-images` et ses politiques (section 6)
- [ ] Déployer l'Edge Function `send-email` (section 7)
- [ ] Mettre à jour `.env` avec les nouvelles clés
- [ ] Modifier `src/lib/email.ts` et `vite.config.ts`
- [ ] Exécuter `node scripts/seed.mjs`
- [ ] Vérifier que `/admin/login` fonctionne
- [ ] Mettre à jour les secrets GitHub Actions (section 9)

---

## À propos — Yahya Car

**Site web :** [locationalicar.com](https://locationalicar.com)

**Slogan :** Où la qualité rencontre l'abordabilité.

**Services :**
- **Services haut de gamme** — Là où le luxe rencontre un soin exceptionnel, créant des moments inoubliables et dépassant toutes vos attentes.
- **Assistance routière 24h/24** — Un soutien fiable quand vous en avez le plus besoin, pour rouler en toute confiance et tranquillité d'esprit.
- **Qualité au meilleur prix** — Des véhicules de qualité à des tarifs compétitifs, pour une valeur maximale sans compromis.
- **Prise en charge & restitution** — Profitez de nos services de livraison et de récupération pour une expérience de location encore plus pratique.

**Coordonnées :**
| Info | Valeur |
|---|---|
| Adresse | Bld Fouarat CC N°22, Hay Mohammadi, Casablanca |
| Téléphone | `+212 644-045555` |
| Email | `contact@locationalicar.com` |
| Site web | `https://locationalicar.com` |
