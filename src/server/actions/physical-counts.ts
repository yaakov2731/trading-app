'use server'

import { createServerSupabaseClient } from '@/lib/db/client'
import { createPhysicalCountSchema } from '@/lib/schemas'
import { revalidatePath } from 'next/cache'
import type { ApiResponse, PhysicalCount } from '@/lib/types'

// =============================================================================
// Physical Count Actions
// =============================================================================

export async function createPhysicalCount(input: unknown): Promise<ApiResponse<PhysicalCount>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const parsed = createPhysicalCountSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const data = parsed.data

  // ── 1. Create count header ─────────────────────────────────────────────────
  const { data: count, error: countErr } = await supabase
    .from('physical_counts')
    .insert({
      location_id: data.location_id,
      count_date:  data.count_date,
      notes:       data.notes ?? null,
      status:      'draft',
      created_by:  user.id,
    })
    .select()
    .single()

  if (countErr || !count) {
    return { success: false, error: countErr?.message ?? 'Error al crear conteo' }
  }

  // ── 2. Insert count items ──────────────────────────────────────────────────
  const items = data.items.map(item => ({
    physical_count_id: count.id,
    product_id:        item.product_id,
    system_quantity:   item.system_quantity,
    counted_quantity:  item.counted_quantity,
    discrepancy:       item.counted_quantity - item.system_quantity,
    unit_cost:         item.unit_cost ?? null,
    notes:             item.notes ?? null,
  }))

  const { error: itemsErr } = await supabase
    .from('physical_count_items')
    .insert(items)

  if (itemsErr) return { success: false, error: itemsErr.message }

  // ── 3. Record reconciliation_adjustment movements for all discrepancies ─────
  const itemsWithDiscrepancy = data.items.filter(
    item => Math.abs(item.counted_quantity - item.system_quantity) > 0.001
  )

  for (const item of itemsWithDiscrepancy) {
    const discrepancy = item.counted_quantity - item.system_quantity
    await supabase.rpc('record_movement', {
      p_product_id:      item.product_id,
      p_location_id:     data.location_id,
      p_movement_type:   'reconciliation_adjustment',
      p_quantity:        discrepancy,               // signed: positive=gained, negative=lost
      p_unit_cost:       item.unit_cost ?? null,
      p_reference_id:    count.id,
      p_reference_type:  'physical_count',
      p_notes:           `Conteo físico ${data.count_date}${data.notes ? ` — ${data.notes}` : ''}`,
      p_performed_by:    user.id,
      p_idempotency_key: `phys-count-${count.id}-${item.product_id}`,
    })
  }

  // ── 4. Mark as completed ────────────────────────────────────────────────────
  await supabase
    .from('physical_counts')
    .update({ status: 'completed', approved_by: user.id })
    .eq('id', count.id)

  revalidatePath('/stock')
  revalidatePath('/dashboard')
  revalidatePath('/history')
  revalidatePath('/physical-count')

  return { success: true, data: count as PhysicalCount }
}

// ── List physical counts ────────────────────────────────────────────────────────

export async function getPhysicalCounts(locationId?: string) {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('physical_counts')
    .select(`
      *,
      location:locations(id, name, color),
      items:physical_count_items(count(*))
    `)
    .order('count_date', { ascending: false })
    .limit(50)

  if (locationId) query = query.eq('location_id', locationId)

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

// ── Get current stock snapshot for a location (pre-fill count sheet) ───────────

export async function getLocationStockSnapshot(locationId: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('v_current_stock')
    .select('*')
    .eq('location_id', locationId)
    .order('category_name')
    .order('product_name')

  if (error) return []
  return data ?? []
}
