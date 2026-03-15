# Smoke Test Plan — Trading App v1.0

> Manual test checklist for pre-launch and post-deploy validation.
> Run after every production deploy. Complete all **[CRITICAL]** items before declaring the deploy healthy.

---

## Environment Setup

Before running:
1. Log in as an **admin** user
2. Ensure at least one location exists
3. Ensure at least one product exists (or create one in T-02)
4. Have a second browser session ready with a `read_only` user for permission tests

---

## T-01 — Authentication

**[CRITICAL]**

- [ ] Navigate to `/login` — page loads without errors
- [ ] Attempt login with wrong password — shows error, does not crash
- [ ] Login with valid admin credentials — redirects to `/dashboard`
- [ ] Reload page — session persists, still logged in
- [ ] Navigate to `/dashboard` in a private/incognito window — redirected to `/login`
- [ ] Log out — session cleared, redirected to `/login`
- [ ] Try accessing `/dashboard` after logout — redirected to `/login`

---

## T-02 — Products

**[CRITICAL]**

- [ ] Navigate to `/products` — product list loads
- [ ] Click "Nuevo producto" — form at `/products/new` loads
- [ ] Create a product: fill name, SKU, unit, save — redirects to product detail
- [ ] Product appears in the list at `/products`
- [ ] Open product detail — shows name, SKU, unit, stock table
- [ ] Edit product name — save succeeds, updated name shows in list

**[SMOKE]**

- [ ] Search by product name in products list — filters results
- [ ] Filter by category (if categories exist) — works correctly
- [ ] Deactivate a product — shows as inactive in list

---

## T-03 — Purchases

**[CRITICAL]**

- [ ] Navigate to `/purchases` — list loads
- [ ] Click "Nueva compra" — form at `/purchases/new` loads
- [ ] Fill: supplier, location, add 1 line item (product + quantity + price)
- [ ] Save — redirects to purchase detail page
- [ ] Purchase shows status `pending` in list
- [ ] Open purchase detail — shows line items, status
- [ ] Click "Recibir" — confirmation works, stock increases, status changes to `received`
- [ ] Navigate to `/history` — movement with type `purchase_in` appears

**[SMOKE]**

- [ ] Add multiple line items to a purchase
- [ ] Purchase list shows correct status badges
- [ ] Filter purchases by status (pending/received)

---

## T-04 — Transfers

**[CRITICAL]**

- [ ] Navigate to `/transfers` — list loads
- [ ] Click "Nueva transferencia" — form at `/transfers/new` loads
- [ ] Fill: origin location, destination location, add 1 line item (product + quantity)
- [ ] Save — redirects to transfer detail, status `draft`
- [ ] Click "Enviar" — confirms, stock decreases at origin, status → `sent`
- [ ] Click "Recibir" — stock increases at destination, status → `received`
- [ ] Navigate to `/history` — both `transfer_out` and `transfer_in` movements appear

**[SMOKE]**

- [ ] Transfers list shows correct status and location pair
- [ ] Cannot send a transfer with quantity > available stock (validation error)
- [ ] Filter transfers by status

---

## T-05 — Physical Counts

**[CRITICAL]**

- [ ] Navigate to `/counts` — list loads
- [ ] Click "Nuevo conteo" — form at `/counts/new` loads
- [ ] Fill: location, add 1 product with counted quantity
- [ ] Save — redirects to count detail, status `draft`
- [ ] Edit counted quantity — save works
- [ ] Submit count — status → `submitted` (or applies adjustment if auto-apply)
- [ ] Navigate to `/history` — movement with type `physical_count` appears

**[SMOKE]**

- [ ] Count with zero variance — no movement created (or zero-quantity movement)
- [ ] Count list shows date, location, status

---

## T-06 — Movement History

**[CRITICAL]**

- [ ] Navigate to `/history` — loads list of movements
- [ ] Movements show correct type, quantity, product, location, date
- [ ] Filter by date range — results narrow correctly
- [ ] Filter by movement type — works

