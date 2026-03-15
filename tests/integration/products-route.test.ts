/**
 * tests/integration/products-route.test.ts
 * Integration tests for the products API route.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/products/route'
import { NextRequest } from 'next/server'

// Mock supabase products
vi.mock('@/lib/server/supabase-products', () => ({
  getProducts: vi.fn().mockResolvedValue([
    { id: '1', sku: 'TEST-001', name: 'Test Product', is_active: true, category_name: 'Carnes', unit_symbol: 'kg' },
  ]),
}))

describe('GET /api/products', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with products list', async () => {
    const req = new NextRequest('http://localhost/api/products')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data[0]).toHaveProperty('sku', 'TEST-001')
  })

  it('passes search param to service', async () => {
    const { getProducts } = await import('@/lib/server/supabase-products')
    const req = new NextRequest('http://localhost/api/products?q=bife')
    await GET(req)
    expect(getProducts).toHaveBeenCalledWith(expect.objectContaining({ search: 'bife' }))
  })

  it('returns 200 with empty array when no products', async () => {
    const { getProducts } = await import('@/lib/server/supabase-products')
    vi.mocked(getProducts).mockResolvedValueOnce([])
    const req = new NextRequest('http://localhost/api/products')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual([])
  })
})
