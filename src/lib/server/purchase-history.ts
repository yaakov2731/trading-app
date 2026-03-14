/**
 * lib/server/purchase-history.ts
 * Purchase history queries with supplier-aware aggregations.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { PurchaseFilterInput } from '@/lib/validations/purchases'
import { getPurchaseEntries } from './purchases'

export interface PurchaseSummary {
  total_entries: number
  total_received: number
  total_draft: number
  total_cancelled: number
  total_spend: number
  avg_order_value: number
  top_supplier: string | null
  top_location: string | null
}

export interface SupplierSpend {
  supplier_id: string | null
  supplier_name: string
  entry_count: number
  total_spend: number
}

export async function getPurchaseSummary(
  filter: Partial<PurchaseFilterInput> = {}
): Promise<PurchaseSummary> {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('purchase_entries')
    .select(
      `status, total_amount, supplier_id,
       supplier:suppliers(name),
       location:locations(name)`,
    )

  if (filter.location_id) query = query.eq('location_id', filter.location_id)
  if (filter.from_date) query = query.gte('entry_date', filter.from_date)
  if (filter.to_date) query = query.lte('entry_date', filter.to_date)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const rows = data ?? []
  const received = rows.filter((r) => r.status === 'received')
  const totalSpend = received.reduce((s, r) => s + ((r.total_amount as number) ?? 0), 0)

  // Top supplier by spend
  const supplierMap = new Map<string, number>()
  for (const r of received) {
    const name = (r.supplier as { name: string } | null)?.name ?? 'Sin proveedor'
    supplierMap.set(name, (supplierMap.get(name) ?? 0) + ((r.total_amount as number) ?? 0))
  }
  const topSupplier =
    supplierMap.size > 0
      ? [...supplierMap.entries()].sort((a, b) => b[1] - a[1])[0][0]
      : null

  return {
    total_entries: rows.length,
    total_received: received.length,
    total_draft: rows.filter((r) => r.status === 'draft').length,
    total_cancelled: rows.filter((r) => r.status === 'cancelled').length,
    total_spend: totalSpend,
    avg_order_value: received.length > 0 ? totalSpend / received.length : 0,
    top_supplier: topSupplier,
    top_location: null,
  }
}

export async function getSpendBySupplier(
  filter: Partial<PurchaseFilterInput> = {}
): Promise<SupplierSpend[]> {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('purchase_entries')
    .select('supplier_id, total_amount, supplier:suppliers(name)')
    .eq('status', 'received')

  if (filter.location_id) query = query.eq('location_id', filter.location_id)
  if (filter.from_date) query = query.gte('entry_date', filter.from_date)
  if (filter.to_date) query = query.lte('entry_date', filter.to_date)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const map = new Map<string | null, SupplierSpend>()
  for (const r of data ?? []) {
    const key = (r.supplier_id as string | null) ?? '__none__'
    const name = (r.supplier as { name: string } | null)?.name ?? 'Sin proveedor'
    if (!map.has(key)) {
      map.set(key, {
        supplier_id: r.supplier_id as string | null,
        supplier_name: name,
        entry_count: 0,
        total_spend: 0,
      })
    }
    const entry = map.get(key)!
    entry.entry_count++
    entry.total_spend += (r.total_amount as number) ?? 0
  }

  return Array.from(map.values()).sort((a, b) => b.total_spend - a.total_spend)
}

/**
 * Re-exports paginated entry list for the history page — thin wrapper.
 */
export { getPurchaseEntries } from './purchases'
