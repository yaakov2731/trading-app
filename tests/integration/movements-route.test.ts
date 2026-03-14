/**
 * tests/integration/movements-route.test.ts
 * Integration tests for the movement history API route.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/server/history', () => ({
  getMovementHistory: vi.fn().mockResolvedValue({
    movements: [
      {
        id: 'm1',
        product_name: 'Bife de chorizo',
        movement_type: 'purchase_in',
        quantity: 10,
        location_name: 'Umo Grill',
        performed_at: '2025-01-15T08:00:00',
        unit_symbol: 'kg',
      },
    ],
    total: 1,
  }),
}))

describe('GET /api/history', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns paginated movement history', async () => {
    const { GET } = await import('@/app/api/history/route')
    const req = new NextRequest('http://localhost/api/history')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty('movements')
    expect(data).toHaveProperty('total')
    expect(data.movements[0]).toHaveProperty('product_name')
  })

  it('passes location filter to history service', async () => {
    const { getMovementHistory } = await import('@/lib/server/history')
    const { GET } = await import('@/app/api/history/route')
    const req = new NextRequest('http://localhost/api/history?location_id=abc-123')
    await GET(req)
    expect(getMovementHistory).toHaveBeenCalledWith(
      expect.objectContaining({ location_id: 'abc-123' })
    )
  })
})
