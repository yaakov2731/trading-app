'use client'

import { cn } from '@/lib/utils/cn'
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react'
import type { PhysicalCountItemRow } from '@/lib/server/physical-counts'
import { discrepancySeverity } from '@/lib/validations/counts'
import { formatQuantity } from '@/lib/utils/format'

interface CountDifferenceCardProps {
  item: PhysicalCountItemRow
  className?: string
}

const SEVERITY_STYLES = {
  none:     'border-slate-200 bg-white',
  minor:    'border-amber-200 bg-amber-50',
  moderate: 'border-orange-200 bg-orange-50',
  critical: 'border-red-200 bg-red-50',
}

const SEVERITY_BADGE = {
  none:     'bg-slate-100 text-slate-500',
  minor:    'bg-amber-100 text-amber-700',
  moderate: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

const SEVERITY_LABELS = {
  none:     'Sin diferencia',
  minor:    'Diferencia menor',
  moderate: 'Diferencia moderada',
  critical: 'Diferencia crítica',
}

export function CountDifferenceCard({ item, className }: CountDifferenceCardProps) {
  const severity = discrepancySeverity(item.discrepancy, item.system_quantity)
  const isPositive = item.discrepancy > 0
  const isNegative = item.discrepancy < 0
  const pctOff =
    item.system_quantity !== 0
      ? Math.abs((item.discrepancy / item.system_quantity) * 100).toFixed(1)
      : null

  const DiffIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all',
        SEVERITY_STYLES[severity],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-slate-900 text-sm">{item.product_name}</span>
            <span className="shrink-0 rounded font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5">
              {item.sku}
            </span>
          </div>
          {item.notes && (
            <p className="mt-0.5 text-xs text-slate-500 truncate">{item.notes}</p>
          )}
        </div>

        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
            SEVERITY_BADGE[severity]
          )}
        >
          {SEVERITY_LABELS[severity]}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        {/* System */}
        <div className="rounded-lg bg-white/70 p-2.5 text-center border border-slate-100">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Sistema</p>
          <p className="mt-0.5 font-semibold text-slate-800 text-lg leading-none">
            {formatQuantity(item.system_quantity)}
          </p>
          <p className="text-[10px] text-slate-400">{item.unit_symbol}</p>
        </div>

        {/* Counted */}
        <div className="rounded-lg bg-white/70 p-2.5 text-center border border-slate-100">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Contado</p>
          <p className="mt-0.5 font-semibold text-slate-800 text-lg leading-none">
            {formatQuantity(item.counted_quantity)}
          </p>
          <p className="text-[10px] text-slate-400">{item.unit_symbol}</p>
        </div>

        {/* Difference */}
        <div
          className={cn(
            'rounded-lg p-2.5 text-center border',
            severity === 'none'
              ? 'bg-emerald-50 border-emerald-100'
              : isNegative
              ? 'bg-red-50 border-red-100'
              : 'bg-green-50 border-green-100'
          )}
        >
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Diferencia</p>
          <div className="mt-0.5 flex items-center justify-center gap-1">
            <DiffIcon
              className={cn(
                'h-4 w-4',
                severity === 'none'
                  ? 'text-slate-400'
                  : isNegative
                  ? 'text-red-500'
                  : 'text-emerald-500'
              )}
            />
            <p
              className={cn(
                'font-bold text-lg leading-none',
                severity === 'none'
                  ? 'text-slate-400'
                  : isNegative
                  ? 'text-red-600'
                  : 'text-emerald-600'
              )}
            >
              {isPositive ? '+' : ''}
              {formatQuantity(item.discrepancy)}
            </p>
          </div>
          {pctOff && (
            <p className="text-[10px] text-slate-400">{pctOff}%</p>
          )}
        </div>
      </div>

      {severity === 'critical' && (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-100 px-2.5 py-1.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />
          <p className="text-xs text-red-700">Diferencia significativa — verificar antes de confirmar</p>
        </div>
      )}
    </div>
  )
}
