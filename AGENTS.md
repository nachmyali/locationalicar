# AGENTS.md — INVOLOCATION (car rental SPA)

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Dev server on **port 3000** (not Vite default 5173) |
| `npm run build` | `tsc -b && vite build` — typecheck first, then bundle |
| `npm run lint` | ESLint 9 flat config (`eslint.config.js`) |
| `npm run preview` | `vite preview` — serve the production build locally |
| `npm run deploy` | `node scripts/build-gh-pages.mjs` — GH Pages build helper |

**No tests, no formatter.** Do not try `npm test` or `npm run format`.

## Architecture

- **SPA entry:** `src/main.tsx` → `src/App.tsx` (BrowserRouter wrapping Routes).
- **Public layout sections** (order, rendered inline in App.tsx):
  TopBar → Navbar → Hero → About → CarRentals → FAQ → Footer → PwaInstallBanner
- **Admin routes** at `/admin` — login, dashboard, unified cars page (Voitures + Tarifs + Transport + Configuration tabs), reservations list.
- **Path alias:** `@/*` → `src/*` (configured in both tsconfig.json and vite.config.ts).
- **GSAP + ScrollTrigger** for scroll animations (`src/hooks/useScrollAnimation.ts`).
- **shadcn/ui** new-york style, lucide icons, `cn()` at `@/lib/utils`.
- **Remaining shadcn components:** `calendar.tsx`, `popover.tsx`, `select.tsx` only. All others cleaned out.
- **React Router v7** — import from `react-router`, not `react-router-dom`.

## i18n & Currency

- **Primary language: French** (default, fallbackLng: `'fr'`). English secondary. i18next via `src/i18n.ts`.
- **Currency context** at `src/lib/currency.tsx` — supports EUR (default), USD, MAD. Conversion rates hardcoded inside the file. Default can also be set via `settings.default_currency` in Supabase.

## Season Logic

Haute saison = **July 1 → August 25** (configurable via admin `/admin/cars` → Configuration tab, stored in `settings` table). Outside that range is "normal" season. This affects pricing from the tariffs table.

## Supabase (Backend)

- **Client:** `src/lib/supabase.ts` — Supabase JS SDK, initialized from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Exports types `Car`, `Tariff`, `Reservation`, `TransportPrice`, `Setting`, `Franchise`, plus `CATEGORIES` constant and `CarCategory` type.
- **Tables:** `cars`, `tariffs`, `reservations`, `admin_profiles`, `transport_prices`, `settings`, `franchises`. Schema in `plan-supabase.md` and `scripts/migration-2026.sql`.
- **Admin auth:** Supabase Auth (email/password). Login at `/admin/login`. Protected by `ProtectedRoute.tsx`.
- **Seed:** `node scripts/seed.mjs` (requires `SUPABASE_SERVICE_ROLE_KEY` in `.env`). Creates admin user (`ysonouari@gmail.com` / `066790249`), reads cars from `public/data/cars.json`, inserts tariffs, transport prices, settings, and franchises.
- **Email:** Supabase Edge Function `send-email`. In dev, Vite proxy rewrites `/api/send-email` → edge function URL; in production hits the function directly.
- WhatsApp booking opens in parallel via external link.

## Deployment

- **GitHub Pages** via `.github/workflows/pages.yml` (pushes `dist/` to `gh-pages` branch, runs on push to **`main`**).
- **Vercel** also supported (`vercel.json` SPA rewrites).
- **Use `img(path)` from `@/lib/utils`** for asset paths — it resolves the BASE_URL for GH Pages.
- CI requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` secrets.

## PWA

- **VitePWA** plugin in `vite.config.ts` — generates production service worker. In dev, service worker is unregistered by `src/main.tsx:7-16`.
- `registerSW.js` / `sw.js` exist at root but are gitignored build artifacts.
- Workbox runtime caching: Google Fonts (1yr, max 10 entries), images (30d, max 50 entries, 3MB per file).

## Toolchain Quirks

- **`verbatimModuleSyntax: true`** in tsconfig — use `import type` for type-only imports.
- **`noUnusedLocals` / `noUnusedParameters`** are on (tsconfig.app.json).
- **`erasableSyntaxOnly: true`** in tsconfig — prohibits `enum`, `namespace`, parameter properties.
- **`kimi-plugin-inspect-react`** devDependency — a React attribute inspector plugin (not a standard Vite plugin).
- **`tw-animate-css`** devDependency — additional Tailwind animation utilities (beyond `tailwindcss-animate`).
- ESLint uses the new flat config format (`eslint.config.js`), not `.eslintrc`.
