/**
 * lib/validations/common.ts
 * Shared Zod schema primitives used across multiple modules.
 */

import { z } from 'zod'

// ── Primitive types ───────────────────────────────────────────────────────────

export const uuidSchema = z.string().uuid('ID inválido')
export const optionalUuid = z.string().uuid().optional().nullable()
export const positiveNumber = z.number().positive('Debe ser mayor que cero')
export const nonNegativeNumber = z.number().min(0, 'No puede ser negativo')
export const trimmedString = z.string().trim()
export const shortText = z.string().trim().min(1).max(200)
export const longText = z.string().trim().max(1000)
export const optionalText = z.string().trim().max(500).optional().nullable()

// ── Date strings ──────────────────────────────────────────────────────────────

export const isoDateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Fecha inválida — usar formato YYYY-MM-DD'
)

export const isoDateTimeSchema = z.string().datetime({ message: 'Fecha y hora inválida' })

export const localDateSchema = z.string().min(1, 'Fecha requerida')

// ── Pagination ────────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(200).default(50),
})

export type PaginationInput = z.infer<typeof paginationSchema>

// ── Sort ──────────────────────────────────────────────────────────────────────

export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc')

// ── Location filter ───────────────────────────────────────────────────────────

export const locationFilterSchema = z.object({
  location_id: optionalUuid,
})

// ── Date range filter ─────────────────────────────────────────────────────────

export const dateRangeFilterSchema = z.object({
  date_from: isoDateSchema.optional(),
  date_to: isoDateSchema.optional(),
}).refine(
  (data) => {
    if (data.date_from && data.date_to) return data.date_from <= data.date_to
    return true
  },
  { message: 'La fecha de inicio no puede ser posterior a la fecha de fin' }
)

export type DateRangeFilterInput = z.infer<typeof dateRangeFilterSchema>

// ── Search filter ─────────────────────────────────────────────────────────────

export const searchFilterSchema = z.object({
  q: z.string().trim().max(100).optional(),
})

// ── Combined list filter ──────────────────────────────────────────────────────

export const listFilterSchema = paginationSchema
  .merge(locationFilterSchema)
  .merge(dateRangeFilterSchema)
  .merge(searchFilterSchema)

export type ListFilterInput = z.infer<typeof listFilterSchema>

// ── Bulk ID input ─────────────────────────────────────────────────────────────

export const bulkIdsSchema = z.object({
  ids: z.array(uuidSchema).min(1).max(500),
})

// ── Money ─────────────────────────────────────────────────────────────────────

export const priceSchema = z
  .number()
  .min(0, 'El precio no puede ser negativo')
  .max(999_999_999, 'Precio demasiado alto')
  .optional()
  .nullable()

// ── Quantity ──────────────────────────────────────────────────────────────────

export const quantitySchema = z
  .number()
  .min(0, 'La cantidad no puede ser negativa')
  .max(999_999, 'Cantidad demasiado alta')

export const positiveQuantitySchema = quantitySchema.positive('La cantidad debe ser mayor que cero')

// ── Notes ─────────────────────────────────────────────────────────────────────

export const notesSchema = z.string().trim().max(500).optional().nullable()

// ── Generic helpers ───────────────────────────────────────────────────────────

export function paginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
) {
  return {
    data,
    total,
    page,
    page_size: pageSize,
    has_more: total > page * pageSize,
    total_pages: Math.ceil(total / pageSize),
  }
}
