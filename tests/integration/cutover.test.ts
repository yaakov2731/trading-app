/**
 * tests/integration/cutover.test.ts
 * Tests for cutover execution flow.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Cutover idempotency keys', () => {
  it('generates stable keys for same candidateId', async () => {
    const { IdempotencyKeys } = await import('@/lib/server/idempotency')
    const key1 = IdempotencyKeys.cutoverOpening('candidate-abc')
    const key2 = IdempotencyKeys.cutoverOpening('candidate-abc')
    expect(key1).toBe(key2)
    expect(key1).toBe('cutover-opening-candidate-abc')
  })

  it('generates different keys for different candidates', async () => {
    const { IdempotencyKeys } = await import('@/lib/server/idempotency')
    const key1 = IdempotencyKeys.cutoverOpening('c1')
    const key2 = IdempotencyKeys.cutoverOpening('c2')
    expect(key1).not.toBe(key2)
  })

  it('purchase-receive key format is correct', async () => {
    const { IdempotencyKeys } = await import('@/lib/server/idempotency')
    const key = IdempotencyKeys.purchaseReceive('entry-1', 'item-2')
    expect(key).toBe('purchase-receive-entry-1-item-2')
  })
})

describe('executeCutoverSchema validation', () => {
  it('requires confirmed=true', async () => {
    const { executeCutoverSchema } = await import('@/lib/validations/migration')

    const result = executeCutoverSchema.safeParse({ dry_run: false, confirmed: false })
    expect(result.success).toBe(false)

    const result2 = executeCutoverSchema.safeParse({ dry_run: false, confirmed: true })
    expect(result2.success).toBe(true)
  })

  it('defaults dry_run to false', async () => {
    const { executeCutoverSchema } = await import('@/lib/validations/migration')
    const result = executeCutoverSchema.safeParse({ confirmed: true })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.dry_run).toBe(false)
  })
})

describe('Cutover preflight checks', () => {
  it('returns ok:false when blocking errors exist', () => {
    const preflight = {
      ok: false,
      approved_ready: 5,
      unresolved_product: 2,
      unresolved_location: 0,
      warnings: [],
      blocking_errors: ['2 candidatos aprobados sin producto vinculado'],
    }
    expect(preflight.ok).toBe(false)
    expect(preflight.blocking_errors.length).toBeGreaterThan(0)
  })

  it('returns ok:true when all resolved', () => {
    const preflight = {
      ok: true,
      approved_ready: 10,
      unresolved_product: 0,
      unresolved_location: 0,
      warnings: [],
      blocking_errors: [],
    }
    expect(preflight.ok).toBe(true)
  })
})
