'use client'

import * as React from 'react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableEmpty,
  TableSkeleton,
} from '@/components/ui/table'
import { MovementTypeBadge } from '@/components/ui/badge'
import { formatDateTime, formatQuantity, formatSignedQuantity } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { History } from 'lucide-react'

// =============================================================================
// Premium Movements Table
// =============================================================================

export interface MovementRow {
  id:                string
  product_id:        string
  product_name:      string
  sku:               string
  location_id?:      string
  location_name?:    string
  location_color?:   string
  movement_type:     string
  quantity:          number
  unit_symbol?:      string
  unit_cost?:        number | null
  total_cost?:       number | null
  running_balance?:  number | null
  reference_code?:   string | null
  reference_type?:   string | null
  notes?:            string | null
  performed_at:      string
  performed_by_name?: string | null
}

interface MovementsTableProps {
  movements:    MovementRow[]
  isLoading?:   boolean
  showLocation?: boolean
  showProduct?:  boolean
  onRowClick?:  (row: MovementRow) => void
  className?:   string
}

export function MovementsTable({
  movements,
  isLoading = false,
  showLocation = false,
  showProduct = true,
  onRowClick,
  className,
}: MovementsTableProps) {
  if (isLoading) {
    return (
      <div className={cn('rounded-xl border border-slate-200 overflow-hidden bg-white', className)}>
        <Table>
          <TableHeader>
            <MovementsTableHeadRow showLocation={showLocation} showProduct={showProduct} />
          </TableHeader>
          <TableBody>
            <TableSkeleton rows={8} cols={showLocation ? 8 : 7} />
          </TableBody>
        </Table>
      </div>
    )
  }

  if (movements.length === 0) {
    return (
      <div className={cn('rounded-xl border border-slate-200 overflow-hidden bg-white', className)}>
        <Table>
          <TableHeader>
            <MovementsTableHeadRow showLocation={showLocation} showProduct={showProduct} />
          </TableHeader>
          <TableBody>
            <TableEmpty
              icon={<History size={24} />}
              title="Sin movimientos"
              description="No hay movimientos que coincidan con los filtros actuales"
              colSpan={showLocation ? 8 : 7}
            />
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className={cn('rounded-xl border border-slate-200 overflow-hidden bg-white', className)}>
      <Table>
        <TableHeader>
          <MovementsTableHeadRow showLocation={showLocation} showProduct={showProduct} />
        </TableHeader>
        <TableBody>
          {movements.map(mv => (
            <MovementTableRow
              key={mv.id}
              mv={mv}
              showLocation={showLocation}
              showProduct={showProduct}
              onClick={onRowClick ? () => onRowClick(mv) : undefined}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ── Head row ──────────────────────────────────────────────────────────────────

function MovementsTableHeadRow({
  showLocation,
  showProduct,
}: {
  showLocation: boolean
  showProduct:  boolean
}) {
  return (
    <TableRow>
      <TableHead className="w-36">Fecha / Hora</TableHead>
      {showProduct && <TableHead>Producto</TableHead>}
      {showLocation && <TableHead className="hidden md:table-cell">Local</TableHead>}
      <TableHead className="w-40">Tipo</TableHead>
      <TableHead className="text-right w-28">Cantidad</TableHead>
      <TableHead className="text-right w-28 hidden md:table-cell">Saldo</TableHead>
      <TableHead className="hidden lg:table-cell w-28">Referencia</TableHead>
      <TableHead className="hidden lg:table-cell">Usuario</TableHead>
    </TableRow>
  )
}

// ── Body row ──────────────────────────────────────────────────────────────────

function MovementTableRow({
  mv,
  showLocation,
  showProduct,
  onClick,
}: {
  mv:           MovementRow
  showLocation: boolean
  showProduct:  boolean
  onClick?:     () => void
}) {
  const isPositive = mv.quantity > 0
  const absQty     = Math.abs(mv.quantity)

  return (
    <TableRow
      className={cn(onClick && 'cursor-pointer')}
      onClick={onClick}
    >
      {/* Date */}
      <TableCell>
        <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
          {formatDateTime(mv.performed_at)}
        </span>
      </TableCell>

      {/* Product */}
      {showProduct && (
        <TableCell>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate max-w-48">
              {mv.product_name}
            </p>
            <p className="text-xs font-mono text-slate-400">{mv.sku}</p>
          </div>
        </TableCell>
      )}

      {/* Location */}
      {showLocation && (
        <TableCell className="hidden md:table-cell">
          {mv.location_name && (
            <div className="flex items-center gap-1.5">
              {mv.location_color && (
                <span
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: mv.location_color }}
                />
              )}
              <span className="text-xs text-slate-600 truncate">{mv.location_name}</span>
            </div>
          )}
        </TableCell>
      )}

      {/* Type badge */}
      <TableCell>
        <MovementTypeBadge type={mv.movement_type as any} />
      </TableCell>

      {/* Signed quantity */}
      <TableCell className="text-right">
        <span className={cn(
          'font-bold tabular-nums text-sm',
          isPositive ? 'text-success-600' : 'text-danger-600'
        )}>
          {isPositive ? '+' : '−'}{formatQuantity(absQty)}
          {mv.unit_symbol && (
            <span className="ml-1 text-xs font-normal text-slate-400">{mv.unit_symbol}</span>
          )}
        </span>
      </TableCell>

      {/* Running balance */}
      <TableCell className="text-right hidden md:table-cell">
        {mv.running_balance != null ? (
          <span className={cn(
            'text-sm tabular-nums',
            mv.running_balance < 0 ? 'text-danger-600 font-semibold' : 'text-slate-600'
          )}>
            {formatQuantity(mv.running_balance)}
            {mv.unit_symbol && (
              <span className="ml-1 text-xs text-slate-400">{mv.unit_symbol}</span>
            )}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </TableCell>

      {/* Reference */}
      <TableCell className="hidden lg:table-cell">
        <span className="text-xs text-slate-400 font-mono">
          {mv.reference_code ?? '—'}
        </span>
      </TableCell>

      {/* User */}
      <TableCell className="hidden lg:table-cell">
        <span className="text-xs text-slate-500 truncate">
          {mv.performed_by_name ?? '—'}
        </span>
      </TableCell>
    </TableRow>
  )
}
