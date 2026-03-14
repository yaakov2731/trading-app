# Post-MVP Backlog — Trading App v1.0

> Items deferred from MVP. Prioritized P1 (next sprint) → P2 (next quarter) → P3 (roadmap).
> Source of truth for sprint planning after v1.0 launch.

---

## Priority Levels

| Level | Meaning |
|-------|---------|
| **P1** | High user impact. Should ship within 4–6 weeks of launch. |
| **P2** | Medium value. Plan for next quarter. |
| **P3** | Nice to have. Roadmap item, no committed timeline. |

---

## P1 — High Priority (Next Sprint)

### BL-01 — Partial Purchase Receiving
**Category:** Purchasing
**Effort:** M (3–5 days)

Add per-item `received_quantity` input to the purchase receive flow. Currently all items are received at full ordered quantity. Required for businesses that receive partial shipments.

**Acceptance criteria:**
- Receive form shows ordered qty and allows entering received qty per item
- Remaining qty is tracked; entry stays "partial" until fully received
- `stock_movements` records only received quantity

---

### BL-02 — Waste / Spoilage Module
**Category:** Inventory
**Effort:** M (3–5 days)

Add `waste` movement type with its own create flow. Currently `waste` is defined in schema but has no UI. Required for businesses with perishable goods.

**Acceptance criteria:**
- `/waste/new` form: product, location, quantity, reason, notes
- `waste` movement recorded via `record_movement()` RPC
- Appears in history with "Merma" label

---

### BL-03 — Manual Stock Adjustment
**Category:** Inventory
**Effort:** S (1–2 days)

Add `manual_adjustment` movement type for one-off corrections not tied to a count session.

**Acceptance criteria:**
- Quick "Ajuste manual" action from product detail or stock page
- Requires admin/supervisor role
- Adjustment notes required field

---

### BL-04 — Dashboard Charts
**Category:** Reports
**Effort:** M (3–5 days)

Wire existing KPI data to visual chart components. Currently the charts are scaffolded but use placeholder data.

**Acceptance criteria:**
- Install Recharts (or equivalent)
- Stock level trend: 30-day line chart per location
- Purchase volume: weekly bar chart
- Movement activity: sparklines per product

---

### BL-05 — Cancel In-Transit Transfer
**Category:** Transfers
**Effort:** S (1–2 days)

Allow admins to cancel a sent transfer before it is received.

**Acceptance criteria:**
- "Cancel transfer" button (admin only, status === 'sent')
- Reversal `transfer_out_reversal` movement recorded
- Transfer returns to `cancelled` status
- Stock restored at origin location

---

### BL-06 — Product Bulk Import
**Category:** Products
**Effort:** M (3–5 days)

CSV/Excel import for the product catalog. Currently products must be created one-by-one.

**Acceptance criteria:**
- Upload CSV with: `sku`, `name`, `unit_code`, `category`, `initial_price`
- Preview with validation errors per row
- Dry-run mode before committing
- Import report with created/skipped/error counts

---

## P2 — Medium Priority (Next Quarter)

### BL-07 — Google Sheets OAuth Integration
**Category:** Migration
**Effort:** L (1–2 weeks)

Complete the Google Sheets sync by implementing the OAuth 2.0 flow. Helpers already exist.

**Acceptance criteria:**
- "Connect Google account" flow in migration settings
- Can select a spreadsheet and sheet tab
- Rows pulled directly without CSV export step

---

### BL-08 — Background Export Jobs
**Category:** Exports
**Effort:** L (1–2 weeks)

Move large Excel exports to a background queue to avoid timeouts.

**Acceptance criteria:**
- Export request returns a job ID immediately
- Polling endpoint `GET /api/exports/[jobId]/status`
- Download link available when job completes
- Uses Vercel background functions or Supabase Edge Functions

---

### BL-09 — Supplier Analytics
**Category:** Reports
**Effort:** M (3–5 days)

Reports by supplier: purchase frequency, average lead time, total spend, product range.

**Acceptance criteria:**
- `/reports/suppliers` page with supplier selector
- KPIs: total orders, total items, avg days to receive, total spend
- Monthly trend chart

---

### BL-10 — Per-User Permission Editor
**Category:** Auth
**Effort:** M (3–5 days)

UI to grant or revoke individual permissions for a specific user, overriding their role defaults.

**Acceptance criteria:**
- Permission override stored in `user_permission_overrides` table
- Admin UI in `/settings/users/[id]/permissions`
- Overrides visible in roles matrix as exceptions

