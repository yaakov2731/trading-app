# QA Guide — Inventory System MVP

## Test Coverage

### Unit Tests (`tests/unit/`)

| File | Covers |
|------|--------|
| `sku.test.ts` | SKU normalisation, product name cleanup, unit aliases |
| `stock-movements.test.ts` | Quantity parsing (Argentine format), snapshot date parsing |
| `permissions.test.ts` | Role hierarchy, permission checks, minimum role logic |
| `opening-balances.test.ts` | Confidence level derivation, catalog/snapshot parsing, import type detection |

### Integration Tests (`tests/integration/`)

| File | Covers |
|------|--------|
| `products-route.test.ts` | Products API GET, search params, empty result handling |
| `movements-route.test.ts` | History API GET, location filter forwarding |
| `purchases-receive.test.ts` | Purchase receiving flow, idempotency, 409 on duplicate |
| `cutover.test.ts` | Idempotency key format, cutover schema validation, preflight logic |

### Running Tests

```bash
pnpm test          # run all tests
pnpm test --watch  # watch mode
pnpm test:coverage # coverage report
```

---

## Manual QA Checklist

### Auth & Session
- [ ] Unauthenticated users redirected to login
- [ ] Session expires gracefully
- [ ] Role-based navigation visible/hidden correctly

### Products
- [ ] Create product with all fields
- [ ] Edit product
- [ ] Search by name and SKU
- [ ] Category and unit dropdowns work
- [ ] Inactive products hidden from stock operations

### Stock & Movements
- [ ] Purchase entry: draft → receive creates stock
- [ ] Transfer: create → send → receive creates paired movements
- [ ] Physical count: confirm creates reconciliation_adjustment
- [ ] Negative stock blocked where configured
- [ ] Movement history shows correct signed quantities

### Purchases
- [ ] Create draft with multiple line items
- [ ] Receive with actual quantities (partial ok)
- [ ] Cancel draft
- [ ] 409 returned on double-receive
- [ ] Excel export downloads correctly

### Transfers
- [ ] Create transfer between locations
- [ ] Send from source location (reduces stock)
- [ ] Receive at destination location (increases stock)
- [ ] Idempotency: double-receive does not duplicate stock

### Physical Counts
- [ ] Create count with product selection
- [ ] Submit count items with real quantities
- [ ] Confirm creates adjustments for discrepancies
- [ ] Discrepancy severity colours correct

### Migration
- [ ] Import JSON snapshot rows
- [ ] Review queue shows needs_review rows
- [ ] Approve/reject/skip actions work
- [ ] Opening balance derivation from matched rows
- [ ] Cutover dry-run shows preview
- [ ] Cutover execution creates opening_stock movements
- [ ] Rollback reverses movements and resets candidates

### Permissions
- [ ] Admin can access all pages and actions
- [ ] Supervisor cannot execute cutover
- [ ] Encargado cannot manage roles
- [ ] Read-only users see no create/edit buttons
- [ ] API routes return 401/403 for unauthorized attempts

### Exports
- [ ] Stock export downloads valid Excel
- [ ] Movement history export downloads
- [ ] Purchase detail export works
- [ ] Migration review export works

---

## Critical Smoke Tests (Post-Deploy)

1. Log in with admin user
2. Create a product via `/products/new`
3. Create a purchase entry → receive it → verify stock appears in dashboard
4. Create a transfer between two locations → send → receive
5. Import a legacy snapshot JSON file → review → approve → run cutover dry-run
6. Export stock list as Excel
7. Log out and verify redirect to login

---

## Known Limitations (MVP)

- Cutover log table (`migration_cutover_log`) needs to be created in DB migration
- Opening balance candidates table (`migration_opening_balance_candidates`) needs migration
- Audit log table (`audit_logs`) needs migration
- Permission editing UI is read-only (informational only)
- Google Sheets sync is scaffolded but not connected to live credentials
- Report charts are scaffolded but not connected to real chart library
