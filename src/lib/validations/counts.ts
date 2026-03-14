/**
 * lib/validations/counts.ts
 * Zod schemas and validation helpers for physical inventory counts.
 */

import { z } from 'zod'

// ── Physical count creation ───────────────────────────────────────────────────

export const createPhysicalCountSchema = z.object({
  location_id: z.string().uuid('Location is required'),
  count_date: z.string().min(1, 'Count date is required'),
  notes: z.string().max(500).optional(),
})

export type CreatePhysicalCountInput = z.infer<typeof createPhysicalCountSchema>

// ── Count item (individual product count) ────────────────────────────────────

export const countItemSchema = z.object({
  product_id: z.string().uuid(),
  system_quantity: z.number().min(0),
  counted_quantity: z
    .number({ invalid_type_error: 'Enter a valid number' })
    .min(0, 'Cannot be negative'),
  unit_cost: z.number().min(0).optional().nullable(),
  notes: z.string().max(200).optional(),
})

export type CountItemInput = z.infer<typeof countItemSchema>

// ── Submit count (wizard step 2: save counted quantities) ─────────────────────

export const submitCountItemsSchema = z.object({
  physical_count_id: z.string().uuid(),
  items: z
    .array(countItemSchema)
    .min(1, 'At least one product must be counted'),
})

export type SubmitCountItemsInput = z.infer<typeof submitCountItemsSchema>

// ── Confirm count (wizard step 3: apply reconciliation movements) ─────────────

export const confirmCountSchema = z.object({
  physical_count_id: z.string().uuid(),
  notes: z.string().max(500).optional(),
})

export type ConfirmCountInput = z.infer<typeof confirmCountSchema>

// ── Status transitions ────────────────────────────────────────────────────────

export const COUNT_STATUSES = ['draft', 'in_progress', 'completed', 'cancelled'] as const
export type CountStatus = (typeof COUNT_STATUSES)[number]

export const updateCountStatusSchema = z.object({
  physical_count_id: z.string().uuid(),
  status: z.enum(COUNT_STATUSES),
})

export type UpdateCountStatusInput = z.infer<typeof updateCountStatusSchema>

// ── Filter / list ─────────────────────────────────────────────────────────────

export const countFilterSchema = z.object({
  location_id: z.string().uuid().optional(),
  status: z.enum(COUNT_STATUSES).optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20),
})

export type CountFilterInput = z.infer<typeof countFilterSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

export function calculateDiscrepancy(
  systemQty: number,
  countedQty: number
): { discrepancy: number; percentageOff: number; hasDiscrepancy: boolean } {
  const discrepancy = countedQty - systemQty
  const percentageOff = systemQty !== 0 ? Math.abs(discrepancy / systemQty) * 100 : 0
  return { discrepancy, percentageOff, hasDiscrepancy: discrepancy !== 0 }
}

export function discrepancySeverity(
  discrepancy: number,
  systemQty: number
): 'none' | 'minor' | 'moderate' | 'critical' {
  if (discrepancy === 0) return 'none'
  const pct = systemQty !== 0 ? Math.abs(discrepancy / systemQty) * 100 : 100
  if (pct <= 5) return 'minor'
  if (pct <= 20) return 'moderate'
  return 'critical'
}
