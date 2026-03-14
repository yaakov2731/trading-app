# GastroStock — System Architecture

## Executive Diagnosis

The existing stock management system (`control-stock-pro`) has these critical flaws:
1. **Spreadsheet as live transactional DB** — unacceptable for concurrent multi-location use
2. **Snapshot-only model** — no movement ledger, so you can't audit what happened or reconstruct stock
3. **Performance** — Google Sheets API writes on every action = slow, flaky
4. **No idempotency** — double-taps register duplicate movements
5. **No concurrency safety** — simultaneous edits corrupt data silently

---

## Architecture Decision: Ledger-Based Inventory (Kardex)

### Why NOT snapshot-only

A snapshot model says: "current stock = last number I entered."
This breaks immediately when:
- Two people update simultaneously (last write wins — one is lost)
- You need to know *why* stock changed (no audit trail)
- You need to reconcile a physical count (no baseline to compare to)
- A mistake is made (no way to undo or trace)

### Why ledger-based is correct

A ledger model says: "current stock = SUM(all signed movements)."

```
product X at location Y:
  2024-01-01  opening_stock     +100
  2024-01-05  purchase_in       +50
  2024-01-07  consumption_out   -30
  2024-01-10  waste_out         -5
  ─────────────────────────────────
  current stock                 115
```

This gives you:
- Full audit trail (who did what, when, why)
- Ability to reconstruct stock at any point in time
- Proper reconciliation (physical count vs system)
- Race condition safety (each movement is an INSERT, not UPDATE)
- Idempotency (unique key per operation)

---

## Data Model Summary

### Core tables

| Table | Purpose |
|-------|---------|
| `locations` | 6 physical business locations |
| `users` | Staff with role-based access |
| `user_locations` | User-to-location access mapping |
| `categories` | Product categories with SKU prefix config |
| `sku_sequences` | Per-category atomic sequence counters |
| `units` | Units of measurement |
| `products` | Product master with auto-generated immutable SKUs |
| `suppliers` | Vendor/supplier directory |
| `stock_movements` | **Core ledger** — every stock change ever |
| `stock_balances` | **Cached** current stock (updated by trigger) |
| `purchase_entries` | Purchase order headers |
| `purchase_entry_items` | Purchase line items |
| `transfers` | Transfer headers (between locations) |
| `transfer_items` | Transfer line items |
| `physical_counts` | Physical count sessions |
| `physical_count_items` | Individual product counts |
| `stock_alert_rules` | Configurable threshold alerts |
| `audit_logs` | Immutable audit trail |
| `stock_snapshots_legacy` | Read-only legacy data preservation |
| `migration_import_runs` | Migration session tracking |
| `migration_import_rows` | Individual migration row mapping |

### Performance optimizations

1. `stock_balances` table — trigger-maintained cache of current stock
   - Every INSERT to `stock_movements` triggers an UPSERT to `stock_balances`
   - O(1) current stock reads — no need to SUM the ledger every time
   - Source of truth for alerts and dashboards

2. GIN trigram indexes on product names/SKUs — fast autocomplete search
3. Composite indexes on (product_id, location_id) — fast stock lookups
4. Row-level locking in `generate_sku()` — concurrency-safe SKU generation

---

## SKU Generation

```
Category "Carnes" with prefix "CAR":
  1. SELECT prefix, last_sequence+1 FROM sku_sequences WHERE category_id = X FOR UPDATE
  2. UPDATE sku_sequences SET last_sequence = N
  3. SKU = "CAR-" + LPAD(N, 4, '0')  → "CAR-0001"
  4. INSERT product with SKU atomically
  5. COMMIT
```

The `FOR UPDATE` row lock prevents two concurrent requests from generating the same SKU.
Each category has its own sequence — they don't interfere with each other.

### SKU immutability

A trigger prevents SKU changes:
```sql
IF OLD.sku != NEW.sku THEN
  IF current_setting('app.allow_sku_change') != 'true' THEN
    RAISE EXCEPTION 'SKU is immutable after creation';
  END IF;
  -- Log admin override to audit_logs
END IF;
```

---

## Stock Calculation

```sql
-- Fast path (cached, used in production)
SELECT current_stock FROM stock_balances
WHERE product_id = $1 AND location_id = $2;

-- Audit/verification path (recalculates from ledger)
SELECT SUM(quantity) FROM stock_movements
WHERE product_id = $1 AND location_id = $2;
```

