import type { SupabaseClient } from '@supabase/supabase-js'
import {
  recordMovementSchema,
  batchOutputSchema,
  movementFilterSchema,
  toSignedQuantity,
  type RecordMovementInput,
  type BatchOutputInput,
  type MovementFilterInput,
} from '@/lib/validations/movements'
import { v4 as uuidv4 } from 'uuid'

// =============================================================================
// Stock Movement Service
//
// All writes go through this service to enforce:
//   • Zod validation before hitting the DB
//   • Correct signed quantity logic per movement type
//   • Idempotency key generation when not provided
//   • Negative stock detection (warn, not block — by default)
//   • Single transaction-safe path via the record_movement RPC
//
// TRANSACTION SAFETY NOTE:
//   The record_movement RPC runs inside a Postgres transaction.
//   It inserts the movement row and updates stock_balances atomically.
//   Callers of this service do NOT need to manage transactions themselves.
//
// NEGATIVE STOCK NOTE:
//   The service checks current stock before outgoing movements.
//   If result would be negative, it includes a `negativeStockWarning` in
//   the response but still allows the write. Set `blockNegativeStock: true`
//   in options to convert the warning into a hard error.
// =============================================================================

export interface MovementResult {
  success:              boolean
  data?:                any
  error?:               string
  negativeStockWarning?: string
}

export interface BulkMovementResult {
  success:  boolean
  data?:    any[]
  errors?:  Array<{ index: number; error: string }>
}

// =============================================================================
// Get current stock for a product/location (pre-flight check)
// =============================================================================

async function getCurrentStockLevel(
  supabase: SupabaseClient,
  productId: string,
  locationId: string
): Promise<number> {
  const { data } = await supabase
    .from('stock_balances')
    .select('current_stock')
    .eq('product_id', productId)
    .eq('location_id', locationId)
    .maybeSingle()

  return data?.current_stock ?? 0
}

// =============================================================================
// Record a single movement
// =============================================================================

export async function recordMovement(
  input: unknown,
  userId: string,
  supabase: SupabaseClient,
  options: { blockNegativeStock?: boolean } = {}
): Promise<MovementResult> {
  // ── 1. Validate input ───────────────────────────────────────────────────────
  const parsed = recordMovementSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const data = parsed.data

  // ── 2. Compute signed quantity ──────────────────────────────────────────────
  const signedQty = toSignedQuantity(data.movement_type, data.quantity)

  // ── 3. Negative stock pre-flight check ─────────────────────────────────────
  let negativeStockWarning: string | undefined

  if (signedQty < 0) {
    const currentStock = await getCurrentStockLevel(supabase, data.product_id, data.location_id)
    const projectedStock = currentStock + signedQty

    if (projectedStock < 0) {
      const message =
        `Atención: el stock quedaría en ${projectedStock.toFixed(3)} ` +
        `(actual: ${currentStock.toFixed(3)}). Se permite stock negativo.`

      if (options.blockNegativeStock) {
        return { success: false, error: message }
      }

      negativeStockWarning = message
    }
  }

  // ── 4. Ensure idempotency key ───────────────────────────────────────────────
  const idempotencyKey = data.idempotency_key ?? `mv-${uuidv4()}`

  // ── 5. Call record_movement RPC ─────────────────────────────────────────────
  // The RPC handles:
  //   • INSERT into stock_movements
  //   • UPSERT into stock_balances (trigger)
  //   • Idempotency: if idempotency_key already exists, returns existing row
  const { data: result, error } = await supabase.rpc('record_movement', {
    p_product_id:      data.product_id,
    p_location_id:     data.location_id,
    p_movement_type:   data.movement_type,
    p_quantity:        signedQty,
    p_unit_cost:       data.unit_cost ?? null,
    p_reference_type:  data.reference_type ?? null,
    p_reference_id:    data.reference_id ?? null,
    p_notes:           data.notes ?? null,
    p_performed_by:    userId,
    p_idempotency_key: idempotencyKey,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return {
    success: true,
    data:    result,
    ...(negativeStockWarning ? { negativeStockWarning } : {}),
  }
}

// =============================================================================
// Record a batch output (many products, one movement type)
// =============================================================================

export async function recordBatchOutput(
  input: unknown,
  userId: string,
  supabase: SupabaseClient,
  options: { blockNegativeStock?: boolean } = {}
): Promise<BulkMovementResult> {
  // ── 1. Validate ─────────────────────────────────────────────────────────────
  const parsed = batchOutputSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, errors: [{ index: -1, error: parsed.error.errors[0].message }] }
  }

  const { location_id, movement_type, global_notes, items } = parsed.data

  const results: any[]              = []
  const errors: BulkMovementResult['errors'] = []

  // ── 2. Process each item ────────────────────────────────────────────────────
  for (let i = 0; i < items.length; i++) {
    const item = items[i]

    const result = await recordMovement(
      {
        product_id:      item.product_id,
        location_id,
        movement_type,
        quantity:        item.quantity,
        notes:           item.notes ?? global_notes,
        idempotency_key: `batch-output-${userId}-${item.product_id}-${Date.now()}-${i}`,
      },
      userId,
      supabase,
      options
    )

    if (result.success) {
      results.push(result.data)
    } else {
      errors.push({ index: i, error: result.error ?? 'Error desconocido' })
    }
  }

  // ── 3. Return summary ────────────────────────────────────────────────────────
  const allSucceeded = errors.length === 0
  return {
    success: allSucceeded,
    data:    results,
    ...(errors.length ? { errors } : {}),
  }
}

// =============================================================================
// Query movement history
// =============================================================================

export interface MovementPage {
  movements: any[]
  total:     number
}

export async function getMovements(
  input: Partial<MovementFilterInput>,
  supabase: SupabaseClient
): Promise<MovementPage> {
  const parsed = movementFilterSchema.safeParse(input)
  const filter = parsed.success ? parsed.data : { limit: 50, offset: 0 }

  let query = supabase
    .from('v_movement_history')
    .select('*', { count: 'exact' })
    .order('performed_at', { ascending: false })
    .limit(filter.limit)
    .range(filter.offset, filter.offset + filter.limit - 1)

  if (filter.location_id)   query = query.eq('location_id',   filter.location_id)
  if (filter.product_id)    query = query.eq('product_id',    filter.product_id)
  if (filter.movement_type) query = query.eq('movement_type', filter.movement_type)
  if (filter.date_from)     query = query.gte('performed_at', `${filter.date_from}T00:00:00`)
  if (filter.date_to)       query = query.lte('performed_at', `${filter.date_to}T23:59:59`)

  const { data, count, error } = await query

  if (error) return { movements: [], total: 0 }
  return { movements: data ?? [], total: count ?? 0 }
}

// =============================================================================
// Get single movement by ID
// =============================================================================

export async function getMovementById(
  id: string,
  supabase: SupabaseClient
): Promise<any | null> {
  const { data } = await supabase
    .from('v_movement_history')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  return data
}
