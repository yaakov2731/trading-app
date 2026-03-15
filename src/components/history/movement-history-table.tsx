'use client'

import { cn } from '@/lib/utils/cn'
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, RotateCcw, Package } from 'lucide-react'
import type { HistoryRow } from '@/lib/server/history'
import { formatQuantity, formatCurrency, formatDateTime, MOVEMENT_LABELS } from '@/lib/utils/format'

interface MovementHistoryTableProps {
  movements: HistoryRow[]
  total: number
  page: number
  pageSize: number
  onPageChange?: (page: number) => void
  className?: string
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  purchase_in:               ArrowDownLeft,
  production_in:             ArrowDownLeft,
  transfer_in:               ArrowLeftRight,
  opening_stock:             Package,
  consumption_out:           ArrowUpRight,
  transfer_out:              ArrowLeftRight,
  waste_out:                 ArrowUpRight,
  manual_adjustment:         RotateCcw,
  physical_count:            RotateCcw,
  reconciliation_adjustment: RotateCcw,
}

const TYPE_COLORS: Record<string, { icon: string; qty: string; badge: string }> = {
  purchase_in:               { icon: 'text-emerald-500', qty: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700' },
  production_in:             { icon: 'text-emerald-500', qty: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700' },
  transfer_in:               { icon: 'text-blue-500',    qty: 'text-blue-600',    badge: 'bg-blue-50 text-blue-700' },
  opening_stock:             { icon: 'text-slate-500',   qty: 'text-slate-700',   badge: 'bg-slate-100 text-slate-600' },
  consumption_out:           { icon: 'text-red-400',     qty: 'text-red-600',     badge: 'bg-red-50 text-red-700' },
  transfer_out:              { icon: 'text-amber-500',   qty: 'text-amber-600',   badge: 'bg-amber-50 text-amber-700' },
  waste_out:                 { icon: 'text-red-400',     qty: 'text-red-600',     badge: 'bg-red-50 text-red-700' },
  manual_adjustment:         { icon: 'text-violet-500',  qty: 'text-violet-600',  badge: 'bg-violet-50 text-violet-700' },
  physical_count:            { icon: 'text-violet-500',  qty: 'text-violet-600',  badge: 'bg-violet-50 text-violet-700' },
  reconciliation_adjustment: { icon: 'text-violet-500',  qty: 'text-violet-600',  badge: 'bg-violet-50 text-violet-700' },
}

export function MovementHistoryTable({
  movements,
  total,
  page,
  pageSize,
  onPageChange,
  className,
}: MovementHistoryTableProps) {
  const totalPages = Math.ceil(total / pageSize)

  if (movements.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16', className)}>
        <Package className="h-10 w-10 text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-500">No hay movimientos</p>
        <p className="text-xs text-slate-400 mt-1">Ajusta los filtros para ver resultados</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Table — desktop */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Producto</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Ubicación</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Cantidad</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Balance</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Referencia</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Por</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {movements.map((mov) => {
              const Icon = TYPE_ICONS[mov.movement_type] ?? RotateCcw
              const colors = TYPE_COLORS[mov.movement_type] ?? TYPE_COLORS.manual_adjustment
              const label = MOVEMENT_LABELS[mov.movement_type as keyof typeof MOVEMENT_LABELS] ?? mov.movement_type

              return (
                <tr key={mov.id} className="bg-white hover:bg-slate-50 transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                    {formatDateTime(mov.performed_at)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 truncate max-w-[180px]">{mov.product_name}</p>
                    <p className="font-mono text-xs text-slate-400">{mov.sku}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {mov.location_color && (
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: mov.location_color }}
                        />
                      )}
                      <span className="text-xs text-slate-600 truncate max-w-[120px]">{mov.location_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Icon className={cn('h-3.5 w-3.5 shrink-0', colors.icon)} />
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', colors.badge)}>
                        {label}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn('font-semibold tabular-nums', colors.qty)}>
                      {mov.quantity > 0 ? '+' : ''}{formatQuantity(mov.quantity)}
                    </span>
                    <span className="ml-1 text-xs text-slate-400">{mov.unit_symbol}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs text-slate-500">
                    {formatQuantity(mov.running_balance)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">
                    {mov.reference_code ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[120px]">
                    {mov.performed_by_name ?? '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Card list — mobile */}
      <div className="space-y-2 md:hidden">
        {movements.map((mov) => {
          const Icon = TYPE_ICONS[mov.movement_type] ?? RotateCcw
          const colors = TYPE_COLORS[mov.movement_type] ?? TYPE_COLORS.manual_adjustment
          const label = MOVEMENT_LABELS[mov.movement_type as keyof typeof MOVEMENT_LABELS] ?? mov.movement_type

          return (
            <div key={mov.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800 truncate">{mov.product_name}</p>
                  <p className="font-mono text-xs text-slate-400">{mov.sku} · {mov.location_name}</p>
                </div>
                <span className={cn('font-bold text-lg tabular-nums shrink-0', colors.qty)}>
                  {mov.quantity > 0 ? '+' : ''}{formatQuantity(mov.quantity)}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <Icon className={cn('h-3 w-3', colors.icon)} />
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', colors.badge)}>{label}</span>
                </div>
                <span className="text-xs text-slate-400">{formatDateTime(mov.performed_at)}</span>
                {mov.reference_code && (
                  <span className="font-mono text-xs text-slate-400">{mov.reference_code}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">
            {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} de {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <span className="text-xs text-slate-500">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
