'use client'

import * as React from 'react'
import Link from 'next/link'
import { AlertTriangle, Package, MapPin, ShoppingCart, ArrowRight, RefreshCcw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge, StockStatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatQuantity } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

// =============================================================================
// Low Stock Alert List
// =============================================================================

export interface LowStockAlert {
  product_id:    string
  product_name:  string
  sku:           string
  category_name?: string
  category_color?: string
  location_id:   string
  location_name: string
  location_color?: string
  current_stock: number
  min_stock:     number
  unit_symbol?:  string
  stock_status:  'zero' | 'low' | 'warning'
  last_movement_at?: string | null
}

interface LowStockListProps {
  alerts:     LowStockAlert[]
  onRefresh?: () => void
  isLoading?: boolean
  compact?:   boolean
}

const STATUS_CONFIG = {
  zero: {
    label:     'Sin Stock',
    icon:      <AlertTriangle size={15} className="text-danger-500" />,
    iconBg:    'bg-danger-50',
    iconColor: 'text-danger-500',
    badge:     'danger' as const,
    border:    'border-danger-100',
    bg:        'bg-danger-50/30',
  },
  low: {
    label:     'Crítico',
    icon:      <AlertTriangle size={15} className="text-danger-400" />,
    iconBg:    'bg-danger-50',
    iconColor: 'text-danger-400',
    badge:     'danger' as const,
    border:    'border-danger-100',
    bg:        'bg-danger-50/20',
  },
  warning: {
    label:     'Bajo',
    icon:      <AlertTriangle size={15} className="text-amber-500" />,
    iconBg:    'bg-amber-50',
    iconColor: 'text-amber-500',
    badge:     'warning' as const,
    border:    'border-amber-100',
    bg:        'bg-amber-50/20',
  },
}

