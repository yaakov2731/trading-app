# Known Issues — Trading App v1.0

> Issues accepted at launch. Each has a severity, workaround where available, and a planned resolution milestone.

---

## KI-01 — Migration tables not auto-created

**Category:** Database
**Severity:** High
**Status:** Open at launch

**Description:**
The tables `migration_opening_balance_candidates`, `migration_cutover_log`, and `audit_logs` are not part of the main Supabase migration files. They must be created manually before first use of the migration module.

**Workaround:**
Run the SQL block in `docs/PRODUCTION_CHECKLIST.md` section 3b before using `/migration`.

**Resolution:** Add these tables to the main migration file in the next schema update.

---

## KI-02 — Supabase types not auto-generated

**Category:** Build
**Severity:** Medium
**Status:** Open at launch
**Deferred to:** Post-MVP hardening

**Description:**
The Supabase SDK is used without generated TypeScript types (`Database<...>`). Some queries fall back to implicit `any`. This doesn't affect runtime behavior but reduces type safety for future development.

**Workaround:**
Run before development:
```bash
supabase gen types typescript --local > src/lib/supabase/database.types.ts
```
Then update client initialization to use the generated types.

**Resolution:** Generate types as part of CI and commit them on schema change.

---

## KI-03 — GlobalCommandBar has no keyboard navigation

**Category:** UX
**Severity:** Low
**Status:** Open at launch
**Deferred to:** Post-MVP polish

**Description:**
The global command bar (Cmd+K / Ctrl+K) opens and filters results correctly, but the results list cannot be navigated with arrow keys. The user must use mouse or touch to select a result.

**Workaround:**
Click or tap the desired item in the results list.

**Resolution:** Add `onKeyDown` handler with ↑/↓ navigation and Enter to confirm.

---

## KI-04 — No partial receiving for purchases

**Category:** Flows
**Severity:** Medium
**Status:** Open at launch
**Deferred to:** Post-MVP P1

**Description:**
When receiving a purchase entry, all items in the entry are marked as received at their full ordered quantity. There is no UI to receive a partial quantity per line item (e.g., "ordered 100, received 80").

**Workaround:**
Manually adjust stock after receiving using a physical count adjustment, or split the purchase into two entries before receiving.

**Resolution:** Add per-item quantity input to the receive flow with `received_quantity` vs `ordered_quantity` tracking.

---

## KI-05 — No UI to cancel an in-transit transfer

**Category:** Flows
**Severity:** Low
**Status:** Open at launch
**Deferred to:** Post-MVP P1

**Description:**
A transfer that has been sent (`transfer_out` movement recorded) cannot be cancelled from the UI. Once sent, the only resolution paths are: receive it at the destination, or manually intervene in the database.

**Workaround:**
Admin can delete the `transfer_out` movement and reset the transfer status directly in Supabase Studio. This is an advanced operation.

**Resolution:** Add a "Cancel transfer" action (admin only) that reverses the `transfer_out` movement and sets status back to `draft`.

---

## KI-06 — Dashboard charts are scaffolded but not connected

**Category:** Reports
**Severity:** Medium
**Status:** Open at launch
**Deferred to:** Post-MVP P1

**Description:**
The reports and executive dashboard pages have the correct layout, data fetching, and KPI calculation logic, but the visual chart components (trend lines, bar charts) are placeholder/scaffolded. No chart library is wired up.

**Workaround:**
Use the tabular data and KPI numbers which are fully functional. Charts are cosmetic at launch.

**Resolution:** Install Recharts or Chart.js and wire existing data into chart components.

---

## KI-07 — Large exports block the main thread

**Category:** Exports
**Severity:** Low
**Status:** Open at launch
**Deferred to:** Post-MVP P2

**Description:**
Excel exports (`.xlsx`) are generated synchronously in the API route handler. For datasets over ~5,000 rows, this may cause the request to time out or be slow (10–30+ seconds). Vercel's default function timeout is 10s on Hobby plan.

**Workaround:**
Apply date range or location filters before exporting to reduce row count. On Pro Vercel plan, function timeout can be extended to 60s.

**Resolution:** Implement background export jobs (queue + polling) and increase function memory allocation.

---

## KI-08 — Permission matrix is read-only

**Category:** Auth
**Severity:** Low
**Status:** Open at launch
**Deferred to:** Post-MVP P2

**Description:**
The `/settings/roles` page shows the full permission matrix for all roles, but it is static and read-only. There is no UI to assign granular permissions to individual users (only role-based access is supported).

**Workaround:**
Change a user's role to grant different permissions. The 4-tier role hierarchy covers most use cases.

**Resolution:** Add a per-user permission override editor that stores exceptions in a `user_permission_overrides` table.

---

## KI-09 — Google Sheets sync OAuth not wired

**Category:** Migration
**Severity:** Low
**Status:** Open at launch
**Deferred to:** Post-MVP P2

**Description:**
The migration module includes helper functions for building Google Sheets sync payloads, but the OAuth 2.0 authentication flow with Google is not connected. The `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` env vars are accepted but unused.

**Workaround:**
Use CSV export from Google Sheets and upload via the "CSV file upload" option in the migration import form.

**Resolution:** Implement Google OAuth PKCE flow, store refresh tokens, and wire `google_sheets_sync` export type.

---

## KI-10 — No end-to-end (E2E) tests

**Category:** Testing
**Severity:** Low
**Status:** Open at launch
**Deferred to:** Post-MVP P3

**Description:**
The test suite covers unit tests and integration tests using Vitest with mocked Supabase. There are no Playwright or Cypress E2E tests that run against a real browser against the actual application.

**Workaround:**
Manual smoke testing using the checklist in `docs/SMOKE_TEST_PLAN.md` covers the most critical user flows before each release.

**Resolution:** Set up Playwright test suite with a dedicated Supabase test project and seed fixtures.

---

## Adding New Issues

When a new known issue is discovered:

1. Add it to this file with the next `KI-XX` ID
2. Add it to the `KNOWN_ISSUES` array in `src/components/settings/known-issues-panel.tsx`
3. Assign severity (`high` / `medium` / `low`) based on user impact
4. Set `deferredTo` priority if not blocking

---

*Last updated: March 2026 — Trading App v1.0*
