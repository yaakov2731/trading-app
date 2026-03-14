/**
 * lib/server/supabase-dashboard.ts
 * Dashboard queries using the canonical Supabase server client.
 * Consolidates all dashboard data fetching in one place.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/session'
import { isAdmin } from '@/lib/auth/permissions'

export interface DashboardStats {
  totalProducts: number
  activeLocations: number
  totalMovements24h: number
  lowStockCount: number
  zeroStockCount: number
  recentMovementsValue: number
}

export interface StockSummaryRow {
  location_id: string
  location_name: string
  location_color: string | null
  total_products: number
  low_stock_count: number
  zero_stock_count: number
}

export interface RecentMovementRow {
  id: string
  product_name: string
  sku: string
  unit_symbol: string
  movement_type: string
  quantity: number
  running_balance: number
  location_name: string
  location_color: string | null
  performed_by_name: string | null
  performed_at: string
}

export interface CategoryStockRow {
  category_id: string
  category_name: string
  category_color: string | null
  product_count: number
  low_stock_count: number
}

export interface DailyMovementRow {
  date: string
  in_total: number
  out_total: number
  movement_count: number
}

export async function getDashboardStats(locationIds?: string[]): Promise<DashboardStats> {
  const supabase = await createServerSupabaseClient()
  const session = await getSession()

  // Total active products
  const { count: totalProducts } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)

  // Active locations (accessible)
  const { count: activeLocations } = await supabase
    .from('locations')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)

  // Movements in last 24h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  let movQuery = supabase
    .from('stock_movements')
    .select('id', { count: 'exact', head: true })
    .gte('performed_at', since)

  if (locationIds?.length) {
    movQuery = movQuery.in('location_id', locationIds)
  }
  const { count: totalMovements24h } = await movQuery

  // Low + zero stock from view
  let stockQuery = supabase
    .from('v_current_stock')
    .select('stock_status, location_id')

  if (locationIds?.length) {
    stockQuery = stockQuery.in('location_id', locationIds)
  } else if (session && !isAdmin(session.user)) {
    const locationList = session.user.locations.map((l) => l.locationId)
    if (locationList.length) stockQuery = stockQuery.in('location_id', locationList)
  }

  const { data: stockData } = await stockQuery

  const lowStockCount = stockData?.filter((r) => r.stock_status === 'low').length ?? 0
  const zeroStockCount = stockData?.filter((r) => r.stock_status === 'zero').length ?? 0

  return {
    totalProducts: totalProducts ?? 0,
    activeLocations: activeLocations ?? 0,
    totalMovements24h: totalMovements24h ?? 0,
    lowStockCount,
    zeroStockCount,
    recentMovementsValue: 0, // computed separately if needed
  }
}

export async function getRecentMovements(
  limit = 10,
  locationIds?: string[]
): Promise<RecentMovementRow[]> {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('v_movement_history')
    .select(
      'id, product_name, sku, unit_symbol, movement_type, quantity, running_balance, location_name, location_color, performed_by_name, performed_at'
    )
    .order('performed_at', { ascending: false })
    .limit(limit)

  if (locationIds?.length) {
    query = query.in('location_id', locationIds)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as RecentMovementRow[]
}

export async function getStockSummaryByLocation(
  locationIds?: string[]
): Promise<StockSummaryRow[]> {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('v_current_stock')
    .select('location_id, location_name, location_color, stock_status')

  if (locationIds?.length) {
    query = query.in('location_id', locationIds)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  // Aggregate by location
  const map = new Map<string, StockSummaryRow>()
  for (const row of data ?? []) {
    if (!map.has(row.location_id as string)) {
      map.set(row.location_id as string, {
        location_id: row.location_id as string,
        location_name: row.location_name as string,
        location_color: row.location_color as string | null,
        total_products: 0,
        low_stock_count: 0,
        zero_stock_count: 0,
      })
    }
    const entry = map.get(row.location_id as string)!
    entry.total_products++
    if (row.stock_status === 'low') entry.low_stock_count++
    if (row.stock_status === 'zero') entry.zero_stock_count++
  }

  return Array.from(map.values()).sort((a, b) => a.location_name.localeCompare(b.location_name))
}

export async function getCategoryStockSummary(
  locationIds?: string[]
): Promise<CategoryStockRow[]> {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('v_current_stock')
    .select('category_id, category_name, category_color, stock_status')

  if (locationIds?.length) {
    query = query.in('location_id', locationIds)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const map = new Map<string, CategoryStockRow>()
  for (const row of data ?? []) {
    if (!map.has(row.category_id as string)) {
      map.set(row.category_id as string, {
        category_id: row.category_id as string,
        category_name: row.category_name as string,
        category_color: row.category_color as string | null,
        product_count: 0,
        low_stock_count: 0,
      })
    }
    const entry = map.get(row.category_id as string)!
    entry.product_count++
    if ((row.stock_status as string) === 'low' || (row.stock_status as string) === 'zero') {
      entry.low_stock_count++
    }
  }

  return Array.from(map.values()).sort((a, b) => a.category_name.localeCompare(b.category_name))
}

export async function getDailyMovementSummary(
  days = 7,
  locationIds?: string[]
): Promise<DailyMovementRow[]> {
  const supabase = await createServerSupabaseClient()

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  let query = supabase
    .from('stock_movements')
    .select('quantity, performed_at, location_id')
    .gte('performed_at', since)
    .order('performed_at', { ascending: true })

  if (locationIds?.length) {
    query = query.in('location_id', locationIds)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  // Group by date
  const map = new Map<string, DailyMovementRow>()
  for (const row of data ?? []) {
    const date = (row.performed_at as string).slice(0, 10)
    if (!map.has(date)) {
      map.set(date, { date, in_total: 0, out_total: 0, movement_count: 0 })
    }
    const entry = map.get(date)!
    const qty = row.quantity as number
    entry.movement_count++
    if (qty > 0) entry.in_total += qty
    else entry.out_total += Math.abs(qty)
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
}
