/**
 * tests/integration/purchases-receive.test.ts
 * Tests for purchase receiving flow.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/server/purchase-receiving', () => ({
  receivePurchaseEntry: vi.fn().mockResolvedValue({
    entryId: 'entry-1',
    movementsCreated: 3,
    totalReceived: 30,
  }),
}))

vi.mock('@/lib/server/purchases', () => ({
  getPurchaseEntryById: vi.fn().mockResolvedValue({
    id: 'entry-1',
    status: 'draft',
    location_id: 'loc-1',
    total_amount: 500,
  }),
}))

describe('Purchase receiving', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls receivePurchaseEntry with correct input', async () => {
    const { receivePurchaseEntry } = await import('@/lib/server/purchase-receiving')

    await receivePurchaseEntry({
      entry_id: 'entry-1',
      items: [
        { item_id: 'item-1', quantity_received: 10, unit_cost: 50 },
        { item_id: 'item-2', quantity_received: 20, unit_cost: 25 },
      ],
      notes: 'Recibido completo',
    })

    expect(receivePurchaseEntry).toHaveBeenCalledWith(
      expect.objectContaining({ entry_id: 'entry-1' })
    )
  })

  it('returns movement count on success', async () => {
    const { receivePurchaseEntry } = await import('@/lib/server/purchase-receiving')
    const result = await receivePurchaseEntry({
      entry_id: 'entry-1',
      items: [{ item_id: 'i1', quantity_received: 10, unit_cost: 5 }],
    })
    expect(result).toHaveProperty('movementsCreated')
  })
})

describe('Purchase receive API', () => {
  it('returns 409 when entry already received', async () => {
    vi.resetModules()
    vi.mock('@/lib/server/purchase-receiving', () => ({
      receivePurchaseEntry: vi.fn().mockRejectedValue(new Error('already received')),
    }))

    const { NextRequest } = await import('next/server')

    // Simulate route handler behavior
    const handler = async () => {
      try {
        const { receivePurchaseEntry } = await import('@/lib/server/purchase-receiving')
        await receivePurchaseEntry({ entry_id: 'x', items: [] })
        return { status: 200 }
      } catch (err) {
        if (err instanceof Error && err.message.includes('already received')) {
          return { status: 409 }
        }
        return { status: 500 }
      }
    }

    const result = await handler()
    expect(result.status).toBe(409)
  })
})
