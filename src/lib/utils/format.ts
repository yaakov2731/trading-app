import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import type { MovementType, StockStatus } from '@/lib/types'

// =============================================================================
// Number formatting
// =============================================================================

export function formatQuantity(value: number, symbol?: string): string {
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(value)
  return symbol ? `${formatted} ${symbol}` : formatted
}

export function formatCurrency(value: number, currency = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

// =============================================================================
// Date formatting
// =============================================================================

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '—'
  return format(d, 'dd/MM/yyyy', { locale: es })
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '—'
  return format(d, 'dd/MM/yyyy HH:mm', { locale: es })
}

export function formatTimeAgo(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '—'
  return formatDistanceToNow(d, { addSuffix: true, locale: es })
}

export function formatDateInput(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return ''
  return format(d, 'yyyy-MM-dd')
}

// =============================================================================
// Movement type labels
// =============================================================================

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  opening_stock:             'Stock Inicial',
  purchase_in:               'Compra',
  production_in:             'Producción',
  consumption_out:           'Consumo',
  transfer_out:              'Transferencia (Salida)',
  transfer_in:               'Transferencia (Entrada)',
  waste_out:                 'Merma',
  manual_adjustment:         'Ajuste Manual',
  physical_count:            'Conteo Físico',
  reconciliation_adjustment: 'Reconciliación',
}

export function formatMovementType(type: MovementType): string {
  return MOVEMENT_LABELS[type] ?? type
}

// =============================================================================
// Stock status
// =============================================================================

export const STATUS_LABELS: Record<StockStatus, string> = {
  ok:      'Normal',
  warning: 'Bajo',
  low:     'Crítico',
  zero:    'Sin Stock',
}

export function formatStockStatus(status: StockStatus): string {
  return STATUS_LABELS[status] ?? status
}

// =============================================================================
// Document codes
// =============================================================================

export function formatDocumentCode(code: string): string {
  return code.toUpperCase()
}

// =============================================================================
// Quantity sign
// =============================================================================

export function formatSignedQuantity(quantity: number, symbol?: string): string {
  const sign = quantity > 0 ? '+' : ''
  return `${sign}${formatQuantity(quantity, symbol)}`
}