The two should always match. If they diverge (shouldn't happen), `stock_balances` can be
rebuilt from the ledger.

---

## Legacy Migration Strategy

```
Phase 1: Freeze legacy sheet
Phase 2: Import snapshot rows → stock_snapshots_legacy (read-only)
Phase 3: Admin review screen — match legacy rows to new products/locations
Phase 4: For each matched row: create opening_stock movement at cutover date
Phase 5: Verify opening balances match legacy snapshot
Phase 6: Switch live traffic to new system
Phase 7: Legacy sheet becomes export-only reference
```

### What we preserve vs what we DON'T fabricate

✅ Preserve: latest quantity snapshot per SKU+location as opening balance
❌ Do NOT: invent historical purchase or consumption movements from snapshots
❌ Do NOT: try to match "quantity at date X" vs "quantity at date Y" and call that a movement

---

## Google Sheets / Excel Design

The workbook has three classes of sheets:

| Class | Sheets | Editable? |
|-------|--------|-----------|
| Config | Parametros | Read-only |
| Master data | Locales, Categorias, Unidades, Productos | Read-only |
| Operational | Stock_Actual, Movimientos, Compras, Transferencias, Conteos_Fisicos | Read-only |

**Export is triggered manually** (or scheduled via cron) — never written on every transaction.
This eliminates the performance bottleneck of the current system.

---

## Performance Strategy

1. **Write path**: `record_movement()` RPC → single INSERT + trigger UPDATE → <5ms
2. **Read path**: Query `stock_balances` (indexed) → <2ms
3. **Search**: GIN trigram indexes on product name/SKU → autocomplete <50ms
4. **Dashboard**: Cached views + pre-aggregated data → fast renders
5. **Export**: Batched, async, client-side Excel generation (no server blocking)
6. **Optimistic UI**: Movement forms update UI immediately, confirm on server response
7. **Idempotency**: Double-tap protection via unique `idempotency_key`

---

## Technology Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | Next.js 14 App Router | SSR, server actions, streaming |
| Language | TypeScript | Type safety end-to-end |
| Database | Supabase/PostgreSQL | Real-time, RLS, functions, hosted |
| Auth | Supabase Auth | Integrated with DB permissions |
| Styling | Tailwind CSS | Fast, consistent, purged |
| Components | Custom design system | Premium look, not generic |
| Forms | React Hook Form + Zod | Validation + type safety |
| Data fetching | Server components + actions | No extra API layer for simple cases |
| Export | xlsx + file-saver | Client-side, no server resources |
| Deployment | Vercel | Next.js native, edge functions |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/           Login page
│   ├── (app)/
│   │   ├── layout.tsx          Auth guard + app shell
│   │   ├── dashboard/          Multi-location dashboard
│   │   ├── stock/              Current stock by location
│   │   ├── movements/          Movement ledger view + quick entry
│   │   ├── products/           Product catalog management
│   │   ├── purchases/          Purchase orders
│   │   ├── transfers/          Inter-location transfers
│   │   ├── physical-count/     Physical count sessions
│   │   ├── alerts/             Low stock alerts
│   │   ├── reports/            Export center
│   │   └── settings/           Config (categories, units, locations)
│   └── api/                    REST endpoints (if needed)
├── components/
│   ├── ui/                     Design system primitives
│   │   ├── button.tsx          3D premium buttons
│   │   ├── card.tsx            Premium cards
│   │   ├── input.tsx           Form inputs
│   │   ├── badge.tsx           Status badges
│   │   ├── select.tsx          Dropdown selects
│   │   ├── dialog.tsx          Modal dialogs
│   │   └── table.tsx           Data tables
│   ├── layout/
│   │   ├── app-shell.tsx       Main layout wrapper
│   │   ├── sidebar.tsx         Desktop nav + mobile bottom nav
│   │   └── header.tsx          Sticky page header
│   └── features/
│       ├── product-search.tsx  Fast keyboard-navigable search
│       ├── quick-movement-form.tsx  Optimized stock entry
│       └── stock-table.tsx     Filterable stock table
├── lib/
│   ├── db/
│   │   ├── client.ts           Supabase browser/server clients
│   │   └── database.types.ts   Generated DB types
│   ├── types/index.ts          Application types
│   ├── schemas/index.ts        Zod validation schemas
│   └── utils/
│       ├── cn.ts               Classname merging
│       ├── format.ts           Number/date formatters
│       └── export.ts           Excel workbook builder
├── server/actions/
│   ├── movements.ts            Record movements (idempotent)
│   ├── products.ts             Product CRUD + SKU generation
│   └── export.ts               Fetch data for export
└── supabase/
    └── migrations/
        ├── 0001_initial_schema.sql   24 tables, indexes, constraints
        ├── 0002_functions.sql        SKU gen, triggers, RLS, views
        └── 0003_seed_data.sql        Reference data + 6 locations
```

---

## MVP Checklist

- [x] SQL schema — all 24 tables + indexes
- [x] SKU generation — atomic, concurrency-safe
- [x] Stock movement ledger
- [x] Stock balance cache (trigger-maintained)
- [x] RLS policies
- [x] Core views (v_current_stock, v_movement_history, v_low_stock_alerts)
- [x] TypeScript types for all entities
- [x] Zod validation schemas
- [x] Premium 3D button design system
- [x] Premium card, input, badge, table components
- [x] App shell with sidebar + mobile bottom nav
- [x] Login page
- [x] Dashboard (multi-location KPIs + alerts)
- [x] Stock page (filterable table + quick movement)
- [x] Movement history page
- [x] Products page (create/edit with auto-SKU)
- [x] Alerts page
- [x] Reports / Export page
- [x] Settings page (categories, units, locations)
- [x] Excel export (10 sheets)
- [x] Server actions (movements, products, export)

## Migration Checklist

- [ ] Freeze legacy Google Sheet (set to read-only)
- [ ] Export legacy sheet to CSV
- [ ] Run migration import tool
- [ ] Admin review of opening balances
- [ ] Create opening_stock movements at cutover date
- [ ] Verify stock_balances match legacy snapshot
- [ ] Train staff on new system
- [ ] Go live

## Performance Checklist

- [x] stock_balances trigger cache (no aggregate on every read)
- [x] GIN indexes for product search
- [x] Composite indexes on (product_id, location_id)
- [x] Idempotency keys on movements
- [x] SKU generation with row-level locking
- [x] Client-side Excel generation (no server blocking)
- [x] Server components for fast initial load
- [ ] Set up Supabase connection pooling (PgBouncer)
- [ ] Enable Supabase realtime for alerts

## Deployment Checklist

- [ ] Create Supabase project
- [ ] Run migrations (0001, 0002, 0003)
- [ ] Configure environment variables (.env.local)
- [ ] Deploy to Vercel
- [ ] Set up custom domain
- [ ] Configure Supabase Auth email templates
- [ ] Create initial admin user
- [ ] Run migration import
- [ ] Smoke test all features
- [ ] Train staff
