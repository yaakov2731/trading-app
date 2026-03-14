import { z } from 'zod'

// =============================================================================
// Reusable field validators
// =============================================================================

const uuidSchema = z.string().uuid()
const positiveNumber = z.number().positive()
const nonNegativeNumber = z.number().min(0)
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)')

// =============================================================================
// Product schemas
// =============================================================================

export const createProductSchema = z.object({
  name:        z.string().min(2, 'Nombre requerido (mín. 2 caracteres)').max(200),
  category_id: uuidSchema,
  unit_id:     uuidSchema,
  description: z.string().max(500).optional(),
  cost_price:  z.number().positive().optional().nullable(),
  sale_price:  z.number().positive().optional().nullable(),
  min_stock:   nonNegativeNumber.optional().default(0),
  max_stock:   z.number().positive().optional().nullable(),
  barcode:     z.string().max(100).optional().nullable(),
  notes:       z.string().max(1000).optional(),
})

export const updateProductSchema = createProductSchema.partial().extend({
  is_active: z.boolean().optional(),
})

// =============================================================================
// Stock movement schemas
// =============================================================================

const movementTypeEnum = z.enum([
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

export const quickMovementSchema = z.object({
  product_id:       uuidSchema,
  location_id:      uuidSchema,
  movement_type:    movementTypeEnum,
  quantity:         z.number().refine(v => v !== 0, 'La cantidad no puede ser 0'),
  unit_cost:        z.number().positive().optional().nullable(),
  notes:            z.string().max(500).optional(),
  idempotency_key:  z.string().max(200).optional(),
})

export const consumptionSchema = z.object({
  product_id:   uuidSchema,
  location_id:  uuidSchema,
  quantity:     positiveNumber,
  notes:        z.string().max(500).optional(),
  idempotency_key: z.string().optional(),
})

export const wasteSchema = z.object({
  product_id:   uuidSchema,
  location_id:  uuidSchema,
  quantity:     positiveNumber,
  notes:        z.string().max(500).optional(),
  idempotency_key: z.string().optional(),
})

// =============================================================================
// Purchase entry schemas
// =============================================================================

export const purchaseEntryItemSchema = z.object({
  product_id:        uuidSchema,
  quantity_ordered:  positiveNumber,
  quantity_received: nonNegativeNumber,
  unit_cost:         z.number().positive().optional().nullable(),
  notes:             z.string().max(500).optional(),
})

export const createPurchaseEntrySchema = z.object({
  supplier_id:    uuidSchema.optional().nullable(),
  location_id:    uuidSchema,
  entry_date:     dateString,
  invoice_number: z.string().max(100).optional().nullable(),
  invoice_date:   dateString.optional().nullable(),
  notes:          z.string().max(1000).optional(),
  items:          z.array(purchaseEntryItemSchema).min(1, 'Agregar al menos un producto'),
})

// =============================================================================
// Transfer schemas
// =============================================================================

export const transferItemSchema = z.object({
  product_id:        uuidSchema,
  quantity_requested: positiveNumber,
  quantity_sent:     nonNegativeNumber.optional().default(0),
  notes:             z.string().max(500).optional(),
})

export const createTransferSchema = z.object({
  from_location_id: uuidSchema,
  to_location_id:   uuidSchema,
  transfer_date:    dateString,
  notes:            z.string().max(1000).optional(),
  items:            z.array(transferItemSchema).min(1, 'Agregar al menos un producto'),
}).refine(
  data => data.from_location_id !== data.to_location_id,
  { message: 'El local de origen y destino deben ser distintos', path: ['to_location_id'] }
)

// =============================================================================
// Physical count schemas
// =============================================================================

export const createPhysicalCountSchema = z.object({
  location_id: uuidSchema,
  count_date:  dateString,
  notes:       z.string().max(1000).optional(),
})

export const countItemSchema = z.object({
  product_id:        uuidSchema,
  counted_quantity:  nonNegativeNumber,
  notes:             z.string().max(500).optional(),
})

// =============================================================================
// Category / Unit schemas
// =============================================================================

export const createCategorySchema = z.object({
  code:        z.string().min(2).max(20).regex(/^[A-Z0-9]+$/, 'Solo letras mayúsculas y números'),
  prefix:      z.string().min(2).max(5).regex(/^[A-Z]{2,5}$/, 'Solo letras mayúsculas (2-5)'),
  name:        z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  color:       z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color hex inválido').optional(),
  icon:        z.string().max(50).optional(),
})

export const createUnitSchema = z.object({
  code:              z.string().min(1).max(10).regex(/^[a-zA-Z]+$/, 'Solo letras'),
  name:              z.string().min(2).max(100),
  symbol:            z.string().min(1).max(20),
  conversion_factor: z.number().positive().optional().default(1),
  base_unit_id:      uuidSchema.optional().nullable(),
})

// =============================================================================
// Alert schemas
// =============================================================================

export const createAlertRuleSchema = z.object({
  product_id:      uuidSchema,
  location_id:     uuidSchema.optional().nullable(),
  alert_type:      z.enum(['low_stock', 'zero_stock', 'negative_stock', 'overstock', 'expiry']),
  threshold:       nonNegativeNumber,
  notify_channels: z.array(z.enum(['email', 'sms', 'push', 'slack'])).optional().default([]),
  notify_users:    z.array(uuidSchema).optional().default([]),
})

// =============================================================================
// Auth schemas
// =============================================================================

export const loginSchema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

// =============================================================================
// Export types
// =============================================================================

export type CreateProductInput    = z.infer<typeof createProductSchema>
export type UpdateProductInput    = z.infer<typeof updateProductSchema>
export type QuickMovementInput    = z.infer<typeof quickMovementSchema>
export type CreatePurchaseInput   = z.infer<typeof createPurchaseEntrySchema>
export type CreateTransferInput   = z.infer<typeof createTransferSchema>
export type CreatePhysicalCountInput = z.infer<typeof createPhysicalCountSchema>
export type CreateCategoryInput   = z.infer<typeof createCategorySchema>
export type CreateAlertRuleInput  = z.infer<typeof createAlertRuleSchema>
export type LoginInput            = z.infer<typeof loginSchema>
