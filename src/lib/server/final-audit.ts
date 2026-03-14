/**
 * lib/server/final-audit.ts
 * File/module-based heuristic audit of MVP completeness.
 */

import { existsSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()

export interface AuditItem {
  category: string
  label: string
  path: string
  exists: boolean
  critical: boolean
}

export interface FinalAuditReport {
  totalChecked: number
  present: number
  missing: number
  criticalMissing: number
  items: AuditItem[]
  missingCritical: AuditItem[]
  missingNonCritical: AuditItem[]
}

// ── File manifest ─────────────────────────────────────────────────────────────

const MANIFEST: Omit<AuditItem, 'exists'>[] = [
  // Core pages
  { category: 'Pages', label: 'Dashboard', path: 'src/app/(app)/dashboard/page.tsx', critical: true },
  { category: 'Pages', label: 'Products list', path: 'src/app/(app)/products/page.tsx', critical: true },
  { category: 'Pages', label: 'Products new', path: 'src/app/(app)/products/new/page.tsx', critical: true },
  { category: 'Pages', label: 'Purchases list', path: 'src/app/(app)/purchases/page.tsx', critical: true },
  { category: 'Pages', label: 'Purchases new', path: 'src/app/(app)/purchases/new/page.tsx', critical: true },
  { category: 'Pages', label: 'Purchases detail', path: 'src/app/(app)/purchases/[id]/page.tsx', critical: true },
  { category: 'Pages', label: 'Transfers list', path: 'src/app/(app)/transfers/page.tsx', critical: true },
  { category: 'Pages', label: 'Transfers new', path: 'src/app/(app)/transfers/new/page.tsx', critical: true },
  { category: 'Pages', label: 'Counts list', path: 'src/app/(app)/counts/page.tsx', critical: true },
  { category: 'Pages', label: 'Counts new', path: 'src/app/(app)/counts/new/page.tsx', critical: true },
  { category: 'Pages', label: 'History', path: 'src/app/(app)/history/page.tsx', critical: true },
  { category: 'Pages', label: 'Suppliers list', path: 'src/app/(app)/suppliers/page.tsx', critical: true },
  { category: 'Pages', label: 'Migration hub', path: 'src/app/(app)/migration/page.tsx', critical: false },
  { category: 'Pages', label: 'Migration import', path: 'src/app/(app)/migration/import/page.tsx', critical: false },
  { category: 'Pages', label: 'Migration review', path: 'src/app/(app)/migration/review/page.tsx', critical: false },
  { category: 'Pages', label: 'Opening balances', path: 'src/app/(app)/migration/opening-balances/page.tsx', critical: false },
  { category: 'Pages', label: 'Cutover', path: 'src/app/(app)/migration/cutover/page.tsx', critical: false },
  { category: 'Pages', label: 'Settings roles', path: 'src/app/(app)/settings/roles/page.tsx', critical: false },
  { category: 'Pages', label: 'System status', path: 'src/app/(app)/settings/system/page.tsx', critical: false },

  // Loading states
  { category: 'Loading', label: 'Dashboard loading', path: 'src/app/(app)/dashboard/loading.tsx', critical: false },
  { category: 'Loading', label: 'Products loading', path: 'src/app/(app)/products/loading.tsx', critical: false },
  { category: 'Loading', label: 'Purchases loading', path: 'src/app/(app)/purchases/loading.tsx', critical: false },
  { category: 'Loading', label: 'History loading', path: 'src/app/(app)/history/loading.tsx', critical: false },

  // API routes
  { category: 'API', label: 'Products API', path: 'src/app/api/products/route.ts', critical: true },
  { category: 'API', label: 'History API', path: 'src/app/api/history/route.ts', critical: true },
  { category: 'API', label: 'Purchases receive', path: 'src/app/api/purchases/[id]/receive/route.ts', critical: true },
  { category: 'API', label: 'Counts API', path: 'src/app/api/counts/route.ts', critical: true },
  { category: 'API', label: 'Transfers API', path: 'src/app/api/transfers/route.ts', critical: true },
  { category: 'API', label: 'Alerts API', path: 'src/app/api/alerts/route.ts', critical: false },
  { category: 'API', label: 'Migration import', path: 'src/app/api/migration/import/route.ts', critical: false },
  { category: 'API', label: 'Migration review', path: 'src/app/api/migration/review/route.ts', critical: false },
  { category: 'API', label: 'Cutover API', path: 'src/app/api/migration/cutover/route.ts', critical: false },
  { category: 'API', label: 'System health', path: 'src/app/api/system/health/route.ts', critical: false },

  // Server services
  { category: 'Services', label: 'Products service', path: 'src/lib/server/supabase-products.ts', critical: true },
  { category: 'Services', label: 'Purchases service', path: 'src/lib/server/purchases.ts', critical: true },
  { category: 'Services', label: 'Purchase receiving', path: 'src/lib/server/purchase-receiving.ts', critical: true },
  { category: 'Services', label: 'Transfers service', path: 'src/lib/server/transfers.ts', critical: true },
  { category: 'Services', label: 'Physical counts', path: 'src/lib/server/physical-counts.ts', critical: true },
  { category: 'Services', label: 'Movement history', path: 'src/lib/server/history.ts', critical: true },
  { category: 'Services', label: 'Alerts service', path: 'src/lib/server/alerts.ts', critical: false },
  { category: 'Services', label: 'Stock queries', path: 'src/lib/server/stock-queries.ts', critical: true },
  { category: 'Services', label: 'Auth guards', path: 'src/lib/server/auth-guards.ts', critical: true },
  { category: 'Services', label: 'Location access', path: 'src/lib/server/location-access.ts', critical: true },
  { category: 'Services', label: 'Suppliers service', path: 'src/lib/server/suppliers.ts', critical: true },
  { category: 'Services', label: 'Legacy parser', path: 'src/lib/server/legacy-parser.ts', critical: false },
  { category: 'Services', label: 'Migration import', path: 'src/lib/server/migration-import.ts', critical: false },
  { category: 'Services', label: 'Opening balances', path: 'src/lib/server/opening-balances.ts', critical: false },
  { category: 'Services', label: 'Cutover service', path: 'src/lib/server/cutover.ts', critical: false },
  { category: 'Services', label: 'Permission checks', path: 'src/lib/server/permission-checks.ts', critical: true },
  { category: 'Services', label: 'Audit service', path: 'src/lib/server/audit.ts', critical: false },
  { category: 'Services', label: 'Error handling', path: 'src/lib/server/error-handling.ts', critical: true },

  // Validations
  { category: 'Validations', label: 'Purchases schema', path: 'src/lib/validations/purchases.ts', critical: true },
  { category: 'Validations', label: 'Transfers schema', path: 'src/lib/validations/transfers.ts', critical: true },
  { category: 'Validations', label: 'Counts schema', path: 'src/lib/validations/counts.ts', critical: true },
  { category: 'Validations', label: 'Suppliers schema', path: 'src/lib/validations/suppliers.ts', critical: true },
  { category: 'Validations', label: 'Migration schema', path: 'src/lib/validations/migration.ts', critical: false },
  { category: 'Validations', label: 'Common schema', path: 'src/lib/validations/common.ts', critical: false },

  // Exports
  { category: 'Exports', label: 'Stock export', path: 'src/lib/export/stock-export.ts', critical: true },
  { category: 'Exports', label: 'Movements export', path: 'src/lib/export/movements-export.ts', critical: true },
  { category: 'Exports', label: 'Purchases export', path: 'src/lib/export/purchases-export.ts', critical: true },
  { category: 'Exports', label: 'Transfers export', path: 'src/lib/export/transfers-export.ts', critical: false },
  { category: 'Exports', label: 'Counts export', path: 'src/lib/export/counts-export.ts', critical: false },
  { category: 'Exports', label: 'Suppliers export', path: 'src/lib/export/suppliers-export.ts', critical: false },
  { category: 'Exports', label: 'Opening balances export', path: 'src/lib/export/opening-balances-export.ts', critical: false },

  // DB
  { category: 'Database', label: 'Migrations dir', path: 'supabase/migrations', critical: true },
  { category: 'Database', label: 'Seed SQL', path: 'supabase/seed.sql', critical: true },

  // Docs
  { category: 'Docs', label: 'Setup README', path: 'README_SETUP.md', critical: true },
  { category: 'Docs', label: 'Deploy README', path: 'README_DEPLOY.md', critical: true },
  { category: 'Docs', label: 'QA README', path: 'README_QA.md', critical: false },
  { category: 'Docs', label: 'MVP Closeout doc', path: 'docs/MVP_CLOSEOUT.md', critical: false },
  { category: 'Docs', label: 'Known Issues doc', path: 'docs/KNOWN_ISSUES.md', critical: false },

  // Tests
  { category: 'Tests', label: 'Vitest config', path: 'vitest.config.ts', critical: false },
  { category: 'Tests', label: 'Test setup', path: 'tests/setup.ts', critical: false },
  { category: 'Tests', label: 'SKU unit tests', path: 'tests/unit/sku.test.ts', critical: false },
  { category: 'Tests', label: 'Permissions tests', path: 'tests/unit/permissions.test.ts', critical: false },
]

// ── Runner ────────────────────────────────────────────────────────────────────

export async function runFinalAudit(): Promise<FinalAuditReport> {
  const items: AuditItem[] = MANIFEST.map((entry) => ({
    ...entry,
    exists: existsSync(join(ROOT, entry.path)),
  }))

  const present = items.filter((i) => i.exists).length
  const missing = items.filter((i) => !i.exists)
  const criticalMissing = missing.filter((i) => i.critical)

  return {
    totalChecked: items.length,
    present,
    missing: missing.length,
    criticalMissing: criticalMissing.length,
    items,
    missingCritical: criticalMissing,
    missingNonCritical: missing.filter((i) => !i.critical),
  }
}
