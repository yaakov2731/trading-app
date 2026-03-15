#!/usr/bin/env tsx
/**
 * scripts/smoke-checklist.ts
 * Structured smoke test checklist — outputs pass/fail per test step.
 * Run: pnpm tsx scripts/smoke-checklist.ts
 * Requires: APP_URL env var (default http://localhost:3000)
 */

const BASE = process.env.APP_URL ?? 'http://localhost:3000'

interface SmokeTest {
  id: string
  label: string
  url: string
  expectedStatus: number
  note?: string
}

const SMOKE_TESTS: SmokeTest[] = [
  // System
  { id: 'ST-01', label: 'Health check endpoint', url: '/api/system/health', expectedStatus: 200 },
  { id: 'ST-02', label: 'Readiness endpoint', url: '/api/system/readiness', expectedStatus: 200 },

  // Core pages (redirects if unauthed are OK — just checking they respond)
  { id: 'ST-03', label: 'Dashboard page', url: '/dashboard', expectedStatus: 200, note: 'May redirect to login' },
  { id: 'ST-04', label: 'Products page', url: '/products', expectedStatus: 200, note: 'May redirect to login' },
  { id: 'ST-05', label: 'Purchases page', url: '/purchases', expectedStatus: 200, note: 'May redirect to login' },
  { id: 'ST-06', label: 'Transfers page', url: '/transfers', expectedStatus: 200, note: 'May redirect to login' },
  { id: 'ST-07', label: 'Counts page', url: '/counts', expectedStatus: 200, note: 'May redirect to login' },
  { id: 'ST-08', label: 'History page', url: '/history', expectedStatus: 200, note: 'May redirect to login' },
  { id: 'ST-09', label: 'Migration page', url: '/migration', expectedStatus: 200, note: 'May redirect to login' },

  // API routes
  { id: 'ST-10', label: 'Products API', url: '/api/products', expectedStatus: 200 },
  { id: 'ST-11', label: 'History API', url: '/api/history', expectedStatus: 200 },
  { id: 'ST-12', label: 'Alerts API', url: '/api/alerts', expectedStatus: 200 },
]

async function runSmoke() {
  console.log('\n🔥 SMOKE CHECKLIST\n')
  console.log(`Base URL: ${BASE}\n`)

  let passed = 0
  let failed = 0
  const failures: string[] = []

  for (const test of SMOKE_TESTS) {
    const url = `${BASE}${test.url}`
    try {
      const res = await fetch(url, {
        redirect: 'manual',
        headers: { Accept: 'application/json' },
      })

      const actualStatus = res.status
      // Allow redirects (3xx) for page routes that require auth
      const ok =
        actualStatus === test.expectedStatus ||
        (test.note?.includes('redirect') && actualStatus >= 300 && actualStatus < 400) ||
        actualStatus === 200

      if (ok) {
        console.log(`  ✅ ${test.id} — ${test.label} (${actualStatus})`)
        passed++
      } else {
        console.log(`  ❌ ${test.id} — ${test.label} (expected ${test.expectedStatus}, got ${actualStatus})`)
        failures.push(`${test.id}: ${test.label}`)
        failed++
      }
    } catch (err) {
      console.log(`  ❌ ${test.id} — ${test.label} (NETWORK ERROR: ${err instanceof Error ? err.message : err})`)
      failures.push(`${test.id}: ${test.label} — network error`)
      failed++
    }
  }

  console.log('\n─────────────────────────────')
  console.log(`Results: ${passed} passed, ${failed} failed`)

  if (failures.length > 0) {
    console.log('\nFailed tests:')
    failures.forEach((f) => console.log(`  · ${f}`))
    process.exit(1)
  } else {
    console.log('\n✅ All smoke tests passed!\n')
    process.exit(0)
  }
}

runSmoke()
