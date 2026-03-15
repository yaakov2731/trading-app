import type { SupabaseClient } from '@supabase/supabase-js'

// =============================================================================
// Dashboard query functions — called from server components / API routes
// =============================================================================

export interface DashboardStats {
  totalProducts:    number
  activeLocations:  number
  lowStockCount:    number
  zeroStockCount:   number
  todayMovements:   number
  weekMovements:    number
  totalStockValue:  number | null
}

export interface CategoryStockSummary {
  category_id:    string
  category_name:  string
  category_color: string
  product_count:  number
  total_stock:    number
  low_count:      number
}

export interface RecentMovementRow {
  id:              string
  product_id:      string
  product_name:    string
  sku:             string
  location_name:   string
  location_color:  string
  movement_type:   string
  quantity:        number
  unit_symbol:     string
  performed_at:    string
  performed_by_name: string | null
}

export interface StockAlertSummary {
  zero:    number
  low:     number
  warning: number
  total:   number
}

// =============================================================================
// Main stats
// =============================================================================

export async function getDashboardStats(
  supabase: SupabaseClient,
  locationId?: string
): Promise<DashboardStats> {
  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString()

  const [
    productsRes,
    locationsRes,
    lowStockRes,
    todayMvRes,
    weekMvRes,
    stockValueRes,
  ] = await Promise.all([
    // Active products
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),

    // Active locations
    supabase
      .from('locations')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),

    // Low + zero stock
    supabase
      .from('v_low_stock_alerts')
      .select('stock_status', { count: 'exact' })
      .in('stock_status', ['low', 'zero'])
      .then(r => ({
        zero: r.data?.filter((a: any) => a.stock_status === 'zero').length ?? 0,
        low:  r.data?.filter((a: any) => a.stock_status === 'low').length ?? 0,
      })),

    // Today's movements
    supabase
      .from('stock_movements')
      .select('id', { count: 'exact', head: true })
      .gte('performed_at', `${today}T00:00:00`)
      .then(r => r),

    // Last 7 days
    supabase
      .from('stock_movements')
      .select('id', { count: 'exact', head: true })
      .gte('performed_at', weekAgo)
      .then(r => r),

    // Total stock value
    locationId
      ? supabase.rpc('get_stock_value', { p_location_id: locationId })
      : Promise.resolve({ data: null }),
  ])

  return {
    totalProducts:   productsRes.count  ?? 0,
    activeLocations: locationsRes.count ?? 0,
    lowStockCount:   (await lowStockRes).low,
    zeroStockCount:  (await lowStockRes).zero,
    todayMovements:  (await todayMvRes).count ?? 0,
    weekMovements:   (await weekMvRes).count  ?? 0,
    totalStockValue: (await stockValueRes).data ?? null,
  }
}

// =============================================================================
// Recent movements
// =============================================================================

export async function getRecentMovements(
  supabase: SupabaseClient,
  locationId?: string,
  limit = 10
): Promise<RecentMovementRow[]> {
  let query = supabase
    .from('v_movement_history')
    .select('*')
    .order('performed_at', { ascending: false })
    .limit(limit)

  if (locationId) query = query.eq('location_id', locationId)

  const { data } = await query
  return (data ?? []) as RecentMovementRow[]
}

// =============================================================================
// Low stock summary (counts only)
// =============================================================================

export async function getLowStockSummary(
  supabase: SupabaseClient,
  locationId?: string
): Promise<StockAlertSummary> {
  let query = supabase
    .from('v_low_stock_alerts')
    .select('stock_status', { count: 'exact' })

  if (locationId) query = query.eq('location_id', locationId)

  const { data } = await query

  const zero    = data?.filter((a: any) => a.stock_status === 'zero').length    ?? 0
  const low     = data?.filter((a: any) => a.stock_status === 'low').length     ?? 0
  const warning = data?.filter((a: any) => a.stock_status === 'warning').length ?? 0

  return { zero, low, warning, total: zero + low + warning }
}

// =============================================================================
// Category stock distribution
// =============================================================================

export async function getCategoryStockSummary(
  supabase: SupabaseClient,
  locationId?: string
): Promise<CategoryStockSummary[]> {
  let query = supabase
    .from('v_current_stock')
    .select('category_id, category_name, category_color, product_id, current_stock, stock_status')

  if (locationId) query = query.eq('location_id', locationId)

  const { data } = await query
  if (!data) return []

  // Group by category
  const grouped = new Map<string, CategoryStockSummary>()

  for (const row of data as any[]) {
    const key = row.category_id
    if (!grouped.has(key)) {
      grouped.set(key, {
        category_id:    key,
        category_name:  row.category_name ?? 'Sin categoría',
        category_color: row.category_color ?? '#94a3b8',
        product_count:  0,
        total_stock:    0,
        low_count:      0,
      })
    }
    const entry = grouped.get(key)!
    entry.product_count++
    entry.total_stock += row.current_stock ?? 0
    if (row.stock_status === 'low' || row.stock_status === 'zero') entry.low_count++
  }

  return Array.from(grouped.values()).sort((a, b) => b.product_count - a.product_count)
}

// =============================================================================
// Stock movements aggregated by day (last N days) — for sparklines / charts
// =============================================================================

export interface DailyMovementSummary {
  date:      string
  purchases: number
  outputs:   number
  transfers: number
  net:       number
}

export async function getDailyMovementSummary(
  supabase: SupabaseClient,
  locationId: string,
  days = 14
): Promise<DailyMovementSummary[]> {
  const since = new Date(Date.now() - days * 86400_000).toISOString()

  const { data } = await supabase
    .from('stock_movements')
    .select('movement_type, quantity, performed_at')
    .eq('location_id', locationId)
    .gte('performed_at', since)
    .order('performed_at')

  if (!data) return []

  const byDay = new Map<string, DailyMovementSummary>()

  for (const mv of data as any[]) {
    const date = mv.performed_at.slice(0, 10)
    if (!byDay.has(date)) {
      byDay.set(date, { date, purchases: 0, outputs: 0, transfers: 0, net: 0 })
    }
    const entry = byDay.get(date)!
    const qty   = Math.abs(mv.quantity)

    if (mv.movement_type === 'purchase_in' || mv.movement_type === 'production_in') {
      entry.purchases += qty
    } else if (['consumption_out', 'waste_out'].includes(mv.movement_type)) {
      entry.outputs += qty
    } else if (mv.movement_type.startsWith('transfer')) {
      entry.transfers += qty
    }
    entry.net += mv.quantity
  }

  return Array.from(byDay.values())
}
