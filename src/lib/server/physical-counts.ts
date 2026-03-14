/**
 * lib/server/physical-counts.ts
 * Physical count service: create, update items, confirm with reconciliation.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/session'
import { assertLocationAccess } from './location-access'
import type {
  CreatePhysicalCountInput,
  SubmitCountItemsInput,
  ConfirmCountInput,
  CountFilterInput,
} from '@/lib/validations/counts'

export interface PhysicalCountRow {
  id: string
  count_code: string | null
  location_id: string
  location_name: string
  location_color: string | null
  status: string
  count_date: string
  notes: string | null
  created_by: string
  created_by_name: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  item_count: number
  discrepancy_count: number
}

export interface PhysicalCountItemRow {
  id: string
  physical_count_id: string
  product_id: string
  product_name: string
  sku: string
  unit_symbol: string
  system_quantity: number
  counted_quantity: number
  discrepancy: number
  unit_cost: number | null
  notes: string | null
  created_at: string
}

export interface CountListResult {
  counts: PhysicalCountRow[]
  total: number
  hasMore: boolean
}

export async function createPhysicalCount(
  input: CreatePhysicalCountInput
): Promise<{ id: string; count_code: string | null }> {
  const session = await requireSession()
  await assertLocationAccess(input.location_id)

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('physical_counts')
    .insert({
      location_id: input.location_id,
      count_date: input.count_date,
      notes: input.notes ?? null,
      status: 'draft',
      created_by: session.user.id,
    })
    .select('id, count_code')
    .single()

  if (error) throw new Error(error.message)
  return data as { id: string; count_code: string | null }
}

export async function getPhysicalCounts(
  filter: CountFilterInput
): Promise<CountListResult> {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('physical_counts')
    .select(
      `id, count_code, location_id, status, count_date, notes,
       created_by, approved_by, approved_at, created_at, updated_at,
       location:locations(name, color),
       creator:users!physical_counts_created_by_fkey(full_name),
       items:physical_count_items(id)`,
      { count: 'exact' }
    )

  if (filter.location_id) query = query.eq('location_id', filter.location_id)
  if (filter.status) query = query.eq('status', filter.status)
  if (filter.from_date) query = query.gte('count_date', filter.from_date)
  if (filter.to_date) query = query.lte('count_date', filter.to_date)

  const page = filter.page ?? 1
  const pageSize = filter.page_size ?? 20
  const from = (page - 1) * pageSize

  const { data, error, count } = await query
    .order('count_date', { ascending: false })
    .range(from, from + pageSize - 1)

  if (error) throw new Error(error.message)

  const counts = (data ?? []).map((r) => {
    const items = (r.items ?? []) as Array<unknown>
    return {
      id: r.id,
      count_code: r.count_code,
      location_id: r.location_id,
      location_name: (r.location as { name: string } | null)?.name ?? '',
      location_color: (r.location as { color: string | null } | null)?.color ?? null,
      status: r.status,
      count_date: r.count_date,
      notes: r.notes,
      created_by: r.created_by,
      created_by_name: (r.creator as { full_name: string } | null)?.full_name ?? null,
      approved_by: r.approved_by,
      approved_at: r.approved_at,
      created_at: r.created_at,
      updated_at: r.updated_at,
      item_count: items.length,
      discrepancy_count: 0, // computed from items when needed
    } as PhysicalCountRow
  })

  return { counts, total: count ?? 0, hasMore: (count ?? 0) > from + pageSize }
}

export async function getPhysicalCountById(id: string): Promise<PhysicalCountRow | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('physical_counts')
    .select(
      `id, count_code, location_id, status, count_date, notes,
       created_by, approved_by, approved_at, created_at, updated_at,
       location:locations(name, color),
       creator:users!physical_counts_created_by_fkey(full_name)`
    )
    .eq('id', id)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    count_code: data.count_code,
    location_id: data.location_id,
    location_name: (data.location as { name: string } | null)?.name ?? '',
    location_color: (data.location as { color: string | null } | null)?.color ?? null,
    status: data.status,
    count_date: data.count_date,
    notes: data.notes,
    created_by: data.created_by,
    created_by_name: (data.creator as { full_name: string } | null)?.full_name ?? null,
    approved_by: data.approved_by,
    approved_at: data.approved_at,
    created_at: data.created_at,
    updated_at: data.updated_at,
    item_count: 0,
    discrepancy_count: 0,
  } as PhysicalCountRow
}

export async function getCountItems(countId: string): Promise<PhysicalCountItemRow[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('physical_count_items')
    .select(
      `id, physical_count_id, product_id, system_quantity, counted_quantity,
       discrepancy, unit_cost, notes, created_at,
       product:products(name, sku, unit:units(symbol))`
    )
    .eq('physical_count_id', countId)
    .order('created_at')

  if (error) throw new Error(error.message)

  return (data ?? []).map((r) => ({
    id: r.id,
    physical_count_id: r.physical_count_id,
    product_id: r.product_id,
    product_name: (r.product as { name: string } | null)?.name ?? '',
    sku: (r.product as { sku: string } | null)?.sku ?? '',
    unit_symbol: ((r.product as { unit: { symbol: string } | null } | null)?.unit)?.symbol ?? '',
    system_quantity: r.system_quantity,
    counted_quantity: r.counted_quantity,
    discrepancy: r.discrepancy,
    unit_cost: r.unit_cost,
    notes: r.notes,
    created_at: r.created_at,
  })) as PhysicalCountItemRow[]
}

export async function saveCountItems(input: SubmitCountItemsInput): Promise<void> {
  const supabase = await createServerSupabaseClient()

  // Verify count exists and is in a writable state
  const { data: count } = await supabase
    .from('physical_counts')
    .select('id, status, location_id')
    .eq('id', input.physical_count_id)
    .single()

  if (!count) throw new Error('Physical count not found')
  if (!['draft', 'in_progress'].includes(count.status)) {
    throw new Error('Cannot edit a count that is not in draft or in_progress status')
  }

  await assertLocationAccess(count.location_id as string)

  // Upsert all items
  const rows = input.items.map((item) => ({
    physical_count_id: input.physical_count_id,
    product_id: item.product_id,
    system_quantity: item.system_quantity,
    counted_quantity: item.counted_quantity,
    unit_cost: item.unit_cost ?? null,
    notes: item.notes ?? null,
  }))

  const { error: upsertError } = await supabase
    .from('physical_count_items')
    .upsert(rows, { onConflict: 'physical_count_id,product_id' })

  if (upsertError) throw new Error(upsertError.message)

  // Advance status to in_progress
  if (count.status === 'draft') {
    await supabase
      .from('physical_counts')
      .update({ status: 'in_progress' })
      .eq('id', input.physical_count_id)
  }
}

export async function confirmPhysicalCount(input: ConfirmCountInput): Promise<void> {
  const session = await requireSession()
  const supabase = await createServerSupabaseClient()

  const { data: count } = await supabase
    .from('physical_counts')
    .select('id, status, location_id')
    .eq('id', input.physical_count_id)
    .single()

  if (!count) throw new Error('Physical count not found')
  if (count.status !== 'in_progress') {
    throw new Error('Count must be in_progress to confirm')
  }

  await assertLocationAccess(count.location_id as string)

  // Fetch items with discrepancies
  const items = await getCountItems(input.physical_count_id)
  const discrepancies = items.filter((i) => i.discrepancy !== 0)

  // Record a reconciliation_adjustment movement for each discrepancy
  for (const item of discrepancies) {
    await supabase.rpc('record_movement', {
      p_product_id: item.product_id,
      p_location_id: count.location_id,
      p_movement_type: 'reconciliation_adjustment',
      p_quantity: item.discrepancy,
      p_unit_cost: item.unit_cost ?? null,
      p_reference_type: 'physical_count',
      p_reference_id: input.physical_count_id,
      p_notes: `Physical count ${count.location_id} — ${item.discrepancy > 0 ? '+' : ''}${item.discrepancy}`,
      p_performed_by: session.user.id,
      p_idempotency_key: `pc-${input.physical_count_id}-${item.product_id}`,
    })
  }

  // Mark as completed
  await supabase
    .from('physical_counts')
    .update({
      status: 'completed',
      approved_by: session.user.id,
      approved_at: new Date().toISOString(),
      notes: input.notes ?? null,
    })
    .eq('id', input.physical_count_id)
}
