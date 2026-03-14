/**
 * tests/unit/sku.test.ts
 * Tests for SKU normalisation logic in legacy-parser.ts
 */

import { describe, it, expect } from 'vitest'
import { normalizeSku, normalizeProductName, normalizeUnit } from '@/lib/server/legacy-parser'

describe('normalizeSku', () => {
  it('uppercases and trims', () => {
    expect(normalizeSku('  abc-001  ')).toBe('ABC-001')
  })

  it('replaces spaces with dashes', () => {
    expect(normalizeSku('ABC 001')).toBe('ABC-001')
  })

  it('returns null for empty string', () => {
    expect(normalizeSku('')).toBeNull()
    expect(normalizeSku(null)).toBeNull()
    expect(normalizeSku(undefined)).toBeNull()
  })

  it('handles multi-space', () => {
    expect(normalizeSku('ABC  DEF  001')).toBe('ABC--DEF--001')
  })
})

describe('normalizeProductName', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeProductName('  Bife  de  Chorizo  ')).toBe('Bife de Chorizo')
  })

  it('returns null for empty', () => {
    expect(normalizeProductName('')).toBeNull()
    expect(normalizeProductName(null)).toBeNull()
  })
})

describe('normalizeUnit', () => {
  it.each([
    ['kg', 'kg'],
    ['kilo', 'kg'],
    ['kilogramos', 'kg'],
    ['g', 'g'],
    ['gramo', 'g'],
    ['l', 'L'],
    ['litro', 'L'],
    ['lt', 'L'],
    ['ml', 'mL'],
    ['cc', 'mL'],
    ['u', 'u'],
    ['unidad', 'u'],
    ['pza', 'u'],
  ])('normalizes %s → %s', (input, expected) => {
    const { normalized, isKnown } = normalizeUnit(input)
    expect(normalized).toBe(expected)
    expect(isKnown).toBe(true)
  })

  it('returns null and isKnown=false for unknown unit', () => {
    const { normalized, isKnown } = normalizeUnit('xyz')
    expect(normalized).toBeNull()
    expect(isKnown).toBe(false)
  })

  it('handles null/undefined', () => {
    expect(normalizeUnit(null).normalized).toBeNull()
    expect(normalizeUnit(undefined).normalized).toBeNull()
  })
})
