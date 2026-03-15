# Production Checklist — Trading App v1.0

> Complete every item before going live. Mark each `[x]` as you go.

---

## 1. Infrastructure

- [ ] Supabase project created in the correct region (close to users)
- [ ] Supabase plan upgraded if needed (Free tier has 500MB DB limit)
- [ ] Vercel project linked to repository
- [ ] Custom domain configured and DNS propagated
- [ ] SSL certificate active (Vercel handles this automatically)
- [ ] `NEXT_PUBLIC_APP_URL` set to the production domain (not localhost)

---

## 2. Environment Variables

Run `pnpm tsx scripts/env-check.ts` to validate all at once.

- [ ] `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (**never expose to browser**)
- [ ] `NEXT_PUBLIC_APP_URL` — canonical production URL
- [ ] `NODE_ENV=production` — set automatically by Vercel
- [ ] (Optional) `SENTRY_DSN` — error tracking
- [ ] Verify no `.env.local` secrets committed to git: `git log --all -- .env*`

---

## 3. Database Setup

### 3a. Core Schema
- [ ] Run all Supabase migrations: `supabase db push` or via dashboard SQL editor
- [ ] Verify all core tables exist: `locations`, `units`, `products`, `suppliers`, `stock_balances`, `stock_movements`, `purchase_entries`, `purchase_items`, `transfers`, `transfer_items`, `physical_counts`, `physical_count_items`, `users`, `role_location_access`
- [ ] `record_movement()` RPC deployed and tested
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] RLS policies reviewed — confirm `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS correctly

### 3b. Migration Tables (create manually if not in migrations)
```sql
-- Run this block if migration tables are missing
CREATE TABLE IF NOT EXISTS migration_opening_balance_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_run_id uuid REFERENCES legacy_import_runs(id),
  product_id uuid REFERENCES products(id),
  location_id uuid REFERENCES locations(id),
  unit_id uuid REFERENCES units(id),
  sku text,
  location_raw text,
  quantity numeric NOT NULL DEFAULT 0,
  confidence text DEFAULT 'unresolved',
  match_method text,
  issues jsonb DEFAULT '[]',
  status text DEFAULT 'pending',
  applied_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS migration_cutover_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_by uuid,
  applied_count int DEFAULT 0,
  dry_run boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);
```

### 3c. Indexes (recommended for production)
```sql
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_location
  ON stock_movements(product_id, location_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference
  ON stock_movements(reference_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_idempotency
  ON stock_movements(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at
  ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_entries_status
  ON purchase_entries(status);
CREATE INDEX IF NOT EXISTS idx_transfers_status
  ON transfers(status);
```

---

## 4. Seed Data

- [ ] At least one `location` record exists
- [ ] At least one `unit` record exists (e.g., "unidad", "kg", "caja")
- [ ] At least one admin user created in Supabase Auth
- [ ] Admin user has matching row in `users` table with `role = 'admin'`
- [ ] `users` table has trigger or manual insert for new auth signups (if needed)

---

## 5. Auth Configuration

- [ ] Supabase Auth email provider configured
- [ ] Email templates customized (confirm email, password reset)
- [ ] `Redirect URLs` whitelist includes production domain
- [ ] Auth redirect URL in app middleware matches production URL
- [ ] Disable public signups if the app is invite-only (Supabase Auth settings)
- [ ] Session expiry configured appropriately (default 1 week)

---

## 6. Build Verification

```bash
# Run these before deploying
pnpm tsx scripts/env-check.ts       # Env vars OK
pnpm tsx scripts/route-consistency-check.ts  # All routes present
pnpm lint                            # No lint errors
pnpm typecheck                       # No type errors
pnpm test                            # All tests pass
pnpm build                           # Build succeeds
```

- [ ] `env-check.ts` passes with 0 errors
- [ ] `route-consistency-check.ts` passes with 0 critical missing
- [ ] `pnpm lint` exits 0
- [ ] `pnpm typecheck` (or `tsc --noEmit`) exits 0
- [ ] `pnpm test` — all tests green
- [ ] `pnpm build` completes without errors
- [ ] No `any` type errors introduced in new code
- [ ] No `console.log` left in production code paths

---

## 7. Runtime Verification (post-deploy)

Run smoke test script against production URL:

```bash
BASE_URL=https://your-app.vercel.app pnpm tsx scripts/smoke-checklist.ts
```

- [ ] `GET /api/system/health` returns `200` with `overall: "ok"` or `"warning"`
- [ ] `GET /api/system/readiness` returns `200` with readiness report
- [ ] Login page loads (`/login`)
- [ ] Dashboard loads after login
- [ ] Products list loads
- [ ] Purchase create form loads
- [ ] Transfer create form loads
- [ ] Count create form loads
- [ ] History page loads
- [ ] System status page (`/settings/system`) loads

---

## 8. Data Integrity (post-deploy with real data)

Run against production DB:

```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  pnpm tsx scripts/final-data-sanity-check.ts
```

- [ ] DC-01: No negative stock balances
- [ ] DC-02: All movements have product_id and location_id
- [ ] DC-03: All received purchases have `received_at` timestamp
- [ ] DC-04: All sent transfers have `transfer_out` movement
- [ ] DC-05: No duplicate idempotency keys
- [ ] DC-06: At least one admin user exists
- [ ] DC-07: All active products have `unit_id`

---

## 9. Security Review

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is **not** in any client-side bundle
  - Check: `pnpm build && grep -r "SUPABASE_SERVICE_ROLE" .next/static/` — should return nothing
- [ ] RLS policies prevent users from accessing other users' data
- [ ] Location-based access control tested: encargado cannot see other locations
- [ ] Admin-only routes return 403 for non-admin roles
- [ ] No raw SQL string concatenation (SQL injection risk)
- [ ] Export endpoints require authentication
- [ ] API routes validate input with Zod — no raw `req.body` usage

---

## 10. Performance

- [ ] Next.js image optimization enabled (if using `<Image />`)
- [ ] `force-dynamic` used only where necessary (check pages for static candidates)
- [ ] Large list pages have pagination (products, movements, purchases)
- [ ] Database queries have appropriate `limit()` clauses
- [ ] Supabase connection pooling enabled (PgBouncer in Transaction mode for Vercel)

---

## 11. Monitoring

- [ ] Vercel Analytics enabled (optional but recommended)
- [ ] Sentry DSN configured and error tracking verified
- [ ] Supabase database alert configured for storage near limit
- [ ] Uptime monitoring set up (UptimeRobot, Better Uptime, etc.)

---

## 12. Backup & Recovery

- [ ] Supabase daily backups enabled (paid plan)
- [ ] Manual DB snapshot taken before cutover
- [ ] Rollback procedure documented and tested (see `docs/MVP_CLOSEOUT.md`)
- [ ] At least one team member knows how to run rollback

---

## 13. Final Sign-off

- [ ] Product owner / stakeholder demo completed
- [ ] All P0 issues resolved (none known at launch)
- [ ] Known issues reviewed and accepted (see `docs/KNOWN_ISSUES.md`)
- [ ] On-call contact defined for launch day
- [ ] Rollback plan ready

---

**Sign-off:**

| Role | Name | Date |
|------|------|------|
| Technical lead | | |
| Product owner | | |
| QA / tester | | |

---

*Last updated: March 2026 — Trading App v1.0*
