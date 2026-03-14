'use server'

import { createServerSupabaseClient } from '@/lib/db/client'
import { createTransferSchema } from '@/lib/schemas'
import { revalidatePath } from 'next/cache'
import type { ApiResponse, Transfer } from '@/lib/types'

// =============================================================================
// Transfer Actions
// =============================================================================

export async function createTransfer(input: unknown): Promise<ApiResponse<Transfer>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const parsed = createTransferSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const data = parsed.data

  if (data.from_location_id === data.to_location_id) {
    return { success: false, error: 'El local de origen y destino no pueden ser el mismo' }
  }

  // ── 1. Create transfer header ───────────────────────────────────────────────
  const { data: transfer, error: transferErr } = await supabase
    .from('transfers')
    .insert({
      from_location_id: data.from_location_id,
      to_location_id:   data.to_location_id,
      transfer_date:    data.transfer_date,
      notes:            data.notes ?? null,
      status:           'pending',
      requested_by:     user.id,
    })
    .select()
    .single()

  if (transferErr || !transfer) {
    return { success: false, error: transferErr?.message ?? 'Error al crear transferencia' }
  }

  // ── 2. Insert transfer items ────────────────────────────────────────────────
  const items = data.items.map(item => ({
    transfer_id: transfer.id,
    product_id:  item.product_id,
    quantity:    item.quantity,
    unit_cost:   item.unit_cost ?? null,
    notes:       item.notes ?? null,
  }))

  const { error: itemsErr } = await supabase
    .from('transfer_items')
    .insert(items)

  if (itemsErr) return { success: false, error: itemsErr.message }

  // ── 3. Record transfer_out from source + transfer_in to destination ─────────
  for (const item of data.items) {
    // Outgoing from source
    await supabase.rpc('record_movement', {
      p_product_id:      item.product_id,
      p_location_id:     data.from_location_id,
      p_movement_type:   'transfer_out',
      p_quantity:        -Math.abs(item.quantity),          // negative = out
      p_unit_cost:       item.unit_cost ?? null,
      p_reference_id:    transfer.id,
      p_reference_type:  'transfer',
      p_notes:           data.notes ?? null,
      p_performed_by:    user.id,
      p_idempotency_key: `transfer-out-${transfer.id}-${item.product_id}`,
    })

    // Incoming to destination
    await supabase.rpc('record_movement', {
      p_product_id:      item.product_id,
      p_location_id:     data.to_location_id,
      p_movement_type:   'transfer_in',
      p_quantity:        Math.abs(item.quantity),           // positive = in
      p_unit_cost:       item.unit_cost ?? null,
      p_reference_id:    transfer.id,
      p_reference_type:  'transfer',
      p_notes:           data.notes ?? null,
      p_performed_by:    user.id,
      p_idempotency_key: `transfer-in-${transfer.id}-${item.product_id}`,
    })
  }

  // ── 4. Mark as completed (immediate transfer) ───────────────────────────────
  await supabase
    .from('transfers')
    .update({ status: 'completed', approved_by: user.id })
    .eq('id', transfer.id)

  revalidatePath('/stock')
  revalidatePath('/dashboard')
  revalidatePath('/history')
  revalidatePath('/transfers')

  return { success: true, data: transfer as Transfer }
}

// ── List transfers ─────────────────────────────────────────────────────────────

export async function getTransfers(locationId?: string) {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('transfers')
    .select(`
      *,
      from_location:locations!transfers_from_location_id_fkey(id, name, color),
      to_location:locations!transfers_to_location_id_fkey(id, name, color),
      items:transfer_items(
        *,
        product:products(id, name, sku)
      )
    `)
    .order('transfer_date', { ascending: false })
    .limit(100)

  if (locationId) {
    query = query.or(`from_location_id.eq.${locationId},to_location_id.eq.${locationId}`)
  }

  const { data, error } = await query
  if (error) return []
  return data ?? []
}
