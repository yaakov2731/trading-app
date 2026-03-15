/**
 * lib/server/purchases.ts
 * Purchase entry service — create, list, fetch.
 * Stock impact happens in purchase-receiving.ts, not here.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/session'
import { assertLocationAccess } from './location-access'
import type { CreatePurchaseInput, PurchaseFilterInput } from '@/lib/validations/purchases'

export interface PurchaseEntryRow {
  id: string
  entry_code: string | null
  location_id: string
  location_name: string
  location_color: string | null
  supplier_id: string | null
  supplier_name: string | null
  status: string
  entry_date: string
  invoice_number: string | null
  notes: string | null
  total_amount: number | null
  created_by: string
  created_by_name: string | null
  received_by: string | null
  received_by_name: string | null
  received_at: string | null
  created_at: string
  updated_at: string
  item_count: number
}

export interface PurchaseItemRow {
  id: string
  purchase_entry_id: string
  product_id: string
  product_name: string
  sku: string
  unit_symbol: string
  quantity_ordered: number
  quantity_received: number
  unit_cost: number | null
  total_cost: number | null
  notes: string | null
  created_at: string
}

export interface PurchaseListResult {
  entries: PurchaseEntryRow[]
  total: number
  hasMore: boolean
}

export async function createPurchaseEntry(
  input: CreatePurchaseInput
): Promise<{ id: string; entry_code: string | null }> {
  const session = await requireSession()
  await assertLocationAccess(input.location_id)

  const supabase = await createServerSupabaseClient()

  // Insert header
  const { data: entry, error: entryError } = await supabase
    .from('purchase_entries')
    .insert({
      location_id: input.location_id,
      supplier_id: input.supplier_id ?? null,
      entry_date: input.entry_date,
      invoice_number: input.invoice_number ?? null,
      notes: input.notes ?? null,
      status: 'draft',
      created_by: session.user.id,
      total_amount: 0,
    })
    .select('id, entry_code')
    .single()

  if (entryError) throw new Error(entryError.message)

  // Insert items
  const items = input.items.map((item) => ({
    purchase_entry_id: entry.id,
    product_id: item.product_id,
    quantity_ordered: item.quantity_ordered,
    quantity_received: 0,
    unit_cost: item.unit_cost ?? null,
    total_cost:
      item.unit_cost != null ? item.quantity_ordered * item.unit_cost : null,
    notes: item.notes ?? null,
  }))

  const { error: itemsError } = await supabase
    .from('purchase_entry_items')
    .insert(items)

  if (itemsError) throw new Error(itemsError.message)

  return { id: entry.id, entry_code: entry.entry_code }
}

export async function getPurchaseEntries(
  filter: Partial<PurchaseFilterInput> = {}
): Promise<PurchaseListResult> {
  const {
    location_id,
    supplier_id,
    status,
    from_date,
    to_date,
    search,
    page = 1,
    page_size = 20,
  } = filter

  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('purchase_entries')
    .select(
      `id, entry_code, location_id, supplier_id, status, entry_date,
       invoice_number, notes, total_amount, created_by, received_by,
       received_at, created_at, updated_at,
       location:locations(name, color),
       supplier:suppliers(name),
       creator:users!purchase_entries_created_by_fkey(full_name),
       receiver:users!purchase_entries_received_by_fkey(full_name),
       items:purchase_entry_items(id)`,
      { count: 'exact' }
    )

  if (location_id) query = query.eq('location_id', location_id)
  if (supplier_id) query = query.eq('supplier_id', supplier_id)
  if (status) query = query.eq('status', status)
  if (from_date) query = query.gte('entry_date', from_date)
  if (to_date) query = query.lte('entry_date', to_date)
  if (search?.trim()) {
    const t = search.trim()
    query = query.or(`invoice_number.ilike.%${t}%,notes.ilike.%${t}%`)
  }

  const from = (page - 1) * page_size
  const { data, error, count } = await query
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, from + page_size - 1)

  if (error) throw new Error(error.message)

  const entries = (data ?? []).map((r) => ({
    id: r.id,
    entry_code: r.entry_code,
    location_id: r.location_id,
    location_name: (r.location as { name: string } | null)?.name ?? '',
    location_color: (r.location as { color: string | null } | null)?.color ?? null,
    supplier_id: r.supplier_id,
    supplier_name: (r.supplier as { name: string } | null)?.name ?? null,
    status: r.status,
    entry_date: r.entry_date,
    invoice_number: r.invoice_number,
    notes: r.notes,
    total_amount: r.total_amount,
    created_by: r.created_by,
    created_by_name: (r.creator as { full_name: string } | null)?.full_name ?? null,
    received_by: r.received_by,
    received_by_name: (r.receiver as { full_name: string } | null)?.full_name ?? null,
    received_at: r.received_at,
    created_at: r.created_at,
    updated_at: r.updated_at,
    item_count: (r.items ?? []).length,
  })) as PurchaseEntryRow[]

  return { entries, total: count ?? 0, hasMore: (count ?? 0) > from + page_size }
}

export async function getPurchaseEntryById(id: string): Promise<PurchaseEntryRow | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('purchase_entries')
    .select(
      `id, entry_code, location_id, supplier_id, status, entry_date,
       invoice_number, notes, total_amount, created_by, received_by,
       received_at, created_at, updated_at,
       location:locations(name, color),
       supplier:suppliers(name),
       creator:users!purchase_entries_created_by_fkey(full_name),
       receiver:users!purchase_entries_received_by_fkey(full_name)`
    )
    .eq('id', id)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    entry_code: data.entry_code,
    location_id: data.location_id,
    location_name: (data.location as { name: string } | null)?.name ?? '',
    location_color: (data.location as { color: string | null } | null)?.color ?? null,
    supplier_id: data.supplier_id,
    supplier_name: (data.supplier as { name: string } | null)?.name ?? null,
    status: data.status,
    entry_date: data.entry_date,
    invoice_number: data.invoice_number,
    notes: data.notes,
    total_amount: data.total_amount,
    created_by: data.created_by,
    created_by_name: (data.creator as { full_name: string } | null)?.full_name ?? null,
    received_by: data.received_by,
    received_by_name: (data.receiver as { full_name: string } | null)?.full_name ?? null,
    received_at: data.received_at,
    created_at: data.created_at,
    updated_at: data.updated_at,
    item_count: 0,
  } as PurchaseEntryRow
}

export async function getPurchaseItems(purchaseEntryId: string): Promise<PurchaseItemRow[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('purchase_entry_items')
    .select(
      `id, purchase_entry_id, product_id, quantity_ordered, quantity_received,
       unit_cost, total_cost, notes, created_at,
       product:products(name, sku, unit:units(symbol))`
    )
    .eq('purchase_entry_id', purchaseEntryId)
    .order('created_at')

  if (error) throw new Error(error.message)

  return (data ?? []).map((r) => ({
    id: r.id,
    purchase_entry_id: r.purchase_entry_id,
    product_id: r.product_id,
    product_name: (r.product as { name: string } | null)?.name ?? '',
    sku: (r.product as { sku: string } | null)?.sku ?? '',
    unit_symbol:
      ((r.product as { unit: { symbol: string } | null } | null)?.unit)?.symbol ?? '',
    quantity_ordered: r.quantity_ordered,
    quantity_received: r.quantity_received,
    unit_cost: r.unit_cost,
    total_cost: r.total_cost,
    notes: r.notes,
    created_at: r.created_at,
  })) as PurchaseItemRow[]
}

export async function cancelPurchaseEntry(id: string): Promise<void> {
  const supabase = await createServerSupabaseClient()

  const { data: entry } = await supabase
    .from('purchase_entries')
    .select('status')
    .eq('id', id)
    .single()

  if (!entry) throw new Error('Compra no encontrada')
  if (entry.status === 'received') throw new Error('No se puede cancelar una compra ya recibida')

  const { error } = await supabase
    .from('purchase_entries')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
