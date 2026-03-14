# Trading App — README

> Multi-location stock management system · MVP v1.0 · Next.js 15 + Supabase

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Validate env vars
pnpm tsx scripts/env-check.ts

# 4. Run the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (server only — never expose) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Canonical app URL (e.g. `https://app.mycompany.com`) |
| `SENTRY_DSN` | optional | Error tracking |
| `GOOGLE_CLIENT_ID` | optional | Google Sheets sync (Post-MVP) |
| `GOOGLE_CLIENT_SECRET` | optional | Google Sheets sync (Post-MVP) |

---

## Project Structure

```
src/
├── app/
│   ├── (app)/                    # Authenticated app shell
│   │   ├── dashboard/            # Stock overview & KPIs
│   │   ├── products/             # Product catalog
│   │   ├── purchases/            # Purchase orders & receiving
│   │   ├── transfers/            # Inter-location transfers
│   │   ├── counts/               # Physical inventory counts
│   │   ├── history/              # Movement ledger
│   │   ├── migration/            # Legacy data migration wizard
│   │   └── settings/             # Roles, permissions, system status
│   ├── (auth)/
│   │   └── login/                # Authentication
│   └── api/                      # API route handlers
│       ├── products/
│       ├── purchases/
│       ├── transfers/
│       ├── counts/
│       ├── movements/
│       ├── stock/
│       ├── migration/
│       └── system/
├── components/
│   ├── ui/                       # Shared UI primitives
│   ├── feedback/                 # Toast, empty state, error state
│   ├── guards/                   # Permission & location guards
│   ├── polish/                   # Command bar, location switcher
│   ├── settings/                 # System status, roles matrix
│   ├── migration/                # Migration-specific components
│   └── forms/                    # Reusable form components
├── hooks/                        # Client-side React hooks
├── lib/
│   ├── server/                   # Server-only data access & utilities
│   ├── constants/                # Permissions, roles, static config
│   ├── validations/              # Shared Zod schemas
│   ├── export/                   # Excel export generators
│   ├── migration/                # Legacy data parsers & mappers
│   ├── supabase/                 # Supabase client setup
│   └── utils/                    # Formatting, dates, numbers
scripts/
├── smoke-checklist.ts            # HTTP smoke tests against live URL
├── final-data-sanity-check.ts    # DB data integrity checks
├── route-consistency-check.ts    # File system route presence check
└── env-check.ts                  # Env var validation
docs/
├── MVP_CLOSEOUT.md               # What was built, architecture summary
├── PRODUCTION_CHECKLIST.md       # Step-by-step pre-launch checklist
├── KNOWN_ISSUES.md               # Accepted issues with workarounds
├── POST_MVP_BACKLOG.md           # 22-item roadmap (P1/P2/P3)
├── SMOKE_TEST_PLAN.md            # Manual test checklist
└── RELEASE_NOTES_DRAFT.md       # v1.0 release notes
tests/
├── setup.ts                      # Vitest setup & Supabase mocks
├── unit/                         # Unit tests
└── integration/                  # Integration tests with mock DB
```

---

## Available Scripts

```bash
# Development
pnpm dev                          # Start dev server
pnpm build                        # Production build
pnpm start                        # Start production server
pnpm lint                         # ESLint
pnpm typecheck                    # TypeScript check (tsc --noEmit)

# Testing
pnpm test                         # Run Vitest suite
pnpm test:watch                   # Watch mode
pnpm test:coverage                # Coverage report

# Pre-deploy checks
pnpm tsx scripts/env-check.ts
pnpm tsx scripts/route-consistency-check.ts

# Post-deploy checks
BASE_URL=https://your-app.com pnpm tsx scripts/smoke-checklist.ts
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  pnpm tsx scripts/final-data-sanity-check.ts
```

---

## Database Setup

### 1. Apply migrations

```bash
supabase db push
```

### 2. Create migration tables (not in auto-migrations)

See the SQL block in `docs/PRODUCTION_CHECKLIST.md` section 3b.

### 3. Add indexes (recommended)

See `docs/PRODUCTION_CHECKLIST.md` section 3c.

### 4. Create admin user

```bash
# In Supabase Studio: Authentication → Users → Add user
# Then in SQL Editor:
INSERT INTO users (id, email, name, role)
VALUES ('<auth-user-uuid>', 'admin@example.com', 'Admin', 'admin');
```

### 5. Generate TypeScript types (recommended)

```bash
supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

---

## Architecture Decisions

### Why server components by default?

Data fetching happens on the server to avoid client-side waterfalls. Only interactive UI elements (forms, toasts, command bar) are client components.

### Why Supabase RPC for stock movements?

The `record_movement(params)` RPC performs an atomic insert to `stock_movements` + upsert to `stock_balances` inside a single transaction. This prevents race conditions and ensures balances are always consistent with the ledger.

### Why idempotency keys?

Every stock movement has a `UNIQUE` constraint on `idempotency_key`. The RPC uses `ON CONFLICT DO NOTHING`. This means:
- Duplicate API calls (retries, double-clicks) are safe
- Network failures can be retried without side effects
- Re-running migration cutover is safe

### Why a flat role hierarchy?

The 4-tier hierarchy (admin → supervisor → encargado → read_only) covers all known use cases at MVP. Per-user permission overrides are deferred to post-MVP (BL-10) to keep the auth model simple and auditable.

---

## Role Permissions Summary

| Role | Level | Key capabilities |
|------|-------|-----------------|
| `admin` | 100 | Full access — users, locations, cutover, system |
| `supervisor` | 75 | All operations + system view, no user management |
| `encargado` | 50 | Create/receive purchases, send/receive transfers, create counts |
| `read_only` | 10 | View only — no create/edit/export |

Full permission matrix: `/settings/roles`

---

## Deployment

### Vercel (recommended)

```bash
vercel deploy --prod
```

Set all environment variables in Vercel project settings before deploying.

### Self-hosted

```bash
pnpm build
pnpm start
```

Requires Node.js 20+.

---

## System Status

Once deployed, the system status dashboard is at:

```
/settings/system
```

Or via API:

```
GET /api/system/health    — health checks with score
GET /api/system/readiness — MVP readiness across 10 categories
GET /api/system/final-audit — file audit manifest results
```

---

## Known Issues

See `docs/KNOWN_ISSUES.md`. Key items at v1.0:

- No partial purchase receiving (all-or-nothing)
- No in-transit transfer cancellation from UI
- Dashboard charts are scaffolded, not connected to chart library
- Large exports run synchronously (may be slow for > 5k rows)

---

## Contributing / Development

1. Branch from `main`
2. Run `pnpm lint && pnpm typecheck && pnpm test` before committing
3. Follow the existing file structure (server libs in `lib/server/`, components in `components/`)
4. All API routes must validate input with Zod
5. All stock mutations must use `record_movement()` RPC and an idempotency key
6. Write tests for new server functions in `tests/unit/` or `tests/integration/`

---

## Documentation Index

| Document | Purpose |
|----------|---------|
| `docs/MVP_CLOSEOUT.md` | Complete build summary, architecture, data model |
| `docs/PRODUCTION_CHECKLIST.md` | Pre-launch step-by-step checklist |
| `docs/KNOWN_ISSUES.md` | Accepted issues with workarounds |
| `docs/POST_MVP_BACKLOG.md` | 22-item post-launch roadmap |
| `docs/SMOKE_TEST_PLAN.md` | Manual test plan for each deploy |
| `docs/RELEASE_NOTES_DRAFT.md` | v1.0 release notes |

---

*Trading App v1.0.0 · Built March 2026*