---

### BL-11 — Audit Log Viewer
**Category:** Admin
**Effort:** S (1–2 days)

UI to browse `audit_logs` table. Currently logs are written but only accessible via Supabase Studio.

**Acceptance criteria:**
- `/settings/audit` page (admin only)
- Filter by user, action type, date range
- Detail panel for before/after JSON diff

---

### BL-12 — Multi-Round Physical Counts
**Category:** Counts
**Effort:** M (3–5 days)

Support for multiple count rounds (initial count → recount flagged items → final reconciliation).

**Acceptance criteria:**
- Count session can have multiple rounds
- Items with large discrepancies auto-flagged for recount
- Final submission uses average or last-round value

---

### BL-13 — Notification System
**Category:** UX
**Effort:** L (1–2 weeks)

In-app notifications for key events: transfer awaiting receipt, low stock threshold, count submitted for approval.

**Acceptance criteria:**
- Notification bell in app header
- Notification types: transfer_pending, low_stock, count_pending_approval
- Mark as read / clear all
- Email digest option (daily summary)

---

### BL-14 — Barcode / QR Scanning
**Category:** UX
**Effort:** L (1–2 weeks)

Camera-based product lookup via barcode/QR on mobile devices.

**Acceptance criteria:**
- "Scan" button on product search fields
- Opens camera with `@zxing/browser` or `react-zxing`
- Matches `sku` or `barcode` field on product
- Falls back to text search if no match

---

### BL-15 — Reports KPI Export
**Category:** Reports
**Effort:** S (1–2 days)

Add Excel/PDF export to the reports pages (currently only tabular data is exported).

**Acceptance criteria:**
- "Export report" button on each report page
- Includes charts as embedded images (screenshot via canvas)
- PDF option using `@react-pdf/renderer` or browser print

---

## P3 — Roadmap

### BL-16 — End-to-End Test Suite
**Category:** Testing
**Effort:** L (1–2 weeks)

Playwright tests for critical user journeys against a test Supabase instance.

**Scope:** Login, create product, create purchase + receive, create transfer + send/receive, create count + submit, migration import + cutover.

---

### BL-17 — PWA / Offline Support
**Category:** Platform
**Effort:** XL (2–4 weeks)

Make the app installable and partially functional offline (view last-loaded data, queue mutations).

**Scope:** Service worker with Workbox, offline mutation queue with sync-on-reconnect, install prompt.

---

### BL-18 — Rollback Tooling UI
**Category:** Admin
**Effort:** M (3–5 days)

Admin UI for the cutover rollback operation. Currently rollback is only accessible via API or Supabase Studio.

**Acceptance criteria:**
- Rollback button in `/migration/cutover` with confirmation
- Shows what will be reversed before confirming
- Audit log entry for rollback

---

### BL-19 — Advanced Charting
**Category:** Reports
**Effort:** M (3–5 days)

After BL-04 (basic charts), add more advanced report visualizations: inventory heatmap by location, ABC analysis, movement velocity scatter plot.

---

### BL-20 — Retry Queue for Failed Movements
**Category:** Reliability
**Effort:** M (3–5 days)

When `record_movement()` RPC fails transiently, store the failed mutation in a retry queue and re-attempt with exponential backoff.

**Acceptance criteria:**
- Failed movements stored in `movement_retry_queue` table
- Background job retries up to 5× with backoff
- Alert admin if job exhausts retries

---

### BL-21 — Print Receipts
**Category:** Operations
**Effort:** S (1–2 days)

Printable receipt view for purchases, transfers, and count sessions. Useful for physical documentation.

**Acceptance criteria:**
- "Print" button on detail pages
- Print-optimized CSS (`@media print`)
- QR code with record ID for scan lookup

---

### BL-22 — Mobile Performance Pass
**Category:** UX
**Effort:** M (3–5 days)

Targeted performance optimization for mobile devices: reduce JS bundle size, lazy-load heavy components, optimize images, improve table scroll on small screens.

**Target:** Lighthouse mobile score ≥ 80.

---

## Summary

| Priority | Count | Items |
|----------|-------|-------|
| P1 | 6 | BL-01 through BL-06 |
| P2 | 9 | BL-07 through BL-15 |
| P3 | 7 | BL-16 through BL-22 |
| **Total** | **22** | |

---

*Last updated: March 2026 — Trading App v1.0*
