/**
 * lib/server/legacy-parser.ts
 * Parses raw legacy rows (snapshot-style and catalog-style) into structured
 * records with issue flags. Never fabricates movement history — only produces
 * the latest trusted snapshot quantity per SKU/location.
 */

import type { ImportType, ConfidenceLevel } from '@/lib/validations/migration'

// ── Unit normalization table ──────────────────────────────────────────────────

const UNIT_ALIASES: Record<string, string> = {
  // weight
  kg: 'kg', kilo: 'kg', kilos: 'kg', kilogramo: 'kg', kilogramos: 'kg',
  g: 'g', gr: 'g', gramo: 'g', gramos: 'g', grs: 'g',
  // volume
  l: 'L', lt: 'L', lts: 'L', litro: 'L', litros: 'L',
  ml: 'mL', cc: 'mL', mililitro: 'mL',
  // unit
  u: 'u', un: 'u', und: 'u', uni: 'u', unidad: 'u', unidades: 'u',
  pza: 'u', pieza: 'u', piezas: 'u',
  // containers
  bot: 'bot', botella: 'bot', botellas: 'bot',
  caj: 'caj', caja: 'caj', cajas: 'caj',
  lat: 'lat', lata: 'lat', latas: 'lat',
  bol: 'bol', bolsa: 'bol', bolsas: 'bol',
  bnd: 'bnd', bandeja: 'bnd', bandejas: 'bnd',
  prc: 'prc', porcion: 'prc', porción: 'prc', porciones: 'prc',
  doc: 'doc', docena: 'doc', docenas: 'doc',
}

export function normalizeUnit(raw: string | null | undefined): {
  normalized: string | null
  isKnown: boolean
} {
  if (!raw) return { normalized: null, isKnown: false }
  const key = raw.trim().toLowerCase()
  const normalized = UNIT_ALIASES[key] ?? null
  return { normalized, isKnown: normalized !== null }
}

// ── Date/time normalization ───────────────────────────────────────────────────

