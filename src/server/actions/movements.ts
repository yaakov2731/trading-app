'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { quickMovementSchema, type QuickMovementInput } from '@/lib/schemas'
import type { ApiResponse, StockMovement } from '@/lib/types'

// =============================================================================
// Stock Movement Server Actions
// =============================================================================

export async function recordMovement(
  input: QuickMovementInput
): Promise<ApiResponse<StockMovement>> {
  try {
    const parsed = quickMovementSchema.parse(input)
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'No autorizado', success: false }

    const { data, error } = await supabase.rpc('record_movement', {
      p_product_id:      parsed.product_id,
      p_location_id:     parsed.location_id,
      p_movement_type:   parsed.movement_type,
      p_quantity:        parsed.quantity,
      p_performed_by:    user.id,
      p_unit_cost:       parsed.unit_cost ?? undefined,
      p_notes:           parsed.notes ?? undefined,
      p_idempotency_key: parsed.idempotency_key ?? undefined,
    })

    if (error) {
      console.error('Movement error:', error)
      return { data: null, error: error.message, success: false }
    }

    revalidatePath('/stock')
    revalidatePath('/movements')
    revalidatePath('/dashboard')

    return { data: data as StockMovement, error: null, success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error inesperado'
    return { data: null, error: msg, success: false }
  }
}

export async function getMovementHistory(
  locationId: string,
  filters?: {
    productId?:    string
    movementType?: string
    dateFrom?:     string
    dateTo?:       string
    limit?:        number
    offset?:       number
  }
): Promise<ApiResponse<{ movements: StockMovement[]; total: number }>> {
  try {
    const supabase = await createServerSupabaseClient()

    let query = supabase
      .from('v_movement_history')
      .select('*', { count: 'exact' })
      .eq('location_id', locationId)
      .order('performed_at', { ascending: false })

    if (filters?.productId)    query = query.eq('product_id', filters.productId)
    if (filters?.movementType) query = query.eq('movement_type', filters.movementType)
    if (filters?.dateFrom)     query = query.gte('performed_at', filters.dateFrom)
    if (filters?.dateTo)       query = query.lte('performed_at', filters.dateTo + 'T23:59:59')

    query = query.range(
      filters?.offset ?? 0,
      (filters?.offset ?? 0) + (filters?.limit ?? 50) - 1
    )

    const { data, error, count } = await query

    if (error) return { data: null, error: error.message, success: false }

    return {
      data:    { movements: (data ?? []) as StockMovement[], total: count ?? 0 },
      error:   null,
      success: true,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error inesperado'
    return { data: null, error: msg, success: false }
  }
}

export async function recordBulkConsumption(
  locationId: string,
  items: Array<{ product_id: string; quantity: number; notes?: string }>
): Promise<ApiResponse<{ count: number }>> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'No autorizado', success: false }

    const results = await Promise.allSettled(
      items.map(item =>
        supabase.rpc('record_movement', {
          p_product_id:    item.product_id,
          p_location_id:   locationId,
          p_movement_type: 'consumption_out',
          p_quantity:      -Math.abs(item.quantity),
          p_performed_by:  user.id,
          p_notes:         item.notes ?? undefined,
          p_idempotency_key: `bulk_${Date.now()}_${item.product_id}`,
        })
      )
    )

    const succeeded = results.filter(r => r.status === 'fulfilled').length

    revalidatePath('/stock')
    revalidatePath('/movements')
    revalidatePath('/dashboard')

    return { data: { count: succeeded }, error: null, success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error inesperado'
    return { data: null, error: msg, success: false }
  }
}
