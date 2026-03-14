/**
 * lib/server/final-consistency.ts
 * Final consistency checks — required movement types, roles, export types, migration steps.
 */

// ── Movement types ────────────────────────────────────────────────────────────

export const REQUIRED_MOVEMENT_TYPES = [
  'purchase_in',
  'transfer_out',
  'transfer_in',
  'reconciliation_adjustment',
  'opening_stock',
  'waste',
  'manual_adjustment',
] as const

export type MovementType = (typeof REQUIRED_MOVEMENT_TYPES)[number]

export interface MovementTypeSupport {
  type: MovementType
  supported: boolean
  createdBy: string
  notes: string
}

export const MOVEMENT_TYPE_SUPPORT: MovementTypeSupport[] = [
  { type: 'purchase_in', supported: true, createdBy: 'purchase-receiving.ts', notes: 'Creado al recibir compra' },
  { type: 'transfer_out', supported: true, createdBy: 'transfers.ts → sendTransfer()', notes: 'Crea par out/in' },
  { type: 'transfer_in', supported: true, createdBy: 'transfers.ts → receiveTransfer()', notes: 'Crea par out/in' },
  { type: 'reconciliation_adjustment', supported: true, createdBy: 'physical-counts.ts → confirmPhysicalCount()', notes: 'Puede ser + o −' },
  { type: 'opening_stock', supported: true, createdBy: 'cutover.ts → executeCutover()', notes: 'Solo desde migración legada' },
  { type: 'waste', supported: false, createdBy: 'N/A', notes: 'Post-MVP — módulo de merma/desperdicio' },
  { type: 'manual_adjustment', supported: false, createdBy: 'N/A', notes: 'Post-MVP — ajuste manual directo' },
]

// ── Required roles ────────────────────────────────────────────────────────────

export const ROLE_COVERAGE = [
  { role: 'admin', defined: true, hasGuards: true, hasUiRestriction: true },
  { role: 'supervisor', defined: true, hasGuards: true, hasUiRestriction: true },
  { role: 'encargado', defined: true, hasGuards: true, hasUiRestriction: true },
  { role: 'read_only', defined: true, hasGuards: true, hasUiRestriction: true },
]

// ── Location support ──────────────────────────────────────────────────────────

export const LOCATION_SUPPORT = {
  multiLocation: true,
  locationScopedMovements: true,
  locationScopedPurchases: true,
  locationScopedTransfers: true,
  locationScopedCounts: true,
  locationScopedRLS: true,
  userLocationAssignment: true,
  adminBypassesLocationFilter: true,
}

// ── Export types ──────────────────────────────────────────────────────────────

export const EXPORT_TYPE_SUPPORT = [
  { type: 'stock_by_location', supported: true, file: 'stock-export.ts' },
  { type: 'movement_history', supported: true, file: 'movements-export.ts' },
  { type: 'purchase_list', supported: true, file: 'purchases-export.ts' },
  { type: 'purchase_detail', supported: true, file: 'purchases-export.ts' },
  { type: 'transfer_list', supported: true, file: 'transfers-export.ts' },
  { type: 'transfer_detail', supported: true, file: 'transfers-export.ts' },
  { type: 'count_detail', supported: true, file: 'counts-export.ts' },
  { type: 'supplier_list', supported: true, file: 'suppliers-export.ts' },
  { type: 'migration_review', supported: true, file: 'migration-review-export.ts' },
  { type: 'opening_balances', supported: true, file: 'opening-balances-export.ts' },
  { type: 'legacy_snapshots', supported: true, file: 'legacy-snapshots-export.ts' },
  { type: 'google_sheets_sync', supported: false, note: 'Payload helpers listos — wiring post-MVP' },
  { type: 'background_export_job', supported: false, note: 'Post-MVP' },
]

// ── Migration step support ────────────────────────────────────────────────────

export const MIGRATION_STEPS = [
  { step: 1, label: 'Importar archivo JSON/CSV', supported: true, module: 'migration-import.ts' },
  { step: 2, label: 'Parsear y detectar tipo', supported: true, module: 'legacy-parser.ts' },
  { step: 3, label: 'Revisar filas con problemas', supported: true, module: 'migration-review.ts' },
  { step: 4, label: 'Vincular producto/ubicación/unidad', supported: true, module: 'migration-mappings.ts' },
  { step: 5, label: 'Derivar candidatos de saldo inicial', supported: true, module: 'opening-balances.ts' },
  { step: 6, label: 'Aprobar candidatos', supported: true, module: 'opening-balances.ts' },
  { step: 7, label: 'Ejecutar corte (dry-run)', supported: true, module: 'cutover.ts' },
  { step: 8, label: 'Ejecutar corte (real)', supported: true, module: 'cutover.ts' },
  { step: 9, label: 'Rollback de corte', supported: true, module: 'cutover.ts' },
]

// ── Gap summary ───────────────────────────────────────────────────────────────

export function getConsistencyGaps(): string[] {
  const gaps: string[] = []

  const unsupportedMovements = MOVEMENT_TYPE_SUPPORT.filter((m) => !m.supported)
  if (unsupportedMovements.length > 0) {
    gaps.push(`Tipos de movimiento no soportados: ${unsupportedMovements.map((m) => m.type).join(', ')}`)
  }

  const unsupportedExports = EXPORT_TYPE_SUPPORT.filter((e) => !e.supported)
  if (unsupportedExports.length > 0) {
    gaps.push(`Tipos de exportación no soportados: ${unsupportedExports.map((e) => e.type).join(', ')}`)
  }

  return gaps
}
