/**
 * lib/server/alerts.ts
 * Stock alert queries: low stock, zero stock, configurable alert rules.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'

export type StockStatus = 'zero' | 'low' | 'warning' | 'ok'

export interface AlertRow {
  id: string
  product_id: string
  product_name: string
  sku: string
  barcode: string | null
  unit_name: string
  unit_symbol: string
  category_id: string
  category_name: string
  category_color: string | null
  location_id: string
  location_name: string
  location_color: string | null
  current_stock: number
  effective_min_stock: number
  stock_status: StockStatus
  last_movement_at: string | null
}

export interface AlertSummary {
  zero: number
  low: number
  warning: number
  total: number
  criticalLocations: string[]
}

export async function getLowStockAlerts(
  locationIds?: string[]
): Promise<AlertRow[]> {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('v_low_stock_alerts')
    .select('*')

  if (locationIds?.length) {
    query = query.in('location_id', locationIds)
  }

  const { data, error } = await query.order('location_name').order('product_name')

  if (error) throw new Error(error.message)
  return (data ?? []) as AlertRow[]
}

export async function getAlertsByLocation(
  locationId: string
): Promise<AlertRow[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('v_low_stock_alerts')
    .select('*')
    .eq('location_id', locationId)
    .order('stock_status')
    .order('product_name')

  if (error) throw new Error(error.message)
  return (data ?? []) as AlertRow[]
}

export async function getAlertSummary(locationIds?: string[]): Promise<AlertSummary> {
  const alerts = await getLowStockAlerts(locationIds)

  const zero = alerts.filter((a) => a.stock_status === 'zero').length
  const low = alerts.filter((a) => a.stock_status === 'low').length
  const warning = alerts.filter((a) => a.stock_status === 'warning').length

  // Locations with zero stock items
  const criticalSet = new Set<string>()
  for (const a of alerts.filter((a) => a.stock_status === 'zero')) {
    criticalSet.add(a.location_name)
  }

  return {
    zero,
    low,
    warning,
    total: zero + low + warning,
    criticalLocations: Array.from(criticalSet).sort(),
  }
}

export async function getCurrentStockForLocation(
  locationId: string
): Promise<
  Array<{
    product_id: string
    product_name: string
    sku: string
    unit_symbol: string
    current_stock: number
    stock_status: StockStatus
  }>
> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('v_current_stock')
    .select('product_id, product_name, sku, unit_symbol, current_stock, stock_status')
    .eq('location_id', locationId)
    .order('product_name')

  if (error) throw new Error(error.message)

  return (data ?? []).map((r) => ({
    product_id: r.product_id as string,
    product_name: r.product_name as string,
    sku: r.sku as string,
    unit_symbol: r.unit_symbol as string,
    current_stock: r.current_stock as number,
    stock_status: r.stock_status as StockStatus,
  }))
}
