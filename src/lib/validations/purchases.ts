/**
 * lib/validations/purchases.ts
 * Zod schemas for purchase entries and items.
 */

import { z } from 'zod'

// ── Item line ──────────────────────────────────────────────────────────────────

export const purchaseItemSchema = z.object({
  product_id: z.string().uuid('Selecciona un producto'),
  quantity_ordered: z
    .number({ invalid_type_error: 'Ingresa una cantidad válida' })
    .positive('La cantidad debe ser mayor a 0'),
  quantity_received: z
    .number({ invalid_type_error: 'Ingresa una cantidad válida' })
    .min(0, 'No puede ser negativo')
    .optional()
    .nullable(),
  unit_cost: z
    .number({ invalid_type_error: 'Ingresa un costo válido' })
    .min(0, 'No puede ser negativo')
    .optional()
    .nullable(),
  notes: z.string().max(200).optional(),
})

export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>

// ── Create purchase entry ──────────────────────────────────────────────────────

export const createPurchaseSchema = z.object({
  location_id: z.string().uuid('Selecciona una ubicación'),
  supplier_id: z.string().uuid('Selecciona un proveedor').optional().nullable(),
  entry_date: z.string().min(1, 'La fecha es requerida'),
  invoice_number: z.string().max(60).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  items: z
    .array(purchaseItemSchema)
    .min(1, 'Agrega al menos un producto'),
})

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>

// ── Receive purchase ──────────────────────────────────────────────────────────

export const receivePurchaseSchema = z.object({
  purchase_entry_id: z.string().uuid(),
  received_items: z
    .array(
      z.object({
        purchase_item_id: z.string().uuid(),
        quantity_received: z.number().min(0),
      })
    )
    .min(1),
  notes: z.string().max(500).optional(),
})

export type ReceivePurchaseInput = z.infer<typeof receivePurchaseSchema>

// ── Status ────────────────────────────────────────────────────────────────────

export const PURCHASE_STATUSES = ['draft', 'received', 'cancelled'] as const
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number]

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  draft:     'Borrador',
  received:  'Recibido',
  cancelled: 'Cancelado',
}

// ── Filters ───────────────────────────────────────────────────────────────────

export const purchaseFilterSchema = z.object({
  location_id: z.string().uuid().optional(),
  supplier_id: z.string().uuid().optional(),
  status: z.enum(PURCHASE_STATUSES).optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20),
})

export type PurchaseFilterInput = z.infer<typeof purchaseFilterSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

export function calcLineTotal(qty: number, unitCost: number | null | undefined): number | null {
  if (unitCost == null) return null
  return qty * unitCost
}

export function calcOrderTotal(
  items: Array<{ quantity_ordered: number; unit_cost?: number | null }>
): number {
  return items.reduce((sum, item) => {
    if (item.unit_cost == null) return sum
    return sum + item.quantity_ordered * item.unit_cost
  }, 0)
}
