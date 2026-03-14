# Release Notes — Trading App v1.0.0

> **Release date:** March 2026
> **Type:** Initial production release (MVP)

---

## Overview

Trading App v1.0.0 is the first production release of the multi-location stock management system. This release delivers a complete operational platform for managing inventory across multiple physical locations, covering the full business lifecycle from receiving stock to conducting physical counts and migrating from legacy spreadsheet data.

---

## What's New in v1.0.0

### Core Inventory Management

**Products & Units**
- Full product catalog with name, SKU, category, unit of measure, and active/inactive status
- Units management (unit, kg, box, bag, etc.) as a master table
- Per-product stock balance view across all locations
- Product detail page with movement history

**Stock Balances**
- Real-time stock levels per product × location
- Maintained atomically via PostgreSQL function `record_movement()`
- Idempotent movement recording — safe to retry, prevents duplicate stock changes

**Movement Ledger**
- Immutable, append-only record of all stock movements
- Supported types: `purchase_in`, `transfer_out`, `transfer_in`, `physical_count`, `opening_stock`
- Filterable history by date, location, product, type
- Excel export of movement history

### Operational Flows

**Purchase Management**
- Create purchase orders with multiple line items
- Receive purchases to record stock arrivals at a specific location
- Full status lifecycle: draft → pending → received
- Purchase history with supplier and date filters

**Inter-Location Transfers**
- Create transfer orders between any two locations
- Two-step flow: Send (records departure) → Receive (records arrival)
- Full status lifecycle: draft → sent → received
- Transfer history with origin/destination filters

**Physical Counts**
- Create count sessions per location
- Enter counted quantities per product
- Submit to apply stock adjustments as `physical_count` movements
- Count history with discrepancy tracking

### Legacy Data Migration

- **Import:** Upload CSV or paste JSON data from legacy spreadsheet systems
- **Review queue:** Row-by-row review with product/location matching status and confidence levels
- **Opening balances:** Derived candidate list with approve/exclude workflow
- **Cutover:** Dry-run + execute workflow to apply opening stock movements
- **Rollback:** Full undo capability that reverses opening stock movements

### Multi-Location Support

- All operations are scoped to a specific location
- Users can be granted access to specific locations only (`encargado` role)
- Location-aware permission checks on all write operations
- Stock balances and movements always carry location context

### Authentication & Authorization

**Role hierarchy:**
- `admin` — full system access including user management and cutover
- `supervisor` — all operational functions, can view system status
- `encargado` — create and receive stock movements at assigned locations
- `read_only` — view-only access to all data

**29 named permissions** with role-based defaults and location-scoped guards.

### Settings & System

- **Roles & Permissions:** Full permission matrix viewer at `/settings/roles`
- **System Status:** Live health dashboard at `/settings/system` showing:
  - System health score (env, DB, auth, seed data checks)
  - MVP readiness score across 10 categories
  - Known issues register
  - Operational module quick links

---

## Technical Highlights

- **Next.js 15 App Router** — server components, streaming, server actions
- **TypeScript strict mode** — end to end
- **Supabase** — PostgreSQL + Row Level Security + Auth
- **Zod** — input validation on all API routes and form boundaries
- **Idempotency** — all stock mutations use unique keys to prevent duplicates
- **Audit logging** — fire-and-forget audit trail for sensitive operations
- **Excel exports** — via `exceljs` for all major data types
- **Vitest** — unit and integration test suite with mocked Supabase

---

## Performance Characteristics

- Pages use server-side rendering with `force-dynamic` where data freshness is required
- List pages are paginated (default 50 items per page)
- Dashboard data is cached with `next/cache` and revalidated on mutations
- Movement history queries use indexed `created_at DESC` ordering

---

## Known Limitations

See `docs/KNOWN_ISSUES.md` for the full list. Key limitations at launch:

| Issue | Impact |
|-------|--------|
| No partial purchase receiving | All items received at full ordered quantity |
| No in-transit transfer cancellation | Requires manual DB intervention |
| Dashboard charts are placeholders | KPI numbers work; visualizations pending |
| Large exports run synchronously | May be slow for datasets > 5,000 rows |
| No E2E test suite | Manual smoke testing required after each deploy |

---

## Upgrade / Migration Notes

This is the initial release — no upgrade path needed.

For businesses migrating from spreadsheets:
1. Follow `docs/PRODUCTION_CHECKLIST.md` for database setup
2. Use the `/migration` module to import and validate legacy data
3. Execute cutover to establish opening stock balances
4. Verify data with `scripts/final-data-sanity-check.ts`

---

## Breaking Changes

None — initial release.

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | 15.x | Framework |
| react | 19.x | UI |
| @supabase/supabase-js | 2.x | Database client |
| @supabase/ssr | 0.x | Server-side auth |
| zod | 3.x | Validation |
| exceljs | 4.x | Excel generation |
| vitest | 2.x | Testing |
| tailwindcss | 3.x | Styling |
| typescript | 5.x | Language |

---

## What's Coming Next

See `docs/POST_MVP_BACKLOG.md` for the full roadmap. Planned for the next sprint (P1):

- Partial purchase receiving
- Waste / spoilage module
- Manual stock adjustment flow
- Dashboard KPI charts
- Cancel in-transit transfers
- Product bulk import via CSV

---

## Credits

Built iteratively using Claude Code AI-assisted development across 10 build batches. Architecture designed for production-grade multi-location inventory management at small-to-medium trading businesses.

---

*Trading App v1.0.0 — March 2026*
