# MVP Closeout — Trading App v1.0

> **Status:** COMPLETE — Ready for production deployment
> **Date:** March 2026
> **Version:** 1.0.0

---

## What Was Built

This MVP delivers a full-featured multi-location stock management system for a trading business. The product covers the complete operational lifecycle: receiving purchases, moving stock between locations, conducting physical counts, and migrating from a legacy spreadsheet system.

### Core Modules

| Module | Routes | Status |
|--------|--------|--------|
| Dashboard | `/dashboard` | ✅ Complete |
| Products & Units | `/products`, `/products/new`, `/products/[id]` | ✅ Complete |
| Purchases | `/purchases`, `/purchases/new`, `/purchases/[id]` | ✅ Complete |
| Transfers | `/transfers`, `/transfers/new`, `/transfers/[id]` | ✅ Complete |
| Physical Counts | `/counts`, `/counts/new`, `/counts/[id]` | ✅ Complete |
| Movement History | `/history` | ✅ Complete |
| Legacy Migration | `/migration/*` (5 sub-routes) | ✅ Complete |
| Settings & Roles | `/settings`, `/settings/roles`, `/settings/system` | ✅ Complete |
| Auth | `/login` | ✅ Complete |

### Technical Architecture

- **Framework:** Next.js 15 (App Router, Server Components, Server Actions)
- **Database:** Supabase (PostgreSQL + Row Level Security + Auth)
- **Styling:** Tailwind CSS with custom design tokens
- **Validation:** Zod on all API boundaries
- **Testing:** Vitest (unit + integration, mocked Supabase)
- **Language:** TypeScript strict mode throughout

---

## Build Batches Delivered

### Batch 1 — Foundation
Database schema, Supabase client setup, auth middleware, root layout, and global CSS.

### Batch 2 — Core Data Layer
Server-side data access functions for products, purchases, transfers, counts, and stock movements. Supabase RPC integration for atomic `record_movement()`.

### Batch 3 — Products & Units
Product list, detail, new product form, units management, and product API routes.

### Batch 4 — Purchases & Transfers
Full purchase flow (create → receive), transfer flow (create → send → receive), API routes, and server actions.

### Batch 5 — Counts & History
Physical count workflow (create → enter counts → submit/apply), movement history with filters and exports.

### Batch 6 — Legacy Migration
5-step migration wizard: CSV/Excel import, snapshot review queue, opening balance candidates, cutover execution with dry-run, rollback capability.

### Batch 8 — Hardening & Permissions
Canonical permissions layer (29 permissions × 4 roles), server-side guards, idempotency key builders, audit logging, AppError hierarchy, Zod primitives, API response helpers, feedback UI (toasts, empty states, error states), permission and location guards, roles settings page, Vitest test suite foundation.

### Batch 9 — Polish & UI Primitives
12 shared UI components (PageHeader, SectionCard, FilterBar, StatusPill, etc.), global command bar (Cmd+K), location switcher, 4 client hooks, 5 utility libraries, server performance helpers, cache tag system, fetch optimizations, 9 route loading skeletons, 404 page.

### Batch 10 — Final MVP Closeout
System health checks, release readiness scoring, file audit manifest, consistency validation, post-MVP backlog registry, smoke test scripts, data sanity checks, env validation, route consistency check, known issues register, and this documentation suite.

---

## Data Model Summary

### Core Tables

```
locations          — physical stock locations
units              — units of measure
products           — product catalog
suppliers          — supplier directory
stock_balances     — current quantity per product/location (maintained by RPC)
stock_movements    — immutable movement ledger (append-only)
```

### Transaction Tables

```
purchase_entries   — purchase orders
purchase_items     — line items on purchases
transfers          — inter-location transfers
transfer_items     — line items on transfers
physical_counts    — count sessions
physical_count_items — individual count entries
```

### Auth & Config

```
users              — app users with role (admin/supervisor/encargado/read_only)
role_location_access — per-user location access grants
```

### Migration Tables

```
legacy_import_runs                    — import session metadata
legacy_snapshot_rows                  — parsed legacy rows
migration_opening_balance_candidates  — derived opening balances awaiting approval
migration_cutover_log                 — cutover execution history
audit_logs                            — general audit trail
```

### Key Constraint: Idempotency

All `stock_movements` have a `UNIQUE` constraint on `idempotency_key`. The `record_movement()` RPC uses `ON CONFLICT DO NOTHING` ensuring operations are safe to retry.

---

## Role Permissions Matrix

| Permission | admin | supervisor | encargado | read_only |
|------------|:-----:|:----------:|:---------:|:---------:|
| view_dashboard | ✓ | ✓ | ✓ | ✓ |
| view_products | ✓ | ✓ | ✓ | ✓ |
| manage_products | ✓ | ✓ | — | — |
| view_purchases | ✓ | ✓ | ✓ | ✓ |
| create_purchase | ✓ | ✓ | ✓ | — |
| receive_purchase | ✓ | ✓ | ✓ | — |
| view_transfers | ✓ | ✓ | ✓ | ✓ |
| create_transfer | ✓ | ✓ | ✓ | — |
| send_transfer | ✓ | ✓ | ✓ | — |
| receive_transfer | ✓ | ✓ | ✓ | — |
| view_counts | ✓ | ✓ | ✓ | ✓ |
| create_count | ✓ | ✓ | ✓ | — |
| submit_count | ✓ | ✓ | — | — |
| view_history | ✓ | ✓ | ✓ | ✓ |
| export_data | ✓ | ✓ | — | — |
| manage_users | ✓ | — | — | — |
| manage_locations | ✓ | — | — | — |
| manage_migration | ✓ | ✓ | — | — |
| execute_cutover | ✓ | — | — | — |
| view_system | ✓ | ✓ | — | — |

(Full matrix with all 29 permissions at `/settings/roles`)

---

## Deployment Requirements

See `docs/PRODUCTION_CHECKLIST.md` for the complete pre-launch checklist.

### Minimum Requirements

- Supabase project with PostgreSQL 15+
- Node.js 20+ / Next.js 15
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`
- Migration tables created (see `README_DEPLOY.md`)
- At least one admin user created in Supabase Auth

### Recommended

- Vercel deployment (edge-optimized for Next.js 15)
- Sentry for error monitoring (`SENTRY_DSN`)
- Supabase types generated pre-deploy

---

## Known Limitations

See `docs/KNOWN_ISSUES.md` for the full list. Key items:

- No partial purchase receiving (all-or-nothing per entry)
- No in-transit transfer cancellation from UI
- Dashboard KPI charts are scaffolded but not wired to a chart library
- No background job queue (large exports run synchronously)
- Google Sheets OAuth not wired (helpers ready, auth pending)

---

## Post-MVP Roadmap

See `docs/POST_MVP_BACKLOG.md` for the full 22-item backlog (P1/P2/P3).

**P1 priorities:** partial receiving, waste module, manual adjustments, dashboard charts, transfer cancellation, product bulk import.

---

*Generated as part of Batch 10 — Final MVP Closeout.*
