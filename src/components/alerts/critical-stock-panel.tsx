'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { AlertTriangle, AlertCircle, Package, ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react'
import type { AlertRow } from '@/lib/server/alerts'
import { formatQuantity } from '@/lib/utils/format'
import Link from 'next/link'

interface CriticalStockPanelProps {
  alerts: AlertRow[]
  className?: string
  showActions?: boolean
}

export function CriticalStockPanel({
  alerts,
  className,
  showActions = true,
}: CriticalStockPanelProps) {
  const [expanded, setExpanded] = useState(true)
  const [filter, setFilter] = useState<'all' | 'zero' | 'low'>('all')

  const zeroAlerts = alerts.filter((a) => a.stock_status === 'zero')
  const lowAlerts = alerts.filter((a) => a.stock_status === 'low')
  const warningAlerts = alerts.filter((a) => a.stock_status === 'warning')

  const displayed = filter === 'all'
    ? alerts
    : filter === 'zero'
    ? zeroAlerts
    : lowAlerts

  if (alerts.length === 0) return null

  return (
    <div className={cn('rounded-2xl border border-red-200 bg-white overflow-hidden shadow-sm', className)}>
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-red-50 border-b border-red-200 hover:bg-red-100 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="font-semibold text-red-800 text-sm">
            Alertas de Stock ({alerts.length})
          </span>
          <div className="flex items-center gap-1 ml-2">
            {zeroAlerts.length > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {zeroAlerts.length} sin stock
              </span>
            )}
            {lowAlerts.length > 0 && (
              <span className="rounded-full bg-orange-400 px-2 py-0.5 text-[10px] font-bold text-white">
                {lowAlerts.length} bajo
              </span>
            )}
            {warningAlerts.length > 0 && (
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-white">
                {warningAlerts.length} alerta
              </span>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-red-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-red-500" />
        )}
      </button>

      {expanded && (
        <>
          {/* Filter tabs */}
          <div className="flex gap-1 px-4 pt-3 pb-1">
            {([['all', 'Todos', alerts.length], ['zero', 'Sin stock', zeroAlerts.length], ['low', 'Bajo', lowAlerts.length]] as const).map(
              ([key, label, count]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    filter === key
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {label} {count > 0 && <span className="opacity-70">({count})</span>}
                </button>
              )
            )}
          </div>

          {/* Alert list */}
          <div className="max-h-80 overflow-y-auto px-4 pb-4 space-y-2 mt-2">
            {displayed.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-4">No hay alertas en esta categoría</p>
            ) : (
              displayed.map((alert) => (
                <AlertItem key={`${alert.product_id}-${alert.location_id}`} alert={alert} showActions={showActions} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

function AlertItem({ alert, showActions }: { alert: AlertRow; showActions: boolean }) {
  const isZero = alert.stock_status === 'zero'
  const isLow = alert.stock_status === 'low'

  const pct =
    alert.effective_min_stock > 0
      ? Math.min(100, (alert.current_stock / alert.effective_min_stock) * 100)
      : alert.current_stock > 0 ? 100 : 0

  return (
    <div
      className={cn(
        'rounded-xl border p-3 transition-all',
        isZero
          ? 'border-red-200 bg-red-50'
          : isLow
          ? 'border-orange-200 bg-orange-50'
          : 'border-amber-200 bg-amber-50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {isZero ? (
              <Package className="h-3.5 w-3.5 shrink-0 text-red-500" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-orange-500" />
            )}
            <span className="truncate text-sm font-medium text-slate-800">{alert.product_name}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="font-mono text-xs text-slate-500">{alert.sku}</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">{alert.location_name}</span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p
            className={cn(
              'font-bold text-base leading-none',
              isZero ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-amber-600'
            )}
          >
            {formatQuantity(alert.current_stock)}
            <span className="ml-1 text-xs font-normal text-slate-400">{alert.unit_symbol}</span>
          </p>
          <p className="text-[10px] text-slate-400">
            mín {formatQuantity(alert.effective_min_stock)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1.5 rounded-full bg-white/80">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isZero ? 'bg-red-400' : isLow ? 'bg-orange-400' : 'bg-amber-400'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {showActions && (
        <div className="mt-2 flex gap-2">
          <Link
            href={`/purchases/new?product_id=${alert.product_id}&location_id=${alert.location_id}`}
            className={cn(
              'flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
              isZero
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            )}
          >
            <ShoppingCart className="h-3 w-3" />
            Comprar
          </Link>
        </div>
      )}
    </div>
  )
}
