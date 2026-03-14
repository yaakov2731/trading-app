'use client'

import * as React from 'react'
import {
  Boxes, TrendingUp, AlertTriangle, ArrowLeftRight, ClipboardList,
  ShoppingCart, Zap, Package, ArrowRight, TrendingDown, BarChart2
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Card, StatCard } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge, StockStatusBadge, MovementTypeBadge } from '@/components/ui/badge'
import { StatCardSkeleton, ListItemSkeleton } from '@/components/ui/skeleton'
import { StockValueChart, CategoryBreakdown } from '@/components/charts/stock-chart'
import { formatCurrency, formatQuantity, formatTimeAgo } from '@/lib/utils/format'
import type { CurrentStockRow, MovementHistoryRow } from '@/lib/types'
import Link from 'next/link'

// =============================================================================
// Dashboard — multi-location overview with alerts, KPIs, charts
// =============================================================================

interface DashboardClientProps {
  locations:       any[]
  allStock:        CurrentStockRow[]
  recentMovements: MovementHistoryRow[]
  alerts:          CurrentStockRow[]
}

export function DashboardClient({ locations, allStock, recentMovements, alerts }: DashboardClientProps) {
  const [selectedLocation, setSelectedLocation] = React.useState<string>('all')
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => { setMounted(true) }, [])

  const filteredStock = selectedLocation === 'all'
    ? allStock
    : allStock.filter(s => s.location_id === selectedLocation)

  // ── Global KPIs ────────────────────────────────────────────────────────────
  const stats = React.useMemo(() => {
    const stock = filteredStock
    return {
      totalProducts: new Set(stock.map(s => s.product_id)).size,
      totalValue:    stock.reduce((sum, s) => sum + (s.stock_value ?? 0), 0),
      zeroStock:     stock.filter(s => s.stock_status === 'zero').length,
      lowStock:      stock.filter(s => s.stock_status === 'low' || s.stock_status === 'warning').length,
      alertCount:    alerts.length,
    }
  }, [filteredStock, alerts])

  // ── Per-location chart data ────────────────────────────────────────────────
  const locationChartData = React.useMemo(() =>
    locations.map(loc => {
      const locStock = allStock.filter(s => s.location_id === loc.id)
      return {
        name:      loc.name,
        shortName: loc.short_name ?? loc.name.split(' ')[0],
        value:     locStock.reduce((sum, s) => sum + (s.stock_value ?? 0), 0),
        products:  new Set(locStock.map(s => s.product_id)).size,
        color:     loc.color ?? '#3b82f6',
      }
    })
  , [locations, allStock])

  // ── Per-category breakdown ─────────────────────────────────────────────────
  const categoryData = React.useMemo(() => {
    const map = new Map<string, { name: string; prefix: string; value: number; color: string }>()
    filteredStock.forEach(s => {
      if (!s.category_id) return
      const existing = map.get(s.category_id)
      if (existing) {
        existing.value += s.stock_value ?? 0
      } else {
        map.set(s.category_id, {
          name:   s.category_name ?? '—',
          prefix: s.category_prefix ?? '—',
          value:  s.stock_value ?? 0,
          color:  s.category_color ?? '#94a3b8',
        })
      }
    })
    return Array.from(map.values())
  }, [filteredStock])

  return (
    <div className="space-y-6">
      {/* ── Location filter tabs ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setSelectedLocation('all')}
          className={cn(
            'flex-shrink-0 px-4 py-1.5 rounded-xl text-sm font-semibold border transition-all duration-150',
            selectedLocation === 'all'
              ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800'
          )}
        >
          Todos los locales
        </button>
        {locations.map(loc => (
          <button
            key={loc.id}
            onClick={() => setSelectedLocation(loc.id)}
            className={cn(
              'flex-shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-semibold border transition-all duration-150',
              selectedLocation === loc.id
                ? 'text-white border-transparent shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            )}
            style={selectedLocation === loc.id
              ? { backgroundColor: loc.color, borderColor: loc.color }
              : {}
            }
          >
            <span
              className="h-2 w-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: selectedLocation === loc.id ? 'rgba(255,255,255,0.7)' : loc.color }}
            />
            {loc.short_name ?? loc.name}
          </button>
        ))}
      </div>

      {/* ── KPI grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {!mounted ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Productos activos"
              value={stats.totalProducts.toLocaleString('es-AR')}
              icon={<Boxes size={20} />}
              iconColor="bg-brand-50 text-brand-600"
            />
            <StatCard
              label="Valor de inventario"
              value={formatCurrency(stats.totalValue)}
              icon={<TrendingUp size={20} />}
              iconColor="bg-success-50 text-success-600"
            />
            <StatCard
              label="Sin stock"
              value={stats.zeroStock}
              icon={<TrendingDown size={20} />}
              iconColor={stats.zeroStock > 0 ? 'bg-danger-50 text-danger-600' : 'bg-slate-100 text-slate-400'}
              change={stats.zeroStock > 0 ? '⚠ Requiere atención' : 'Todo normal'}
              changeType={stats.zeroStock > 0 ? 'negative' : 'positive'}
            />
            <StatCard
              label="Alertas activas"
              value={stats.alertCount}
              icon={<AlertTriangle size={20} />}
              iconColor={stats.alertCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}
              change={stats.lowStock > 0 ? `${stats.lowStock} críticos` : undefined}
              changeType="negative"
            />
          </>
        )}
      </div>

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Acciones Rápidas</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/movements?type=consumption_out', label: 'Registrar consumo',  icon: <Zap size={20} />,            color: 'bg-amber-50 text-amber-700   border-amber-200 hover:bg-amber-100' },
            { href: '/purchases/new',                  label: 'Nueva compra',        icon: <ShoppingCart size={20} />,   color: 'bg-success-50 text-success-700 border-success-200 hover:bg-success-100' },
            { href: '/transfers/new',                  label: 'Transferencia',       icon: <ArrowLeftRight size={20} />, color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
            { href: '/physical-count/new',             label: 'Conteo físico',       icon: <ClipboardList size={20} />,  color: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100' },
          ].map(action => (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                'flex flex-col items-center gap-2.5 rounded-xl border p-4 text-center',
                'transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
                action.color
              )}
            >
              {action.icon}
              <span className="text-xs font-semibold leading-tight">{action.label}</span>
            </Link>
          ))}
        </div>
      </Card>

      {/* ── Charts row ────────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Stock value by location bar chart */}
        <Card padding="none" className="lg:col-span-2">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <BarChart2 size={15} className="text-brand-500" />
            <h3 className="text-sm font-semibold text-slate-700">Valor de Stock por Local</h3>
          </div>
          <div className="px-4 py-4">
            {!mounted ? (
              <div className="h-[220px] flex flex-col gap-3 justify-end pb-6">
                {[80, 55, 70, 45, 60, 40].map((h, i) => (
                  <div key={i} className="skeleton rounded-t-md" style={{ height: `${h}%`, width: `${100 / 6}%` }} />
                ))}
              </div>
            ) : (
              <StockValueChart data={locationChartData} />
            )}
          </div>
        </Card>

        {/* Category breakdown */}
        <Card padding="none">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">Por Categoría</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedLocation === 'all' ? 'Todos los locales' : locations.find(l => l.id === selectedLocation)?.name}
            </p>
          </div>
          <div className="px-5 py-4">
            {!mounted ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="skeleton h-2.5 w-2.5 rounded-full flex-shrink-0" />
                    <div className="skeleton flex-1 h-3 rounded" />
                    <div className="skeleton w-10 h-3 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <CategoryBreakdown data={categoryData} />
            )}
          </div>
        </Card>
      </div>

      {/* ── Location cards + Alerts + Recent ─────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Location cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Stock por Local</h3>
            <Link href="/stock" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              Ver todo <ArrowRight size={12} />
            </Link>
          </div>

          {!mounted ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="card-surface p-4 flex items-center gap-4">
                  <div className="skeleton h-10 w-10 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3.5 w-36 rounded" />
                    <div className="skeleton h-3 w-20 rounded" />
                  </div>
                  <div className="text-right space-y-1.5">
                    <div className="skeleton h-3.5 w-24 rounded" />
                    <div className="skeleton h-3 w-16 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {locations.map(loc => {
                const locStock  = allStock.filter(s => s.location_id === loc.id)
                const locValue  = locStock.reduce((sum, s) => sum + (s.stock_value ?? 0), 0)
                const locLow    = locStock.filter(s => s.stock_status === 'low' || s.stock_status === 'zero').length
                const locTotal  = new Set(locStock.map(s => s.product_id)).size

                return (
                  <Card key={loc.id} variant="interactive" padding="md">
                    <Link href={`/stock?location=${loc.id}`} className="flex items-center gap-4">
                      <div
                        className="h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: loc.color + '20' }}
                      >
                        <div className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: loc.color }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900">{loc.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{locTotal} productos</p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(locValue)}</p>
                        {locLow > 0 ? (
                          <p className="text-xs text-danger-600 font-medium mt-0.5">{locLow} alertas</p>
                        ) : (
                          <p className="text-xs text-success-600 font-medium mt-0.5">Sin alertas</p>
                        )}
                      </div>

                      <ArrowRight size={16} className="text-slate-300 ml-1 flex-shrink-0" />
                    </Link>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column — alerts + recent movements */}
        <div className="space-y-4">
          {/* Critical alerts */}
          {alerts.length > 0 && (
            <Card padding="none">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} className="text-amber-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Alertas de Stock</h3>
                </div>
                <Badge variant="warning" size="sm">{alerts.length}</Badge>
              </div>
              <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                {alerts.slice(0, 8).map(alert => (
                  <div
                    key={`${alert.product_id}-${alert.location_id}`}
                    className="px-5 py-3 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{alert.product_name}</p>
                      <p className="text-xs text-slate-400 truncate">{alert.location_name}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold tabular-nums text-slate-900">
                        {formatQuantity(alert.current_stock)} {alert.unit_symbol}
                      </p>
                      <StockStatusBadge status={alert.stock_status as any} size="sm" showDot={false} />
                    </div>
                  </div>
                ))}
              </div>
              {alerts.length > 8 && (
                <div className="px-5 py-3 border-t border-slate-100">
                  <Link href="/alerts" className="text-xs text-brand-600 font-medium hover:text-brand-700">
                    Ver {alerts.length - 8} más →
                  </Link>
                </div>
              )}
            </Card>
          )}

          {/* Recent movements */}
          <Card padding="none">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Movimientos Recientes</h3>
              <Link href="/history" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                Ver todo
              </Link>
            </div>
            {!mounted ? (
              <ListItemSkeleton count={5} />
            ) : (
              <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                {recentMovements.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-400">
                    Sin movimientos recientes
                  </div>
                ) : (
                  recentMovements.slice(0, 8).map(mv => (
                    <div key={mv.id} className="px-5 py-3 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{mv.product_name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <MovementTypeBadge type={mv.movement_type as any} size="sm" />
                          <span className="text-xs text-slate-400">{mv.location_name}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={cn(
                          'text-sm font-bold tabular-nums',
                          mv.quantity > 0 ? 'text-success-600' : 'text-danger-600'
                        )}>
                          {mv.quantity > 0 ? '+' : ''}{formatQuantity(mv.quantity)} {mv.unit_symbol}
                        </p>
                        <p className="text-xs text-slate-400">{formatTimeAgo(mv.performed_at)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
