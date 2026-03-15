/**
 * lib/validations/suppliers.ts
 */

import { z } from 'zod'

export const createSupplierSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido').max(120),
  contact_name: z.string().max(100).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  tax_id: z.string().max(30).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>

export const updateSupplierSchema = createSupplierSchema.partial().extend({
  is_active: z.boolean().optional(),
})

export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>

export const supplierFilterSchema = z.object({
  search: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(50),
})

export type SupplierFilterInput = z.infer<typeof supplierFilterSchema>
