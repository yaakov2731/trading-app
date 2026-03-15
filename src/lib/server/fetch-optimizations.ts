/**
 * lib/server/fetch-optimizations.ts
 * Fetch optimisation patterns — batching, deduplication, selective joins.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'

// ── Batch product lookup by IDs ───────────────────────────────────────────────

export async function batchFetchProducts(productIds: string[]) {
  if (productIds.length === 0) return []
  const unique = [...new Set(productIds)]
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('products')
    .select('id, sku, name, unit_id, units(symbol)')
    .in('id', unique)
  return data ?? []
}

// ── Batch location lookup ─────────────────────────────────────────────────────

export async function batchFetchLocations(locationIds: string[]) {
  if (locationIds.length === 0) return []
  const unique = [...new Set(locationIds)]
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('locations')
    .select('id, name, slug')
    .in('id', unique)
  return data ?? []
}

// ── Build lookup maps ─────────────────────────────────────────────────────────

export function buildIdMap<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]))
}

// ── Optimised stock balance fetch ─────────────────────────────────────────────

export async function fetchStockForLocation(locationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('v_current_stock')
    .select('product_id, product_name, sku, quantity, unit_symbol, min_stock')
    .eq('location_id', locationId)
    .gt('quantity', 0)
    .order('product_name')
  return data ?? []
}

// ── Dashboard stats in a single query ────────────────────────────────────────

export async function fetchDashboardCounts(locationIds: string[] | 'all') {
  const supabase = await createServerSupabaseClient()

  let stockQuery = supabase
    .from('stock_balances')
    .select('quantity', { count: 'exact', head: true })
    .gt('quantity', 0)

  if (locationIds !== 'all' && locationIds.length > 0) {
    stockQuery = stockQuery.in('location_id', locationIds)
  }

  const [stockResult] = await Promise.all([stockQuery])

  return {
    activeProducts: stockResult.count ?? 0,
  }
}

// ── Reduce join depth for list queries ────────────────────────────────────────

/**
 * For list views, avoid deep joins.
 * Fetch related entities separately and merge client-side.
 * This pattern avoids expensive cross-table scans on large tables.
 */
export async function fetchMovementsLean(opts: {
  locationId?: string
  limit?: number
  page?: number
}) {
  const { locationId, limit = 50, page = 1 } = opts
  const supabase = await createServerSupabaseClient()
  const from = (page - 1) * limit

  let query = supabase
    .from('stock_movements')
    .select(
      'id, product_id, location_id, movement_type, quantity, performed_at, notes',
      { count: 'exact' }
    )

  if (locationId) query = query.eq('location_id', locationId)

  const { data, count } = await query
    .order('performed_at', { ascending: false })
    .range(from, from + limit - 1)

  return { data: data ?? [], total: count ?? 0 }
}
