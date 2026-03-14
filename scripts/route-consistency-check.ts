#!/usr/bin/env tsx
/**
 * scripts/route-consistency-check.ts
 * Verifies that all expected Next.js route files exist on disk.
 * Run: pnpm tsx scripts/route-consistency-check.ts
 */

import { existsSync } from 'fs'
import { join } from 'path'

const ROOT = join(process.cwd(), 'src')

interface RouteCheck {
  path: string
  critical: boolean
  label: string
}

const EXPECTED_ROUTES: RouteCheck[] = [
  // App layout & root
  { path: 'app/layout.tsx',                                     critical: true,  label: 'Root layout' },
  { path: 'app/(app)/layout.tsx',                               critical: true,  label: 'App shell layout' },
  { path: 'app/not-found.tsx',                                  critical: false, label: '404 page' },

  // Core pages
  { path: 'app/(app)/dashboard/page.tsx',                       critical: true,  label: 'Dashboard' },
  { path: 'app/(app)/dashboard/loading.tsx',                    critical: false, label: 'Dashboard loading' },
  { path: 'app/(app)/products/page.tsx',                        critical: true,  label: 'Products list' },
  { path: 'app/(app)/products/loading.tsx',                     critical: false, label: 'Products loading' },
  { path: 'app/(app)/products/new/page.tsx',                    critical: true,  label: 'New product' },
  { path: 'app/(app)/products/[id]/page.tsx',                   critical: true,  label: 'Product detail' },
  { path: 'app/(app)/purchases/page.tsx',                       critical: true,  label: 'Purchases list' },
  { path: 'app/(app)/purchases/loading.tsx',                    critical: false, label: 'Purchases loading' },
  { path: 'app/(app)/purchases/new/page.tsx',                   critical: true,  label: 'New purchase' },
  { path: 'app/(app)/purchases/[id]/page.tsx',                  critical: true,  label: 'Purchase detail' },
  { path: 'app/(app)/transfers/page.tsx',                       critical: true,  label: 'Transfers list' },
  { path: 'app/(app)/transfers/loading.tsx',                    critical: false, label: 'Transfers loading' },
  { path: 'app/(app)/transfers/new/page.tsx',                   critical: true,  label: 'New transfer' },
  { path: 'app/(app)/transfers/[id]/page.tsx',                  critical: true,  label: 'Transfer detail' },
  { path: 'app/(app)/counts/page.tsx',                          critical: true,  label: 'Counts list' },
  { path: 'app/(app)/counts/loading.tsx',                       critical: false, label: 'Counts loading' },
  { path: 'app/(app)/counts/new/page.tsx',                      critical: true,  label: 'New count' },
  { path: 'app/(app)/counts/[id]/page.tsx',                     critical: true,  label: 'Count detail' },
  { path: 'app/(app)/history/page.tsx',                         critical: true,  label: 'History' },
  { path: 'app/(app)/history/loading.tsx',                      critical: false, label: 'History loading' },

  // Settings
  { path: 'app/(app)/settings/page.tsx',                        critical: true,  label: 'Settings hub' },
  { path: 'app/(app)/settings/roles/page.tsx',                  critical: true,  label: 'Roles & permissions' },
  { path: 'app/(app)/settings/system/page.tsx',                 critical: true,  label: 'System status' },

  // Migration
  { path: 'app/(app)/migration/page.tsx',                       critical: true,  label: 'Migration hub' },
  { path: 'app/(app)/migration/import/page.tsx',                critical: true,  label: 'Migration import' },
  { path: 'app/(app)/migration/review/page.tsx',                critical: true,  label: 'Migration review' },
  { path: 'app/(app)/migration/opening-balances/page.tsx',      critical: true,  label: 'Opening balances' },
  { path: 'app/(app)/migration/cutover/page.tsx',               critical: true,  label: 'Cutover' },

  // Auth
  { path: 'app/(auth)/login/page.tsx',                          critical: true,  label: 'Login page' },

  // API routes — system
  { path: 'app/api/system/health/route.ts',                     critical: true,  label: 'GET /api/system/health' },
  { path: 'app/api/system/readiness/route.ts',                  critical: true,  label: 'GET /api/system/readiness' },
  { path: 'app/api/system/final-audit/route.ts',                critical: false, label: 'GET /api/system/final-audit' },

  // API routes — products
  { path: 'app/api/products/route.ts',                          critical: true,  label: 'GET/POST /api/products' },
  { path: 'app/api/products/[id]/route.ts',                     critical: true,  label: 'GET/PATCH /api/products/[id]' },

  // API routes — purchases
  { path: 'app/api/purchases/route.ts',                         critical: true,  label: 'GET/POST /api/purchases' },
  { path: 'app/api/purchases/[id]/route.ts',                    critical: true,  label: 'GET/PATCH /api/purchases/[id]' },
  { path: 'app/api/purchases/[id]/receive/route.ts',            critical: true,  label: 'POST /api/purchases/[id]/receive' },

  // API routes — transfers
  { path: 'app/api/transfers/route.ts',                         critical: true,  label: 'GET/POST /api/transfers' },
  { path: 'app/api/transfers/[id]/route.ts',                    critical: true,  label: 'GET/PATCH /api/transfers/[id]' },
  { path: 'app/api/transfers/[id]/send/route.ts',               critical: true,  label: 'POST /api/transfers/[id]/send' },
  { path: 'app/api/transfers/[id]/receive/route.ts',            critical: true,  label: 'POST /api/transfers/[id]/receive' },

  // API routes — counts
  { path: 'app/api/counts/route.ts',                            critical: true,  label: 'GET/POST /api/counts' },
  { path: 'app/api/counts/[id]/route.ts',                       critical: true,  label: 'GET/PATCH /api/counts/[id]' },
  { path: 'app/api/counts/[id]/submit/route.ts',                critical: true,  label: 'POST /api/counts/[id]/submit' },

  // API routes — history & stock
  { path: 'app/api/movements/route.ts',                         critical: true,  label: 'GET /api/movements' },
  { path: 'app/api/stock/route.ts',                             critical: true,  label: 'GET /api/stock' },

  // API routes — migration
  { path: 'app/api/migration/import/route.ts',                  critical: true,  label: 'POST /api/migration/import' },
  { path: 'app/api/migration/review/route.ts',                  critical: true,  label: 'GET/POST/PATCH /api/migration/review' },
  { path: 'app/api/migration/opening-balances/route.ts',        critical: true,  label: 'migration opening balances API' },
  { path: 'app/api/migration/cutover/route.ts',                 critical: true,  label: 'GET/POST /api/migration/cutover' },
  { path: 'app/api/migration/cutover/rollback/route.ts',        critical: true,  label: 'POST /api/migration/cutover/rollback' },

  // Core server libs
  { path: 'lib/server/purchases.ts',                            critical: true,  label: 'purchases server lib' },
  { path: 'lib/server/transfers.ts',                            critical: true,  label: 'transfers server lib' },
  { path: 'lib/server/counts.ts',                               critical: true,  label: 'counts server lib' },
  { path: 'lib/server/products.ts',                             critical: true,  label: 'products server lib' },
  { path: 'lib/server/system-health.ts',                        critical: true,  label: 'system health lib' },
  { path: 'lib/server/release-readiness.ts',                    critical: true,  label: 'release readiness lib' },
  { path: 'lib/server/permission-checks.ts',                    critical: true,  label: 'permission checks lib' },
  { path: 'lib/server/audit.ts',                                critical: true,  label: 'audit lib' },
  { path: 'lib/server/idempotency.ts',                          critical: true,  label: 'idempotency lib' },
  { path: 'lib/server/error-handling.ts',                       critical: true,  label: 'error handling lib' },
  { path: 'lib/server/request-context.ts',                      critical: true,  label: 'request context lib' },

  // Constants
  { path: 'lib/constants/permissions.ts',                       critical: true,  label: 'permissions constants' },

  // Supabase client
  { path: 'lib/supabase/server.ts',                             critical: true,  label: 'Supabase server client' },
  { path: 'lib/supabase/client.ts',                             critical: true,  label: 'Supabase browser client' },
]

function checkRoutes() {
  console.log('\n🗺️  ROUTE CONSISTENCY CHECK\n')

  let passed = 0
  let missingCritical = 0
  let missingNonCritical = 0

  for (const route of EXPECTED_ROUTES) {
    const full = join(ROOT, route.path)
    const exists = existsSync(full)
    if (exists) {
      passed++
    } else if (route.critical) {
      console.log(`  ❌ [CRITICAL] ${route.path}`)
      console.log(`     → ${route.label}`)
      missingCritical++
    } else {
      console.log(`  ⚠️  [optional] ${route.path}`)
      missingNonCritical++
    }
  }

  console.log('\n─────────────────────────────────────')
  console.log(`  Present  : ${passed}/${EXPECTED_ROUTES.length}`)
  console.log(`  Missing  : ${missingCritical} critical, ${missingNonCritical} optional`)
  console.log()

  if (missingCritical > 0) {
    console.error(`❌ ${missingCritical} critical route(s) missing — build is incomplete.\n`)
    process.exit(1)
  } else {
    console.log(`✅ All critical routes present.\n`)
    process.exit(0)
  }
}

checkRoutes()
