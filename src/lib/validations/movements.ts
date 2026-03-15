import { z } from 'zod'
import type { MovementType } from '@/lib/types'

// =============================================================================
// Movement type classification
// =============================================================================

/** These movement types increase stock — quantity must be stored as positive */
export const INCOMING_MOVEMENT_TYPES: MovementType[] = [
  'opening_stock',
  'purchase_in',
  'production_in',
  'transfer_in',
]

/** These movement types reduce stock — caller enters positive, service negates */
export const OUTGOING_MOVEMENT_TYPES: MovementType[] = [
  'consumption_out',
  'transfer_out',
  'waste_out',
]

/** These movement types carry their own sign (positive or negative allowed) */
export const SIGNED_MOVEMENT_TYPES: MovementType[] = [
  'manual_adjustment',
  'physical_count',
  'reconciliation_adjustment',
]

export function isIncoming(type: MovementType): boolean {
  return INCOMING_MOVEMENT_TYPES.includes(type)
}

export function isOutgoing(type: MovementType): boolean {
  return OUTGOING_MOVEMENT_TYPES.includes(type)
}

export function isSigned(type: MovementType): boolean {
  return SIGNED_MOVEMENT_TYPES.includes(type)
}

/**
 * Converts a user-entered quantity to its signed ledger value.
 * - Outgoing types: always stored as negative (user enters positive)
 * - Incoming types: always stored as positive
 * - Signed types:   stored as-is (user enters ± value)
 */
export function toSignedQuantity(type: MovementType, rawQty: number): number {
  if (isOutgoing(type)) return -Math.abs(rawQty)
  if (isIncoming(type)) return Math.abs(rawQty)
  return rawQty // signed types: trust the caller
}

// =============================================================================
// Zod base primitives
// =============================================================================

const uuid   = z.string().uuid()
const posNum = z.number().positive('Debe ser mayor a 0')

// =============================================================================
// Movement type enum
// =============================================================================

export const movementTypeEnum = z.enum([
  'opening_stock',
  'purchase_in',
  'production_in',
  'consumption_out',
  'transfer_out',
  'transfer_in',
  'waste_out',
  'manual_adjustment',
  'physical_count',
  'reconciliation_adjustment',
])

// =============================================================================
// Single movement schema
// =============================================================================

export const recordMovementSchema = z.object({
  product_id:      uuid,
  location_id:     uuid,
  movement_type:   movementTypeEnum,
  /** Raw user-facing quantity — always positive for outgoing types */
  quantity:        posNum,
  unit_cost:       z.number().min(0).optional().nullable(),
  reference_type:  z.string().max(50).optional().nullable(),
  reference_id:    uuid.optional().nullable(),
  notes:           z.string().max(500).optional().nullable(),
  idempotency_key: z.string().max(200).optional().nullable(),
})

export type RecordMovementInput = z.infer<typeof recordMovementSchema>

// =============================================================================
// Batch output schema (many products, single movement type)
// =============================================================================

export const batchOutputItemSchema = z.object({
  product_id:      uuid,
  quantity:        posNum,
  notes:           z.string().max(300).optional(),
})

export const batchOutputSchema = z.object({
  location_id:    uuid,
  movement_type:  z.enum(['consumption_out', 'waste_out', 'manual_adjustment']),
  global_notes:   z.string().max(500).optional(),
  items:          z.array(batchOutputItemSchema).min(1, 'Agregá al menos un producto'),
})

export type BatchOutputInput = z.infer<typeof batchOutputSchema>

// =============================================================================
// Filter schema for movement queries
// =============================================================================

export const movementFilterSchema = z.object({
  location_id:   uuid.optional(),
  product_id:    uuid.optional(),
  movement_type: movementTypeEnum.optional(),
  date_from:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit:         z.number().int().min(1).max(500).default(50),
  offset:        z.number().int().min(0).default(0),
})

export type MovementFilterInput = z.infer<typeof movementFilterSchema>

// =============================================================================
// Opening stock batch schema (used during initial setup / import)
// =============================================================================

export const openingStockItemSchema = z.object({
  product_id:  uuid,
  location_id: uuid,
  quantity:    z.number().min(0, 'No puede ser negativo'),
  unit_cost:   z.number().min(0).optional().nullable(),
  notes:       z.string().max(500).optional(),
})

export const openingStockBatchSchema = z.object({
  items:           z.array(openingStockItemSchema).min(1),
  reference_notes: z.string().max(500).optional(),
})

export type OpeningStockBatchInput = z.infer<typeof openingStockBatchSchema>