export function LowStockList({ alerts, onRefresh, isLoading = false, compact = false }: LowStockListProps) {
  const zeroItems    = alerts.filter(a => a.stock_status === 'zero')
  const lowItems     = alerts.filter(a => a.stock_status === 'low')
  const warningItems = alerts.filter(a => a.stock_status === 'warning')

  if (!alerts.length && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-14 w-14 rounded-2xl bg-success-50 flex items-center justify-center mb-4">
          <Package size={24} className="text-success-500" />
        </div>
        <p className="text-base font-semibold text-slate-800">Sin alertas activas</p>
        <p className="text-sm text-slate-400 mt-1">Todo el stock está en niveles normales</p>
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RefreshCcw size={13} />}
            onClick={onRefresh}
            className="mt-4"
          >
            Actualizar
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* ── Section header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center">
            <AlertTriangle size={16} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Alertas de Stock</h2>
            <p className="text-xs text-slate-400">{alerts.length} producto{alerts.length !== 1 ? 's' : ''} requieren atención</p>
          </div>
        </div>
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRefresh}
            className={cn('text-slate-400', isLoading && 'animate-spin')}
          >
            <RefreshCcw size={14} />
          </Button>
        )}
      </div>

      {/* ── Alert sections ───────────────────────────────────────────────── */}
      {[
        { items: zeroItems,    label: 'Sin Stock',     key: 'zero'    as const },
        { items: lowItems,     label: 'Stock Crítico', key: 'low'     as const },
        { items: warningItems, label: 'Stock Bajo',    key: 'warning' as const },
      ].map(({ items, label, key }) => {
        if (!items.length) return null
        const cfg = STATUS_CONFIG[key]

        return (
          <div key={key}>
            <div className="flex items-center gap-2 mb-3">
              {cfg.icon}
              <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
              <span className="text-xs text-slate-400 font-medium">({items.length})</span>
            </div>

            {compact ? (
              // ── Compact list view ──────────────────────────────────────
              <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-50 bg-white">
                {items.map(alert => (
                  <CompactAlertRow key={`${alert.product_id}-${alert.location_id}`} alert={alert} />
                ))}
              </div>
            ) : (
              // ── Card grid view ─────────────────────────────────────────
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {items.map(alert => (
                  <AlertCard
                    key={`${alert.product_id}-${alert.location_id}`}
                    alert={alert}
                    config={cfg}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// =============================================================================
// Card view variant
// =============================================================================

function AlertCard({
  alert,
  config,
}: {
  alert:  LowStockAlert
  config: typeof STATUS_CONFIG['zero']
}) {
  const pct = alert.min_stock > 0
    ? Math.min(100, (alert.current_stock / alert.min_stock) * 100)
    : alert.current_stock > 0 ? 100 : 0

  return (
    <Card padding="md" className={cn('border', config.border)}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0', config.iconBg)}>
          <Package size={16} className={config.iconColor} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 truncate">{alert.product_name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-mono text-xs text-slate-400">{alert.sku}</span>
            {alert.category_name && (
              <>
                <span className="text-slate-200">·</span>
                <span className="text-xs text-slate-400">{alert.category_name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 mt-3">
        {alert.location_color && (
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: alert.location_color }} />
        )}
        <MapPin size={11} className="text-slate-400" />
        <p className="text-xs text-slate-500 truncate">{alert.location_name}</p>
      </div>

      {/* Stock numbers */}
      <div className="mt-3">
        <div className="flex items-end justify-between mb-1.5">
          <div>
            <p className="text-xs text-slate-400">Actual</p>
            <p className={cn(
              'text-xl font-bold tabular-nums leading-none',
              alert.stock_status === 'zero'    ? 'text-danger-600' :
              alert.stock_status === 'low'     ? 'text-danger-500' :
              'text-amber-600'
            )}>
              {formatQuantity(alert.current_stock)}
              {alert.unit_symbol && (
                <span className="text-xs font-normal ml-1 text-slate-400">{alert.unit_symbol}</span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Mínimo</p>
            <p className="text-sm font-semibold text-slate-600 tabular-nums">
              {formatQuantity(alert.min_stock)} {alert.unit_symbol}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              alert.stock_status === 'zero'    ? 'bg-danger-500' :
              alert.stock_status === 'low'     ? 'bg-danger-400' :
              'bg-amber-400'
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
        <Link
          href={`/purchases/new?product=${alert.product_id}&location=${alert.location_id}`}
          className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold transition-colors"
        >
          <ShoppingCart size={12} />
          Comprar
        </Link>
        <Link
          href={`/stock?location=${alert.location_id}`}
          className="h-8 w-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors"
        >
          <ArrowRight size={13} />
        </Link>
      </div>
    </Card>
  )
}

// =============================================================================
// Compact list row variant
// =============================================================================

function CompactAlertRow({ alert }: { alert: LowStockAlert }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900 truncate">{alert.product_name}</p>
          <span className="font-mono text-xs text-slate-400 flex-shrink-0">{alert.sku}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {alert.location_color && (
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: alert.location_color }} />
          )}
          <span className="text-xs text-slate-500">{alert.location_name}</span>
        </div>
      </div>

      <div className="text-right flex-shrink-0 flex items-center gap-3">
        <div>
          <p className={cn(
            'text-sm font-bold tabular-nums',
            alert.stock_status === 'zero'    ? 'text-danger-600' :
            alert.stock_status === 'low'     ? 'text-danger-500' :
            'text-amber-600'
          )}>
            {formatQuantity(alert.current_stock)} {alert.unit_symbol}
          </p>
          <p className="text-xs text-slate-400 tabular-nums">
            mín. {formatQuantity(alert.min_stock)}
          </p>
        </div>
        <StockStatusBadge status={alert.stock_status} size="sm" />
        <Link
          href={`/purchases/new?product=${alert.product_id}&location=${alert.location_id}`}
          className="h-7 w-7 rounded-lg bg-brand-50 hover:bg-brand-100 flex items-center justify-center text-brand-600 transition-colors"
          title="Registrar compra"
        >
          <ShoppingCart size={12} />
        </Link>
      </div>
    </div>
  )
}
