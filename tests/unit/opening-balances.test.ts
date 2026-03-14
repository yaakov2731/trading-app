/**
 * tests/unit/opening-balances.test.ts
 * Tests for opening balance candidate confidence logic.
 */

import { describe, it, expect } from 'vitest'
import { parseSnapshotRow, parseCatalogRow, detectImportType } from '@/lib/server/legacy-parser'
import type { ConfidenceLevel } from '@/lib/validations/migration'

describe('parseSnapshotRow confidence', () => {
  it('returns high confidence for clean row', () => {
    const row = parseSnapshotRow({
      SKU: 'UMO-001',
      PRODUCTO: 'Bife de chorizo',
      STOCK: 10,
      FECHA: '15/01/2025',
      HORA: '08:00',
      UNIDAD: 'kg',
    })
    expect(row.confidence).toBe<ConfidenceLevel>('high')
    expect(row.issues).toHaveLength(0)
  })

  it('returns medium confidence for 1 warning', () => {
    const row = parseSnapshotRow({
      SKU: 'UMO-001',
      PRODUCTO: 'Bife de chorizo',
      STOCK: 10,
      // Missing FECHA (warning)
    })
    expect(row.confidence).toBe<ConfidenceLevel>('medium')
  })

  it('returns low confidence for missing product (error)', () => {
    const row = parseSnapshotRow({
      SKU: 'UMO-001',
      STOCK: 10,
    })
    expect(row.confidence).toBe<ConfidenceLevel>('low')
    expect(row.issues.some((i) => i.code === 'missing_product')).toBe(true)
  })

  it('returns unresolved when both SKU and product name missing', () => {
    const row = parseSnapshotRow({
      STOCK: 10,
      FECHA: '15/01/2025',
    })
    expect(row.confidence).toBe<ConfidenceLevel>('unresolved')
  })

  it('captures negative stock as warning', () => {
    const row = parseSnapshotRow({
      SKU: 'TEST',
      PRODUCTO: 'Test',
      STOCK: -5,
      FECHA: '15/01/2025',
      UNIDAD: 'kg',
    })
    expect(row.issues.some((i) => i.code === 'negative_stock')).toBe(true)
    expect(row.issues.some((i) => i.severity === 'warning')).toBe(true)
  })

  it('reads locationRaw from opts fallback', () => {
    const row = parseSnapshotRow(
      { SKU: 'TEST', PRODUCTO: 'Test', STOCK: 1 },
      { locationRaw: 'Umo Grill' }
    )
    expect(row.locationRaw).toBe('Umo Grill')
  })
})

describe('parseCatalogRow', () => {
  it('returns high confidence for clean catalog row', () => {
    const row = parseCatalogRow({
      SKU: 'CAT-001', PRODUCTO: 'Producto test',
      CATEGORIA: 'Carnes', UNIDAD: 'kg', MINIMO: 5, ACTIVO: 1,
    })
    expect(row.confidence).toBe<ConfidenceLevel>('high')
    expect(row.isActive).toBe(true)
  })

  it('parses isActive correctly for various truthy values', () => {
    expect(parseCatalogRow({ SKU: 'A', PRODUCTO: 'B', ACTIVO: 'si' }).isActive).toBe(true)
    expect(parseCatalogRow({ SKU: 'A', PRODUCTO: 'B', ACTIVO: 'yes' }).isActive).toBe(true)
    expect(parseCatalogRow({ SKU: 'A', PRODUCTO: 'B', ACTIVO: '0' }).isActive).toBe(false)
    expect(parseCatalogRow({ SKU: 'A', PRODUCTO: 'B', ACTIVO: 'no' }).isActive).toBe(false)
  })
})

describe('detectImportType', () => {
  it('detects snapshot from FECHA/STOCK keys', () => {
    expect(detectImportType({ FECHA: '', STOCK: 10, PRODUCTO: '' })).toBe('snapshot')
  })

  it('detects catalog from CATEGORIA/MINIMO keys', () => {
    expect(detectImportType({ SKU: '', CATEGORIA: '', MINIMO: 5 })).toBe('catalog')
  })

  it('detects mixed when both sets present', () => {
    expect(detectImportType({ FECHA: '', STOCK: 10, CATEGORIA: '', MINIMO: 5 })).toBe('mixed')
  })

  it('defaults to snapshot when ambiguous', () => {
    expect(detectImportType({ SKU: '', PRODUCTO: '' })).toBe('snapshot')
  })
})