export function parseSnapshotDate(
  fecha: string | null | undefined,
  hora: string | null | undefined
): { datetime: string | null; isValid: boolean } {
  if (!fecha) return { datetime: null, isValid: false }

  const cleaned = fecha.trim()
  // Handle DD/MM/YYYY, YYYY-MM-DD, D/M/YY, D-M-YYYY
  const dmyMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  const ymdMatch = cleaned.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)

  let isoDate: string | null = null

  if (ymdMatch) {
    const [, y, m, d] = ymdMatch
    isoDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  } else if (dmyMatch) {
    let [, d, m, y] = dmyMatch
    if (y.length === 2) y = `20${y}`
    isoDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  if (!isoDate) return { datetime: null, isValid: false }

  const timeStr = hora?.trim() ?? '00:00:00'
  const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  const time = timeMatch
    ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}:${timeMatch[3] ?? '00'}`
    : '00:00:00'

  const datetime = `${isoDate}T${time}`
  const isValid = !isNaN(Date.parse(datetime))

  return { datetime: isValid ? datetime : null, isValid }
}

// ── Quantity normalization ────────────────────────────────────────────────────

export function parseQuantity(raw: string | number | null | undefined): {
  quantity: number | null
  isValid: boolean
  warning: string | null
} {
  if (raw === null || raw === undefined || raw === '') {
    return { quantity: null, isValid: false, warning: 'Cantidad vacía' }
  }

  const str = String(raw).trim().replace(/\./g, '').replace(',', '.')
  const n = parseFloat(str)

  if (isNaN(n)) {
    return { quantity: null, isValid: false, warning: `Cantidad no numérica: "${raw}"` }
  }
  if (n < 0) {
    return { quantity: n, isValid: false, warning: `Cantidad negativa: ${n}` }
  }

  return { quantity: n, isValid: true, warning: null }
}

// ── SKU normalization ─────────────────────────────────────────────────────────

export function normalizeSku(raw: string | null | undefined): string | null {
  if (!raw) return null
  return raw.trim().toUpperCase().replace(/\s+/g, '-')
}

export function normalizeProductName(raw: string | null | undefined): string | null {
  if (!raw) return null
  return raw.trim().replace(/\s+/g, ' ')
}

// ── Parsed row types ──────────────────────────────────────────────────────────

export interface ParsedSnapshotRow {
  type: 'snapshot'
  rawData: Record<string, unknown>
  sku: string | null
  productName: string | null
  quantity: number | null
  snapshotDatetime: string | null
  responsable: string | null
  locationRaw: string | null
  unitRaw: string | null
  unitNormalized: string | null
  sourceSheet: string | null
  notes: string | null
  // Issues
  issues: ParseIssue[]
  confidence: ConfidenceLevel
}

export interface ParsedCatalogRow {
  type: 'catalog'
  rawData: Record<string, unknown>
  sku: string | null
  productName: string | null
  categoryRaw: string | null
  unitRaw: string | null
  unitNormalized: string | null
  minStock: number | null
  isActive: boolean
  // Issues
  issues: ParseIssue[]
  confidence: ConfidenceLevel
}

export type ParsedRow = ParsedSnapshotRow | ParsedCatalogRow

export interface ParseIssue {
  field: string
  code: string
  message: string
  severity: 'error' | 'warning' | 'info'
}

// ── Snapshot row parser ───────────────────────────────────────────────────────

export function parseSnapshotRow(
  raw: Record<string, unknown>,
  opts: { sourceSheet?: string; locationRaw?: string } = {}
): ParsedSnapshotRow {
  const issues: ParseIssue[] = []

  // SKU
  const sku = normalizeSku(raw.SKU as string)
  if (!sku) {
    issues.push({ field: 'SKU', code: 'missing_sku', message: 'SKU ausente', severity: 'warning' })
  }

  // Product name
  const productName = normalizeProductName(raw.PRODUCTO as string)
  if (!productName) {
    issues.push({ field: 'PRODUCTO', code: 'missing_product', message: 'Nombre de producto ausente', severity: 'error' })
  }

  // Date/time
  const { datetime, isValid: dateValid } = parseSnapshotDate(
    raw.FECHA as string,
    raw.HORA as string
  )
  if (!dateValid) {
    issues.push({
      field: 'FECHA',
      code: 'invalid_date',
      message: `Fecha inválida: "${raw.FECHA ?? ''}"`,
      severity: 'warning',
    })
  }

  // Quantity (STOCK)
  const { quantity, isValid: qtyValid, warning: qtyWarn } = parseQuantity(raw.STOCK)
  if (!qtyValid) {
    issues.push({
      field: 'STOCK',
      code: qtyWarn?.includes('negativa') ? 'negative_stock' : 'invalid_quantity',
      message: qtyWarn ?? 'Cantidad inválida',
      severity: qtyWarn?.includes('negativa') ? 'warning' : 'error',
    })
  }

  // Unit
  const unitRaw = (raw.UNIDAD as string) ?? null
  const { normalized: unitNormalized, isKnown: unitKnown } = normalizeUnit(unitRaw)
  if (unitRaw && !unitKnown) {
    issues.push({
      field: 'UNIDAD',
      code: 'unknown_unit',
      message: `Unidad desconocida: "${unitRaw}"`,
      severity: 'warning',
    })
  }

  // Determine confidence
  const errorCount = issues.filter((i) => i.severity === 'error').length
  const warnCount = issues.filter((i) => i.severity === 'warning').length
  let confidence: ConfidenceLevel =
    errorCount > 0 ? 'low' : warnCount === 0 ? 'high' : warnCount === 1 ? 'medium' : 'low'
  if (!sku && !productName) confidence = 'unresolved'

  return {
    type: 'snapshot',
    rawData: raw,
    sku,
    productName,
    quantity,
    snapshotDatetime: datetime,
    responsable: (raw.RESPONSABLE as string) ?? null,
    locationRaw: (raw.UBICACION as string) ?? opts.locationRaw ?? null,
    unitRaw: unitRaw ?? null,
    unitNormalized,
    sourceSheet: opts.sourceSheet ?? null,
    notes: (raw.NOTA as string) ?? null,
    issues,
    confidence,
  }
}

// ── Catalog row parser ────────────────────────────────────────────────────────

export function parseCatalogRow(raw: Record<string, unknown>): ParsedCatalogRow {
  const issues: ParseIssue[] = []

  const sku = normalizeSku(raw.SKU as string)
  if (!sku) {
    issues.push({ field: 'SKU', code: 'missing_sku', message: 'SKU ausente', severity: 'error' })
  }

  const productName = normalizeProductName(raw.PRODUCTO as string)
  if (!productName) {
    issues.push({ field: 'PRODUCTO', code: 'missing_product', message: 'Nombre ausente', severity: 'error' })
  }

  const categoryRaw = (raw.CATEGORIA as string) ?? null
  if (!categoryRaw) {
    issues.push({ field: 'CATEGORIA', code: 'missing_category', message: 'Categoría ausente', severity: 'warning' })
  }

  const unitRaw = (raw.UNIDAD as string) ?? null
  const { normalized: unitNormalized, isKnown: unitKnown } = normalizeUnit(unitRaw)
  if (unitRaw && !unitKnown) {
    issues.push({ field: 'UNIDAD', code: 'unknown_unit', message: `Unidad desconocida: "${unitRaw}"`, severity: 'warning' })
  }

  const { quantity: minStock } = parseQuantity(raw.MINIMO)

  // Active flag: truthy values
  const activoRaw = String(raw.ACTIVO ?? '1').trim().toLowerCase()
  const isActive = ['1', 'si', 'sí', 'yes', 'true', 'activo', 'active'].includes(activoRaw)

  const errorCount = issues.filter((i) => i.severity === 'error').length
  const warnCount = issues.filter((i) => i.severity === 'warning').length
  const confidence: ConfidenceLevel =
    errorCount > 0 ? 'low' : warnCount === 0 ? 'high' : warnCount <= 1 ? 'medium' : 'low'

  return {
    type: 'catalog',
    rawData: raw,
    sku,
    productName,
    categoryRaw,
    unitRaw,
    unitNormalized,
    minStock,
    isActive,
    issues,
    confidence,
  }
}

// ── Auto-detect import type from row keys ─────────────────────────────────────

export function detectImportType(sample: Record<string, unknown>): ImportType {
  const keys = Object.keys(sample).map((k) => k.toUpperCase())
  const hasSnapshot = ['FECHA', 'STOCK', 'RESPONSABLE'].some((k) => keys.includes(k))
  const hasCatalog = ['CATEGORIA', 'MINIMO', 'ACTIVO'].some((k) => keys.includes(k))

  if (hasSnapshot && hasCatalog) return 'mixed'
  if (hasCatalog) return 'catalog'
  return 'snapshot'
}

// ── Batch parse ───────────────────────────────────────────────────────────────

export function parseLegacyRows(
  rows: Record<string, unknown>[],
  opts: {
    importType: ImportType
    sourceSheet?: string
    locationRaw?: string
  }
): ParsedRow[] {
  return rows.map((row) => {
    const type = opts.importType === 'mixed' ? detectImportType(row) : opts.importType
    if (type === 'catalog') {
      return parseCatalogRow(row)
    }
    return parseSnapshotRow(row, { sourceSheet: opts.sourceSheet, locationRaw: opts.locationRaw })
  })
}
