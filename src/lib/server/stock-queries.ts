/**
 * lib/server/stock-queries.ts
 * Composable stock balance queries used across pages and API routes.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface StockBalanceRow {
  product_id: string
  location_id: string
  sku: string
  product_name: string
  barcode: string | null
  unit_cost: number | null
  min_stock: number
  max_stock: number | null
  is_active: boolean
  current_stock: number
  last_movement_at: string | null
  last_updated_at: string
  category_id: string
  category_name: string
  category_color: string | null
  unit_id: string
  unit_name: string
  unit_symbol: string
  location_name: string
  location_color: string | null
  effective_min_stock: number
  stock_status: 'zero' | 'low' | 'warning' | 'ok'
}

export interface StockQueryOptions {
  locationId?: string
  categoryId?: string
  status?: 'zero' | 'low' | 'warning' | 'ok'
  search?: string
  page?: number
  pageSize?: number
}

export interface StockQueryResult {
  rows: StockBalanceRow[]
  total: number
  hasMore: boolean
}

export async function getStockBalances(
  opts: StockQueryOptions = {}
): Promise<StockQueryResult> {
  const { locationId, categoryId, status, search, page = 1, pageSize = 50 } = opts
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('v_current_stock')
    .select('*', { count: 'exact' })

  if (locationId) query = query.eq('location_id', locationId)
  if (categoryId) query = query.eq('category_id', categoryId)
  if (status) query = query.eq('stock_status', status)
  if (search?.trim()) {
    const t = search.trim()
    query = query.or(`product_name.ilike.%${t}%,sku.ilike.%${t}%`)
  }

  const from = (page - 1) * pageSize

  const { data, error, count } = await query
    .order('location_name')
    .order('product_name')
    .range(from, from + pageSize - 1)

  if (error) throw new Error(error.message)

  return {
    rows: (data ?? []) as StockBalanceRow[],
    total: count ?? 0,
    hasMore: (count ?? 0) > from + pageSize,
  }
}

export async function getStockBalance(
  productId: string,
  locationId: string
): Promise<number> {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('stock_balances')
    .select('current_stock')
    .eq('product_id', productId)
    .eq('location_id', locationId)
    .single()

  return (data?.current_stock as number | null) ?? 0
}

export async function getStockBalancesBatch(
  productIds: string[],
  locationId: string
): Promise<Map<string, number>> {
  if (!productIds.length) return new Map()

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('stock_balances')
    .select('product_id, current_stock')
    .in('product_id', productIds)
    .eq('location_id', locationId)

  if (error) throw new Error(error.message)

  const map = new Map<string, number>()
  for (const row of data ?? []) {
    map.set(row.product_id as string, row.current_stock as number)
  }
  return map
}

/**
 * Returns the total value of stock at a location.
 * Uses cost_price × current_stock per product.
 */
export async function getStockValueForLocation(locationId: string): Promise<number> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('v_current_stock')
    .select('current_stock, unit_cost')
    .eq('location_id', locationId)

  if (error) throw new Error(error.message)

  return (data ?? []).reduce((sum, r) => {
    const stock = (r.current_stock as number) ?? 0
    const cost = (r.unit_cost as number | null) ?? 0
    return sum + stock * cost
  }, 0)
}
