# GastroStock — Setup Guide

## Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase CLI (`npm i -g supabase`)
- A Supabase project (cloud or local)

---

## 1. Clone & Install

```bash
git clone <repo-url>
cd trading-app
pnpm install
```

---

## 2. Environment Variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Where to find |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API (secret) |

Optional:

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_DEFAULT_LOCATION_SLUG` | — | Pre-select a location in forms |
| `NEXT_PUBLIC_APP_ENV` | `development` | `development` / `staging` / `production` |
| `FEATURE_EXPORT_EXCEL` | `true` | Enable Excel export buttons |
| `FEATURE_PHYSICAL_COUNTS` | `true` | Enable physical count module |
| `FEATURE_TRANSFERS` | `true` | Enable transfers module |

---

## 3. Database Migrations

### Option A: Local Supabase (recommended for dev)

```bash
supabase start
supabase db reset          # applies all migrations in order
supabase db seed           # applies supabase/seed.sql
```

### Option B: Remote Supabase

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Migration order:

```
0001_extensions.sql       → pg_trgm, unaccent, pgcrypto
0002_core_tables.sql      → roles, users, locations, user_locations, categories, units
0003_inventory_tables.sql → products, stock_balances, stock_movements, alerts
0004_legacy_tables.sql    → suppliers, purchases, transfers, physical counts
0005_indexes.sql          → performance indexes, trigram search
0006_rls_enable.sql       → enable RLS on all tables
0007_rls_policies.sql     → row-level security policies
0008_functions.sql        → helper functions, generate_sku, record_movement, views
0009_triggers.sql         → updated_at triggers, auth sync, code generation
```

---

## 4. Seed Data

The seed file creates:

- 4 roles: `admin`, `supervisor`, `encargado`, `read_only`
- 6 locations: Umo Grill, Puerto Gelato, Brooklyn, Trento Café, Eventos, Shopping
- 12 units (kg, L, u, bot, caj, etc.)
- 12 categories with SKU prefixes (CAR, VER, BEB, LAC, PAN, SAL, FRU, ABA, LIM, DES, HEL, CAF)
- 15 sample products with legacy SKUs
- 5 suppliers

---

## 5. Create Admin User

After running migrations, create your first user via Supabase Auth, then promote them to admin:

```sql
-- In Supabase SQL editor:
UPDATE public.users
SET role = 'admin'
WHERE email = 'your@email.com';
```

Or use the Supabase Dashboard → Authentication → Users.

---

## 6. Run Dev Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 7. User Roles

| Role | Access |
|---|---|
| `admin` | Full system access, user management, all locations |
| `supervisor` | Product management, reports, assigned locations |
| `encargado` | Stock operations (movements, purchases) for assigned locations |
| `read_only` | View-only access for assigned locations |

To assign locations to a user, run in SQL or build a UI:

```sql
INSERT INTO user_locations (user_id, location_id, is_primary)
VALUES ('<user-uuid>', '<location-uuid>', true);
```

---

## 8. Project Structure

```
src/
├── app/
│   ├── (auth)/login/          Login page
│   ├── (app)/                 Authenticated shell
│   │   ├── dashboard/         Main dashboard
│   │   ├── products/          Product catalog
│   │   ├── movements/         Stock movement history
│   │   ├── outputs/           Batch output form
│   │   ├── purchases/         Purchase entry management
│   │   ├── transfers/         Inter-location transfers
│   │   ├── counts/            Physical inventory counts
│   │   ├── history/           Full movement history
│   │   ├── alerts/            Low-stock alerts
│   │   └── settings/users/    User management (admin)
│   └── api/                   API route handlers
├── components/
│   ├── ui/                    Design system primitives
│   ├── forms/                 Reusable form components
│   ├── tables/                Data table components
│   ├── alerts/                Alert/notification components
│   ├── counts/                Physical count components
│   ├── transfers/             Transfer components
│   ├── history/               History view components
│   └── layout/                Shell, sidebar, header
└── lib/
    ├── supabase/              Supabase client (browser/server/middleware)
    ├── auth/                  Session, permissions
    ├── server/                Server-side service layer
    ├── schemas/               Zod validation schemas
    ├── validations/           Business logic validators
    ├── utils/                 format, cn, export helpers
    └── export/                Excel export mappers
supabase/
├── migrations/                SQL migrations (0001–0009)
└── seed.sql                   Development seed data
```

---

## 9. Tech Stack

- **Framework**: Next.js 15 App Router
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS + custom design tokens
- **Database**: Supabase (PostgreSQL + Auth + RLS + Realtime)
- **Forms**: React Hook Form + Zod
- **Data fetching**: TanStack Query (client) + server components (SSR)
- **UI components**: shadcn/ui (Radix primitives)
- **Icons**: lucide-react
- **Animations**: framer-motion
- **Export**: xlsx (Excel workbooks)

---

## 10. Common Issues

**RLS blocking queries**: Make sure your user has a row in `public.users` and the correct role. The `handle_new_auth_user` trigger creates it on sign-up with `read_only` role — promote as needed.

**SKU generation fails**: The `generate_sku()` function requires the category to have a non-null `prefix` and `is_active = true`.

**Migration order errors**: Always run migrations in order. `0007_rls_policies.sql` depends on functions from `0008_functions.sql` — make sure `0008` runs first if applying individually (the numbered order handles this when using `supabase db reset`).

**Service role key missing**: The `SUPABASE_SERVICE_ROLE_KEY` is only needed server-side (never exposed to the browser). If you see "service role not configured" errors in seed scripts, check your `.env.local`.
