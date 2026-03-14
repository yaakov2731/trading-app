/**
 * lib/utils/number.ts
 * Number parsing and arithmetic utilities.
 */

// ── Safe parsing ──────────────────────────────────────────────────────────────

export function safeParseFloat(value: unknown, fallback = 0): number {
  const n = parseFloat(String(value))
  return isNaN(n) ? fallback : n
}

export function safeParseInt(value: unknown, fallback = 0): number {
  const n = parseInt(String(value), 10)
  return isNaN(n) ? fallback : n
}

// ── Rounding ──────────────────────────────────────────────────────────────────

export function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

// ── Clamping ──────────────────────────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// ── Percentage ────────────────────────────────────────────────────────────────

export function pct(part: number, total: number, decimals = 1): number {
  if (total === 0) return 0
  return round((part / total) * 100, decimals)
}

// ── Summation ─────────────────────────────────────────────────────────────────

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}

export function sumBy<T>(items: T[], getter: (item: T) => number): number {
  return items.reduce((acc, item) => acc + getter(item), 0)
}

// ── Stock status ──────────────────────────────────────────────────────────────

export type StockStatus = 'out_of_stock' | 'critical' | 'low' | 'ok' | 'high'

export function classifyStockLevel(
  quantity: number,
  minStock: number | null
): StockStatus {
  if (quantity <= 0) return 'out_of_stock'
  if (!minStock || minStock <= 0) return 'ok'
  const ratio = quantity / minStock
  if (ratio < 0.5) return 'critical'
  if (ratio < 1) return 'low'
  if (ratio > 3) return 'high'
  return 'ok'
}

export const STOCK_STATUS_COLORS: Record<StockStatus, string> = {
  out_of_stock: 'text-red-400',
  critical:     'text-red-400',
  low:          'text-amber-400',
  ok:           'text-emerald-400',
  high:         'text-blue-400',
}

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  out_of_stock: 'Sin stock',
  critical:     'Crítico',
  low:          'Bajo',
  ok:           'Normal',
  high:         'Alto',
}