**[SMOKE]**

- [ ] Filter by location
- [ ] Filter by product
- [ ] Export to Excel — file downloads with movements data

---

## T-07 — Migration Module

**[SMOKE]** (not critical for day-to-day operations)

- [ ] Navigate to `/migration` — hub loads, shows steps
- [ ] Navigate to `/migration/import` — import form loads
- [ ] Upload a small valid CSV/JSON (or use sample data) — import succeeds
- [ ] Navigate to `/migration/review` — shows imported rows
- [ ] Approve a row — status changes
- [ ] Navigate to `/migration/opening-balances` — shows candidates
- [ ] Navigate to `/migration/cutover` — shows preflight status
- [ ] Dry-run cutover — returns result without applying changes

---

## T-08 — Settings & Roles

**[SMOKE]**

- [ ] Navigate to `/settings` — settings hub loads
- [ ] Navigate to `/settings/roles` — role permissions matrix loads
- [ ] Navigate to `/settings/system` — system status page loads, shows health score
- [ ] `GET /api/system/health` — returns JSON with `overall` field
- [ ] `GET /api/system/readiness` — returns JSON with `overallScore` field

---

## T-09 — Permission Enforcement

**[CRITICAL]**

- [ ] Log in as `read_only` user
- [ ] `/dashboard` loads correctly
- [ ] `/products` loads — but "Nuevo producto" button is hidden or disabled
- [ ] Try to POST `/api/products` directly — returns `403 Forbidden`
- [ ] `/purchases/new` — blocked or shows no-access state
- [ ] `/settings/roles` — blocked or read-only view
- [ ] `/settings/system` — blocked or read-only view

---

## T-10 — Mobile Responsiveness

**[SMOKE]** (use browser DevTools mobile emulation or real device)

- [ ] `/dashboard` — KPI cards stack correctly on small screen
- [ ] `/products` — table collapses to card view on mobile
- [ ] `/purchases/new` — form usable on mobile
- [ ] Navigation sidebar/menu — accessible on mobile
- [ ] No horizontal overflow causing scroll

---

## T-11 — API Health Checks (automated)

Run the automated smoke test script:

```bash
BASE_URL=https://your-app.vercel.app pnpm tsx scripts/smoke-checklist.ts
```

This script checks:
- `/api/system/health` → 200
- `/api/system/readiness` → 200
- `/api/system/final-audit` → 200
- Key page routes → 200 or 3xx (redirect to login)

- [ ] Script exits 0 (all checks pass)

---

## T-12 — Data Sanity (post-cutover or after data entry)

Run against the live database:

```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  pnpm tsx scripts/final-data-sanity-check.ts
```

- [ ] DC-01: No negative balances
- [ ] DC-02: All movements have product + location
- [ ] DC-03: Received purchases have `received_at`
- [ ] DC-04: Sent transfers have `transfer_out` movements
- [ ] DC-05: No duplicate idempotency keys
- [ ] DC-06: At least one admin user
- [ ] DC-07: Active products have `unit_id`

---

## Pass / Fail Criteria

| Result | Condition |
|--------|-----------|
| **PASS** | All `[CRITICAL]` items checked with no failures |
| **CONDITIONAL PASS** | All `[CRITICAL]` items pass, some `[SMOKE]` items skipped with documented reason |
| **FAIL** | Any `[CRITICAL]` item fails |

---

## Issue Reporting

For any failure found during smoke testing:

1. Note the test ID and step that failed
2. Capture screenshot/error message
3. Create a GitHub issue with label `smoke-test-failure`
4. Do not declare the deploy healthy until the issue is resolved or explicitly accepted

---

## Tester Sign-off

| Test Run | Date | Tester | Result | Notes |
|----------|------|--------|--------|-------|
| v1.0 launch | | | | |
| | | | | |

---

*Last updated: March 2026 — Trading App v1.0*
