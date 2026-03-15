/**
 * lib/validations/transfers.ts
 * Zod schemas for inter-location stock transfers.
 */

import { z } from 'zod'

// ── Transfer item line ────────────────────────────────────────────────────────

export const transferItemSchema = z.object({
  product_id: z.string().uuid('Select a product'),
  quantity_requested: z
    .number({ invalid_type_error: 'Enter a valid quantity' })
    .positive('Quantity must be greater than 0'),
  unit_cost: z.number().min(0).optional().nullable(),
  notes: z.string().max(200).optional(),
})

export type TransferItemInput = z.infer<typeof transferItemSchema>

// ── Create transfer ───────────────────────────────────────────────────────────

export const createTransferSchema = z
  .object({
    from_location_id: z.string().uuid('Origin location is required'),
    to_location_id: z.string().uuid('Destination location is required'),
    transfer_date: z.string().min(1, 'Transfer date is required'),
    notes: z.string().max(500).optional(),
    items: z
      .array(transferItemSchema)
      .min(1, 'At least one item is required'),
  })
  .refine((d) => d.from_location_id !== d.to_location_id, {
    message: 'Origin and destination must be different',
    path: ['to_location_id'],
  })

export type CreateTransferInput = z.infer<typeof createTransferSchema>

// ── Send transfer (mark as in_transit) ───────────────────────────────────────

export const sendTransferSchema = z.object({
  transfer_id: z.string().uuid(),
  items: z
    .array(
      z.object({
        transfer_item_id: z.string().uuid(),
        quantity_sent: z.number().min(0),
      })
    )
    .min(1),
  notes: z.string().max(500).optional(),
})

export type SendTransferInput = z.infer<typeof sendTransferSchema>

// ── Receive transfer (mark as completed) ─────────────────────────────────────

export const receiveTransferSchema = z.object({
  transfer_id: z.string().uuid(),
  items: z
    .array(
      z.object({
        transfer_item_id: z.string().uuid(),
        quantity_received: z.number().min(0),
      })
    )
    .min(1),
  notes: z.string().max(500).optional(),
})

export type ReceiveTransferInput = z.infer<typeof receiveTransferSchema>

// ── Status ────────────────────────────────────────────────────────────────────

export const TRANSFER_STATUSES = [
  'pending',
  'in_transit',
  'completed',
  'partial',
  'cancelled',
] as const
export type TransferStatus = (typeof TRANSFER_STATUSES)[number]

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  pending: 'Pendiente',
  in_transit: 'En tránsito',
  completed: 'Completado',
  partial: 'Parcial',
  cancelled: 'Cancelado',
}

// ── Filter ────────────────────────────────────────────────────────────────────

export const transferFilterSchema = z.object({
  location_id: z.string().uuid().optional(),
  status: z.enum(TRANSFER_STATUSES).optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20),
})

export type TransferFilterInput = z.infer<typeof transferFilterSchema>
