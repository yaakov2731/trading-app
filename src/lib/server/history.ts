/**
 * lib/server/history.ts
 * Movement history queries with rich filtering and pagination.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface HistoryFilterInput {
  location_id?: string
  product_id?: string
  movement_type?: string
  from_date?: string
  to_date?: string
  performed_by?: string
  search?: string
  page?: number
  page_size?: number
}

export interface HistoryRow {
  id: string
  product_id: string
  product_name: string
  sku: string
  unit_symbol: string
  category_name: string
  category_color: string | null
  location_id: string
  location_name: string
  location_color: string | null
  movement_type: string
  quantity: number
  unit_cost: number | null
  total_cost: number | null
  running_balance: number
  reference_type: string | null
  reference_id: string | null
  reference_code: string | null
  notes: string | null
  performed_by: string
  performed_by_name: string | null
  performed_at: string
  idempotency_key: string | null
}

export interface HistoryResult {
  movements: HistoryRow[]
  total: number
  hasMore: boolean
}

export async function getMovementHistory(
  filter: HistoryFilterInput = {}
): Promise<HistoryResult> {
  const {
    location_id,
    product_id,
    movement_type,
    from_date,
    to_date,
    performed_by,
    search,
    page = 1,
    page_size = 50,
  } = filter

  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('v_movement_history')
    .select('*', { count: 'exact' })

  if (location_id) query = query.eq('location_id', location_id)
  if (product_id) query = query.eq('product_id', product_id)
  if (movement_type) query = query.eq('movement_type', movement_type)
  if (performed_by) query = query.eq('performed_by', performed_by)
  if (from_date) query = query.gte('performed_at', from_date)
  if (to_date) query = query.lte('performed_at', to_date + 'T23:59:59')
  if (search?.trim()) {
    const term = search.trim()
    query = query.or(`product_name.ilike.%${term}%,sku.ilike.%${term}%,reference_code.ilike.%${term}%`)
  }

  const from = (page - 1) * page_size

  const { data, error, count } = await query
    .order('performed_at', { ascending: false })
    .range(from, from + page_size - 1)

  if (error) throw new Error(error.message)

  return {
    movements: (data ?? []) as HistoryRow[],
    total: count ?? 0,
    hasMore: (count ?? 0) > from + page_size,
  }
}

export async function getMovementById(id: string): Promise<HistoryRow | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('v_movement_history')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as HistoryRow
}

export async function getMovementSummary(
  locationId?: string,
  days = 30
): Promise<{
  totalIn: number
  totalOut: number
  netChange: number
  movementCount: number
}> {
  const supabase = await createServerSupabaseClient()
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  let query = supabase
    .from('stock_movements')
    .select('quantity')
    .gte('performed_at', since)

  if (locationId) query = query.eq('location_id', locationId)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  let totalIn = 0
  let totalOut = 0
  for (const row of data ?? []) {
    const qty = row.quantity as number
    if (qty > 0) totalIn += qty
    else totalOut += Math.abs(qty)
  }

  return {
    totalIn,
    totalOut,
    netChange: totalIn - totalOut,
    movementCount: (data ?? []).length,
  }
}
