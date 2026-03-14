/**
 * lib/server/purchase-receiving.ts
 * Handles the receiving workflow for purchase entries.
 *
 * Design decision: stock movements are created only at receive time, not on
 * draft creation. This matches real gastronomy ops where goods are ordered
 * ahead of delivery. Receiving is idempotent-safe via idempotency keys tied
 * to purchase_entry_id + item_id so duplicate calls are no-ops.
 *
 * Partial receiving is architecturally supported (pass subset of items) but
 * the UI currently does full-receive only. To support partial receiving later:
 * set individual quantity_received on each item and allow multiple receives.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/session'
import { getPurchaseItems } from './purchases'
import type { ReceivePurchaseInput } from '@/lib/validations/purchases'

export interface ReceiveResult {
  movements_created: number
  skipped_duplicates: number
  purchase_entry_id: string
}

export async function receivePurchaseEntry(
  input: ReceivePurchaseInput
): Promise<ReceiveResult> {
  const session = await requireSession()
  const supabase = await createServerSupabaseClient()

  // ── Guard: fetch entry and verify state ────────────────────────────────────
  const { data: entry, error: fetchError } = await supabase
    .from('purchase_entries')
    .select('id, status, location_id, entry_date')
    .eq('id', input.purchase_entry_id)
    .single()

  if (fetchError || !entry) throw new Error('Compra no encontrada')
  if (entry.status === 'received') {
    throw new Error('Esta compra ya fue recibida. No se puede recibir dos veces.')
  }
  if (entry.status === 'cancelled') {
    throw new Error('No se puede recibir una compra cancelada.')
  }

  // ── Build quantity map from input ──────────────────────────────────────────
  const qtyMap = new Map(
    input.received_items.map((i) => [i.purchase_item_id, i.quantity_received])
  )

  // ── Fetch current items ────────────────────────────────────────────────────
  const items = await getPurchaseItems(input.purchase_entry_id)

  let movementsCreated = 0
  let skippedDuplicates = 0

  for (const item of items) {
    const qtyReceived = qtyMap.get(item.id) ?? item.quantity_ordered

    if (qtyReceived <= 0) continue

    const idempotencyKey = `purchase-receive-${input.purchase_entry_id}-${item.id}`

    // Check if already processed (idempotency)
    const { data: existing } = await supabase
      .from('stock_movements')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()

    if (existing) {
      skippedDuplicates++
      continue
    }

    // Create purchase_in movement via RPC
    const { error: rpcError } = await supabase.rpc('record_movement', {
      p_product_id: item.product_id,
      p_location_id: entry.location_id,
      p_movement_type: 'purchase_in',
      p_quantity: qtyReceived,
      p_unit_cost: item.unit_cost ?? null,
      p_reference_type: 'purchase_entry',
      p_reference_id: input.purchase_entry_id,
      p_notes: input.notes ?? `Recepción de compra ${entry.location_id}`,
      p_performed_by: session.user.id,
      p_idempotency_key: idempotencyKey,
    })

    if (rpcError) throw new Error(`Error al registrar movimiento para ${item.product_name}: ${rpcError.message}`)

    movementsCreated++

    // Update quantity_received on the item
    await supabase
      .from('purchase_entry_items')
      .update({
        quantity_received: qtyReceived,
        total_cost: item.unit_cost != null ? qtyReceived * item.unit_cost : item.total_cost,
      })
      .eq('id', item.id)
  }

  // ── Mark purchase as received ──────────────────────────────────────────────
  const { error: updateError } = await supabase
    .from('purchase_entries')
    .update({
      status: 'received',
      received_by: session.user.id,
      received_at: new Date().toISOString(),
      notes: input.notes
        ? [entry.notes, `Recepción: ${input.notes}`].filter(Boolean).join('\n')
        : entry.notes,
    } as Record<string, unknown>)
    .eq('id', input.purchase_entry_id)

  if (updateError) throw new Error(updateError.message)

  return {
    movements_created: movementsCreated,
    skipped_duplicates: skippedDuplicates,
    purchase_entry_id: input.purchase_entry_id,
  }
}
