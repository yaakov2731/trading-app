/**
 * lib/server/transfers.ts
 * Transfer service: create, send, receive inter-location stock transfers.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/session'
import { assertLocationAccess } from './location-access'
import type {
  CreateTransferInput,
  SendTransferInput,
  ReceiveTransferInput,
  TransferFilterInput,
} from '@/lib/validations/transfers'

export interface TransferRow {
  id: string
  transfer_code: string | null
  from_location_id: string
  from_location_name: string
  from_location_color: string | null
  to_location_id: string
  to_location_name: string
  to_location_color: string | null
  status: string
  transfer_date: string
  notes: string | null
  requested_by: string
  requested_by_name: string | null
  approved_by: string | null
  sent_by: string | null
  sent_at: string | null
  received_by: string | null
  received_at: string | null
  created_at: string
  updated_at: string
  item_count: number
}

export interface TransferItemRow {
  id: string
  transfer_id: string
  product_id: string
  product_name: string
  sku: string
  unit_symbol: string
  quantity_requested: number
  quantity_sent: number
  quantity_received: number
  unit_cost: number | null
  notes: string | null
  created_at: string
}

export interface TransferListResult {
  transfers: TransferRow[]
  total: number
  hasMore: boolean
}

export async function createTransfer(
  input: CreateTransferInput
): Promise<{ id: string; transfer_code: string | null }> {
  const session = await requireSession()
  await assertLocationAccess(input.from_location_id)

  const supabase = await createServerSupabaseClient()

  const { data: transfer, error: tError } = await supabase
    .from('transfers')
    .insert({
      from_location_id: input.from_location_id,
      to_location_id: input.to_location_id,
      transfer_date: input.transfer_date,
      notes: input.notes ?? null,
      status: 'pending',
      requested_by: session.user.id,
    })
    .select('id, transfer_code')
    .single()

  if (tError) throw new Error(tError.message)

  const items = input.items.map((item) => ({
    transfer_id: transfer.id,
    product_id: item.product_id,
    quantity_requested: item.quantity_requested,
    unit_cost: item.unit_cost ?? null,
    notes: item.notes ?? null,
  }))

  const { error: iError } = await supabase.from('transfer_items').insert(items)
  if (iError) throw new Error(iError.message)

  return transfer as { id: string; transfer_code: string | null }
}

export async function getTransfers(filter: TransferFilterInput): Promise<TransferListResult> {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('transfers')
    .select(
      `id, transfer_code, from_location_id, to_location_id, status,
       transfer_date, notes, requested_by, approved_by, sent_by, sent_at,
       received_by, received_at, created_at, updated_at,
       from_loc:locations!transfers_from_location_id_fkey(name, color),
       to_loc:locations!transfers_to_location_id_fkey(name, color),
       requester:users!transfers_requested_by_fkey(full_name),
       items:transfer_items(id)`,
      { count: 'exact' }
    )

  if (filter.location_id) {
    query = query.or(
      `from_location_id.eq.${filter.location_id},to_location_id.eq.${filter.location_id}`
    )
  }
  if (filter.status) query = query.eq('status', filter.status)
  if (filter.from_date) query = query.gte('transfer_date', filter.from_date)
  if (filter.to_date) query = query.lte('transfer_date', filter.to_date)

  const page = filter.page ?? 1
  const pageSize = filter.page_size ?? 20
  const from = (page - 1) * pageSize

  const { data, error, count } = await query
    .order('transfer_date', { ascending: false })
    .range(from, from + pageSize - 1)

  if (error) throw new Error(error.message)

  const transfers = (data ?? []).map((r) => ({
    id: r.id,
    transfer_code: r.transfer_code,
    from_location_id: r.from_location_id,
    from_location_name: (r.from_loc as { name: string } | null)?.name ?? '',
    from_location_color: (r.from_loc as { color: string | null } | null)?.color ?? null,
    to_location_id: r.to_location_id,
    to_location_name: (r.to_loc as { name: string } | null)?.name ?? '',
    to_location_color: (r.to_loc as { color: string | null } | null)?.color ?? null,
    status: r.status,
    transfer_date: r.transfer_date,
    notes: r.notes,
    requested_by: r.requested_by,
    requested_by_name: (r.requester as { full_name: string } | null)?.full_name ?? null,
    approved_by: r.approved_by,
    sent_by: r.sent_by,
    sent_at: r.sent_at,
    received_by: r.received_by,
    received_at: r.received_at,
    created_at: r.created_at,
    updated_at: r.updated_at,
    item_count: (r.items ?? []).length,
  })) as TransferRow[]

  return { transfers, total: count ?? 0, hasMore: (count ?? 0) > from + pageSize }
}

export async function getTransferById(id: string): Promise<TransferRow | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('transfers')
    .select(
      `id, transfer_code, from_location_id, to_location_id, status,
       transfer_date, notes, requested_by, approved_by, sent_by, sent_at,
       received_by, received_at, created_at, updated_at,
       from_loc:locations!transfers_from_location_id_fkey(name, color),
       to_loc:locations!transfers_to_location_id_fkey(name, color),
       requester:users!transfers_requested_by_fkey(full_name)`
    )
    .eq('id', id)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    transfer_code: data.transfer_code,
    from_location_id: data.from_location_id,
    from_location_name: (data.from_loc as { name: string } | null)?.name ?? '',
    from_location_color: (data.from_loc as { color: string | null } | null)?.color ?? null,
    to_location_id: data.to_location_id,
    to_location_name: (data.to_loc as { name: string } | null)?.name ?? '',
    to_location_color: (data.to_loc as { color: string | null } | null)?.color ?? null,
    status: data.status,
    transfer_date: data.transfer_date,
    notes: data.notes,
    requested_by: data.requested_by,
    requested_by_name: (data.requester as { full_name: string } | null)?.full_name ?? null,
    approved_by: data.approved_by,
    sent_by: data.sent_by,
    sent_at: data.sent_at,
    received_by: data.received_by,
    received_at: data.received_at,
    created_at: data.created_at,
    updated_at: data.updated_at,
    item_count: 0,
  } as TransferRow
}

export async function getTransferItems(transferId: string): Promise<TransferItemRow[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('transfer_items')
    .select(
      `id, transfer_id, product_id, quantity_requested, quantity_sent,
       quantity_received, unit_cost, notes, created_at,
       product:products(name, sku, unit:units(symbol))`
    )
    .eq('transfer_id', transferId)
    .order('created_at')

  if (error) throw new Error(error.message)

  return (data ?? []).map((r) => ({
    id: r.id,
    transfer_id: r.transfer_id,
    product_id: r.product_id,
    product_name: (r.product as { name: string } | null)?.name ?? '',
    sku: (r.product as { sku: string } | null)?.sku ?? '',
    unit_symbol: ((r.product as { unit: { symbol: string } | null } | null)?.unit)?.symbol ?? '',
    quantity_requested: r.quantity_requested,
    quantity_sent: r.quantity_sent,
    quantity_received: r.quantity_received,
    unit_cost: r.unit_cost,
    notes: r.notes,
    created_at: r.created_at,
  })) as TransferItemRow[]
}

export async function sendTransfer(input: SendTransferInput): Promise<void> {
  const session = await requireSession()
  const supabase = await createServerSupabaseClient()

  const { data: transfer } = await supabase
    .from('transfers')
    .select('id, status, from_location_id')
    .eq('id', input.transfer_id)
    .single()

  if (!transfer) throw new Error('Transfer not found')
  if (transfer.status !== 'pending') throw new Error('Only pending transfers can be sent')

  await assertLocationAccess(transfer.from_location_id as string)

  // Update quantities sent
  for (const item of input.items) {
    await supabase
      .from('transfer_items')
      .update({ quantity_sent: item.quantity_sent })
      .eq('id', item.transfer_item_id)
  }

  // Record transfer_out movements for each item
  const items = await getTransferItems(input.transfer_id)
  for (const item of items) {
    if (item.quantity_sent > 0) {
      await supabase.rpc('record_movement', {
        p_product_id: item.product_id,
        p_location_id: transfer.from_location_id,
        p_movement_type: 'transfer_out',
        p_quantity: -item.quantity_sent,
        p_unit_cost: item.unit_cost ?? null,
        p_reference_type: 'transfer',
        p_reference_id: input.transfer_id,
        p_notes: input.notes ?? null,
        p_performed_by: session.user.id,
        p_idempotency_key: `tr-out-${input.transfer_id}-${item.id}`,
      })
    }
  }

  await supabase
    .from('transfers')
    .update({
      status: 'in_transit',
      sent_by: session.user.id,
      sent_at: new Date().toISOString(),
    })
    .eq('id', input.transfer_id)
}

export async function receiveTransfer(input: ReceiveTransferInput): Promise<void> {
  const session = await requireSession()
  const supabase = await createServerSupabaseClient()

  const { data: transfer } = await supabase
    .from('transfers')
    .select('id, status, to_location_id')
    .eq('id', input.transfer_id)
    .single()

  if (!transfer) throw new Error('Transfer not found')
  if (transfer.status !== 'in_transit') throw new Error('Transfer must be in_transit to receive')

  await assertLocationAccess(transfer.to_location_id as string)

  for (const item of input.items) {
    await supabase
      .from('transfer_items')
      .update({ quantity_received: item.quantity_received })
      .eq('id', item.transfer_item_id)
  }

  const items = await getTransferItems(input.transfer_id)

  let allReceived = true
  for (const item of items) {
    if (item.quantity_received > 0) {
      await supabase.rpc('record_movement', {
        p_product_id: item.product_id,
        p_location_id: transfer.to_location_id,
        p_movement_type: 'transfer_in',
        p_quantity: item.quantity_received,
        p_unit_cost: item.unit_cost ?? null,
        p_reference_type: 'transfer',
        p_reference_id: input.transfer_id,
        p_notes: input.notes ?? null,
        p_performed_by: session.user.id,
        p_idempotency_key: `tr-in-${input.transfer_id}-${item.id}`,
      })
    }
    if (item.quantity_received < item.quantity_sent) allReceived = false
  }

  await supabase
    .from('transfers')
    .update({
      status: allReceived ? 'completed' : 'partial',
      received_by: session.user.id,
      received_at: new Date().toISOString(),
    })
    .eq('id', input.transfer_id)
}
