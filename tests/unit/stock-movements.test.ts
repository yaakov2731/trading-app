/**
 * tests/unit/stock-movements.test.ts
 * Tests for quantity parsing and movement quantity logic.
 */

import { describe, it, expect } from 'vitest'
import { parseQuantity, parseSnapshotDate } from '@/lib/server/legacy-parser'

describe('parseQuantity', () => {
  it('parses simple integers', () => {
    const { quantity, isValid } = parseQuantity(10)
    expect(quantity).toBe(10)
    expect(isValid).toBe(true)
  })

  it('parses Argentine format (dot=thousands, comma=decimal)', () => {
    // "1.500,50" → 1500.50
    const { quantity, isValid } = parseQuantity('1.500,50')
    expect(quantity).toBeCloseTo(1500.50)
    expect(isValid).toBe(true)
  })

  it('parses simple decimal', () => {
    const { quantity } = parseQuantity('12,5')
    expect(quantity).toBeCloseTo(12.5)
  })

  it('returns invalid for empty string', () => {
    const { quantity, isValid, warning } = parseQuantity('')
    expect(quantity).toBeNull()
    expect(isValid).toBe(false)
    expect(warning).toContain('vacía')
  })

  it('returns invalid for non-numeric', () => {
    const { quantity, isValid } = parseQuantity('abc')
    expect(quantity).toBeNull()
    expect(isValid).toBe(false)
  })

  it('returns warning for negative quantity', () => {
    const { quantity, isValid, warning } = parseQuantity('-5')
    expect(quantity).toBe(-5)
    expect(isValid).toBe(false)
    expect(warning).toContain('negativa')
  })

  it('returns valid for zero', () => {
    const { quantity, isValid } = parseQuantity(0)
    expect(quantity).toBe(0)
    expect(isValid).toBe(true)
  })
})

describe('parseSnapshotDate', () => {
  it('parses DD/MM/YYYY', () => {
    const { datetime, isValid } = parseSnapshotDate('15/01/2025', '08:30')
    expect(isValid).toBe(true)
    expect(datetime).toBe('2025-01-15T08:30:00')
  })

  it('parses YYYY-MM-DD', () => {
    const { datetime, isValid } = parseSnapshotDate('2025-01-15', null)
    expect(isValid).toBe(true)
    expect(datetime).toBe('2025-01-15T00:00:00')
  })

  it('expands 2-digit years', () => {
    const { datetime, isValid } = parseSnapshotDate('15/01/25', null)
    expect(isValid).toBe(true)
    expect(datetime).toContain('2025')
  })

  it('returns invalid for empty fecha', () => {
    const { datetime, isValid } = parseSnapshotDate(null, null)
    expect(isValid).toBe(false)
    expect(datetime).toBeNull()
  })

  it('uses 00:00:00 when hora is missing', () => {
    const { datetime } = parseSnapshotDate('15/01/2025', undefined)
    expect(datetime).toContain('T00:00:00')
  })

  it('returns invalid for garbage date', () => {
    const { isValid } = parseSnapshotDate('not-a-date', null)
    expect(isValid).toBe(false)
  })
})
