'use server'

import { createServerSupabaseClient } from '@/lib/db/client'
import { createPurchaseEntrySchema } from '@/lib/schemas'
import { revalidatePath } from 'next/cache'
import type { ApiResponse, PurchaseEntry } from '@/lib/types'

// =============================================================================
// Purchase Entry Actions
// =============================================================================

export async function createPurchaseEntry(input: unknown): Promise<ApiResponse<PurchaseEntry>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const parsed = createPurchaseEntrySchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const data = parsed.data

  // ── 1. Create the purchase entry header ────────────────────────────────────
  const totalAmount = data.items.reduce(
    (sum, item) => sum + item.quantity_received * (item.unit_cost ?? 0),
    0
  )

  const { data: entry, error: entryErr } = await supabase
    .from('purchase_entries')
    .insert({
      location_id:            data.location_id,
      supplier_id:            data.supplier_id ?? null,
      entry_date:             data.entry_date,
      expected_delivery_date: data.expected_delivery_date ?? null,
      reference_number:       data.reference_number ?? null,
      notes:                  data.notes ?? null,
      status:                 'draft',
      total_amount:           totalAmount,
      created_by:             user.id,
    })
    .select()
    .single()

  if (entryErr || !entry) return { success: false, error: entryErr?.message ?? 'Error al crear la entrada' }

  // ── 2. Insert line items ────────────────────────────────────────────────────
  const lineItems = data.items.map(item => ({
    purchase_entry_id: entry.id,
    product_id:        item.product_id,
    quantity_expected: item.quantity_expected ?? item.quantity_received,
    quantity_received: item.quantity_received,
    unit_cost:         item.unit_cost ?? null,
    total_cost:        item.quantity_received * (item.unit_cost ?? 0),
    notes:             item.notes ?? null,
  }))

  const { error: itemsErr } = await supabase
    .from('purchase_entry_items')
    .insert(lineItems)

  if (itemsErr) return { success: false, error: itemsErr.message }

  // ── 3. Record purchase_in movement for each item ───────────────────────────
  for (const item of data.items) {
    const { error: mvErr } = await supabase.rpc('record_movement', {
      p_product_id:      item.product_id,
      p_location_id:     data.location_id,
      p_movement_type:   'purchase_in',
      p_quantity:        item.quantity_received,
      p_unit_cost:       item.unit_cost ?? null,
      p_reference_id:    entry.id,
      p_reference_type:  'purchase_entry',
      p_notes:           data.notes ?? null,
      p_performed_by:    user.id,
      p_idempotency_key: `purchase-${entry.id}-${item.product_id}`,
    })
    if (mvErr) {
      // Log but don't abort — movement may already exist (idempotency)
      console.error('Movement record error:', mvErr.message)
    }
  }

  // ── 4. Mark as received ────────────────────────────────────────────────────
  await supabase
    .from('purchase_entries')
    .update({ status: 'received' })
    .eq('id', entry.id)

  revalidatePath('/stock')
  revalidatePath('/dashboard')
  revalidatePath('/history')
  revalidatePath('/purchases')

  return { success: true, data: entry as PurchaseEntry }
}

// ── List purchases ─────────────────────────────────────────────────────────────

export async function getPurchaseEntries(locationId?: string) {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('purchase_entries')
    .select(`
      *,
      location:locations(id, name, color),
      supplier:suppliers(id, name),
      items:purchase_entry_items(
        *,
        product:products(id, name, sku)
      )
    `)
    .order('entry_date', { ascending: false })
    .limit(100)

  if (locationId) query = query.eq('location_id', locationId)

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

// ── Single purchase ────────────────────────────────────────────────────────────

export async function getPurchaseEntry(id: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('purchase_entries')
    .select(`
      *,
      location:locations(*),
      supplier:suppliers(*),
      items:purchase_entry_items(
        *,
        product:products(*, unit:units(*), category:categories(*))
      )
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return data
}
