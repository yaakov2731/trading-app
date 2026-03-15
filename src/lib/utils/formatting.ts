/**
 * lib/utils/formatting.ts
 * Shared display formatting utilities.
 */

// ── Numbers ───────────────────────────────────────────────────────────────────

export function formatQuantity(value: number | null | undefined, unit?: string | null): string {
  if (value === null || value === undefined) return '—'
  const formatted = Number.isInteger(value)
    ? value.toLocaleString('es-AR')
    : value.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
  return unit ? `${formatted} ${unit}` : formatted
}

export function formatCurrency(value: number | null | undefined, currency = 'ARS'): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(decimals)}%`
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return value.toLocaleString('es-AR')
}

// ── Strings ───────────────────────────────────────────────────────────────────

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength - 1)}…`
}

export function capitalize(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function titleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())
}

// ── Movement quantity ─────────────────────────────────────────────────────────

export function formatSignedQuantity(value: number, unit?: string | null): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatQuantity(value, unit)}`
}

export function movementQuantityColor(value: number): string {
  if (value > 0) return 'text-emerald-400'
  if (value < 0) return 'text-red-400'
  return 'text-slate-400'
}
