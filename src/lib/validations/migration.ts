/**
 * lib/validations/migration.ts
 * Zod schemas for the migration/cutover workflow.
 */

import { z } from 'zod'

// ── Import run ────────────────────────────────────────────────────────────────

export const IMPORT_SOURCE_TYPES = ['excel', 'sheets', 'csv', 'json', 'manual'] as const
export type ImportSourceType = (typeof IMPORT_SOURCE_TYPES)[number]

export const IMPORT_RUN_STATUSES = ['pending', 'running', 'completed', 'failed', 'partial'] as const
export type ImportRunStatus = (typeof IMPORT_RUN_STATUSES)[number]

export const ROW_STATUSES = ['pending', 'needs_review', 'approved', 'rejected', 'matched', 'created', 'skipped', 'failed'] as const
export type RowStatus = (typeof ROW_STATUSES)[number]

export const IMPORT_TYPES = ['snapshot', 'catalog', 'mixed'] as const
export type ImportType = (typeof IMPORT_TYPES)[number]

export const CONFIDENCE_LEVELS = ['high', 'medium', 'low', 'unresolved'] as const
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number]

// ── Import payload schema ─────────────────────────────────────────────────────

export const legacySnapshotRowSchema = z.object({
  FECHA:       z.string().optional().nullable(),
  HORA:        z.string().optional().nullable(),
  RESPONSABLE: z.string().optional().nullable(),
  SKU:         z.string().optional().nullable(),
  PRODUCTO:    z.string().optional().nullable(),
  STOCK:       z.union([z.string(), z.number()]).optional().nullable(),
  NOTA:        z.string().optional().nullable(),
  UBICACION:   z.string().optional().nullable(),
  // tolerant: allow any extra keys
}).passthrough()

export const legacyCatalogRowSchema = z.object({
  SKU:       z.string().optional().nullable(),
  PRODUCTO:  z.string().optional().nullable(),
  CATEGORIA: z.string().optional().nullable(),
  UNIDAD:    z.string().optional().nullable(),
  MINIMO:    z.union([z.string(), z.number()]).optional().nullable(),
  ACTIVO:    z.union([z.string(), z.number()]).optional().nullable(),
}).passthrough()

export const legacyRowSchema = z.union([legacySnapshotRowSchema, legacyCatalogRowSchema])

export const importPayloadSchema = z.object({
  import_type: z.enum(IMPORT_TYPES),
  source_type: z.enum(IMPORT_SOURCE_TYPES).default('excel'),
  filename: z.string().min(1).max(200),
  source_sheet: z.string().max(100).optional(),
  location_id: z.string().uuid('Selecciona una ubicación').optional(),
  rows: z.array(z.record(z.unknown())).min(1, 'El archivo no contiene filas').max(10000),
  notes: z.string().max(500).optional(),
})

export type ImportPayloadInput = z.infer<typeof importPayloadSchema>

// ── Review queue ──────────────────────────────────────────────────────────────

export const reviewRowActionSchema = z.object({
  row_id: z.string().uuid(),
  action: z.enum(['approve', 'reject', 'skip']),
  override_product_id: z.string().uuid().optional(),
  override_location_id: z.string().uuid().optional(),
  override_quantity: z.number().min(0).optional(),
  notes: z.string().max(200).optional(),
})

export type ReviewRowActionInput = z.infer<typeof reviewRowActionSchema>

export const bulkReviewActionSchema = z.object({
  row_ids: z.array(z.string().uuid()).min(1).max(500),
  action: z.enum(['approve', 'reject', 'skip']),
  notes: z.string().max(200).optional(),
})

export type BulkReviewActionInput = z.infer<typeof bulkReviewActionSchema>

// ── Opening balance ───────────────────────────────────────────────────────────

export const OPENING_BALANCE_STATUSES = ['pending', 'approved', 'excluded', 'applied'] as const
export type OpeningBalanceStatus = (typeof OPENING_BALANCE_STATUSES)[number]

export const approveOpeningBalanceSchema = z.object({
  candidate_id: z.string().uuid(),
  override_quantity: z.number().min(0).optional(),
  override_product_id: z.string().uuid().optional(),
  override_location_id: z.string().uuid().optional(),
  notes: z.string().max(200).optional(),
})

export type ApproveOpeningBalanceInput = z.infer<typeof approveOpeningBalanceSchema>

export const bulkApproveOpeningBalancesSchema = z.object({
  candidate_ids: z.array(z.string().uuid()).min(1).max(500),
  min_confidence: z.enum(CONFIDENCE_LEVELS).default('high'),
})

export type BulkApproveOpeningBalancesInput = z.infer<typeof bulkApproveOpeningBalancesSchema>

// ── Cutover ───────────────────────────────────────────────────────────────────

export const executeCutoverSchema = z.object({
  dry_run: z.boolean().default(false),
  notes: z.string().max(500).optional(),
  confirmed: z.boolean().refine((v) => v === true, {
    message: 'Debes confirmar la ejecución del corte',
  }),
})

export type ExecuteCutoverInput = z.infer<typeof executeCutoverSchema>

// ── Filters ───────────────────────────────────────────────────────────────────

export const reviewFilterSchema = z.object({
  import_run_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  status: z.enum(ROW_STATUSES).optional(),
  issue_type: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(200).default(50),
})

export type ReviewFilterInput = z.infer<typeof reviewFilterSchema>

export const openingBalanceFilterSchema = z.object({
  location_id: z.string().uuid().optional(),
  confidence: z.enum(CONFIDENCE_LEVELS).optional(),
  status: z.enum(OPENING_BALANCE_STATUSES).optional(),
  unresolved_only: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(200).default(100),
})

export type OpeningBalanceFilterInput = z.infer<typeof openingBalanceFilterSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

export const ROW_STATUS_LABELS: Record<RowStatus, string> = {
  pending:      'Pendiente',
  needs_review: 'Revisar',
  approved:     'Aprobado',
  rejected:     'Rechazado',
  matched:      'Vinculado',
  created:      'Creado',
  skipped:      'Omitido',
  failed:       'Error',
}

export const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  high:       'Alta',
  medium:     'Media',
  low:        'Baja',
  unresolved: 'Sin resolver',
}

export const OPENING_BALANCE_STATUS_LABELS: Record<OpeningBalanceStatus, string> = {
  pending:  'Pendiente',
  approved: 'Aprobado',
  excluded: 'Excluido',
  applied:  'Aplicado',
}
