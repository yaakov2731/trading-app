'use client'

import * as React from 'react'
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Package } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Input } from '@/components/ui/input'
import { StockStatusBadge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty, TableSkeleton,
} from '@/components/ui/table'
import { formatQuantity, formatCurrency, formatTimeAgo } from '@/lib/utils/format'
import type { CurrentStockRow, StockStatus } from '@/lib/types'

// =============================================================================
// Stock Table — professional inventory view per location
// =============================================================================

type SortField = 'product_name' | 'sku' | 'current_stock' | 'stock_value' | 'last_movement_at' | 'category_name'
type SortDir   = 'asc' | 'desc'

interface StockTableProps {
  items:        CurrentStockRow[]
  loading?:     boolean
  onRowClick?:  (item: CurrentStockRow) => void
  hideSummary?: boolean
  className?:   string
}

// ── Stock level progress bar ──────────────────────────────────────────────────

function StockBar({ item }: { item: CurrentStockRow }) {
  if (item.min_stock <= 0) return null

  // Scale: at min_stock → ~33%, at min_stock×3 → 100%
  const pct = Math.min(item.current_stock / (item.min_stock * 3), 1) * 100
  const safePct = item.current_stock > 0 ? Math.max(pct, 3) : 0

  const barColor =
    item.stock_status === 'zero'    ? 'bg-danger-500' :
    item.stock_status === 'low'     ? 'bg-danger-400' :
    item.stock_status === 'warning' ? 'bg-amber-400'  :
    'bg-success-500'

  return (
    <div className="mt-1.5 h-[3px] w-full rounded-full bg-slate-100 overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all duration-500', barColor)}
        style={{ width: `${safePct}%` }}
      />
    </div>
  )
}

// ── Category color dot ────────────────────────────────────────────────────────

function CategoryDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: color || '#94a3b8' }}
    />
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function StockTable({ items, loading, onRowClick, hideSummary, className }: StockTableProps) {
  const [query,          setQuery]          = React.useState('')
  const [statusFilter,   setStatusFilter]   = React.useState<StockStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all')
  const [sortField,      setSortField]      = React.useState<SortField>('product_name')
  const [sortDir,        setSortDir]        = React.useState<SortDir>('asc')

  // Unique categories from data
  const categories = React.useMemo(() => {
    const seen = new Map<string, { name: string; color: string }>()
    items.forEach(i => seen.set(i.category_id, { name: i.category_name, color: i.category_color }))
    return Array.from(seen.entries()).map(([id, v]) => ({ id, ...v }))
  }, [items])

  // Filtered + sorted items
  const filtered = React.useMemo(() => {
    let result = items

    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(i =>
        i.product_name.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        i.category_name.toLowerCase().includes(q)
      )
    }

    if (statusFilter !== 'all') {
      result = result.filter(i => i.stock_status === statusFilter)
    }

    if (categoryFilter !== 'all') {
      result = result.filter(i => i.category_id === categoryFilter)
    }

    return [...result].sort((a, b) => {
      let va: string | number = (a as unknown as Record<string, unknown>)[sortField] as string | number
      let vb: string | number = (b as unknown as Record<string, unknown>)[sortField] as string | number
      if (va == null) va = ''
      if (vb == null) vb = ''
      const cmp = typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [items, query, statusFilter, categoryFilter, sortField, sortDir])

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d: SortDir) => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown size={12} className="opacity-25" />
    return sortDir === 'asc'
      ? <ArrowUp size={12} className="text-brand-500" />
      : <ArrowDown size={12} className="text-brand-500" />
  }

  // Stats (used only when hideSummary is false)
  const stats = React.useMemo(() => ({
    total: items.length,
    low:   items.filter(i => i.stock_status === 'low' || i.stock_status === 'zero').length,
    zero:  items.filter(i => i.stock_status === 'zero').length,
    value: items.reduce((sum, i) => sum + (i.stock_value ?? 0), 0),
  }), [items])

  const statusOptions = [
    { key: 'all'     as const, label: 'Todos'     },
    { key: 'ok'      as const, label: 'Normal'    },
    { key: 'warning' as const, label: 'Bajo'      },
    { key: 'low'     as const, label: 'Crítico'   },
    { key: 'zero'    as const, label: 'Sin stock' },
  ]

  return (
    <div className={cn('space-y-4', className)}>

      {/* ── Summary strip ─────────────────────────────────────────────────── */}
      {!loading && !hideSummary && (
        <div className="flex flex-wrap gap-4">
          {[
            { label: 'Productos',   value: stats.total,                 color: 'text-slate-700' },
            { label: 'Sin stock',   value: stats.zero,                  color: 'text-danger-600', hide: stats.zero === 0 },
            { label: 'Stock bajo',  value: stats.low,                   color: 'text-amber-600',  hide: stats.low === 0  },
            { label: 'Valor total', value: formatCurrency(stats.value), color: 'text-slate-700'  },
          ].filter(s => !s.hide).map(s => (
            <div key={s.label} className="flex items-baseline gap-1.5">
              <span className={cn('text-xl font-bold tabular-nums', s.color)}>{s.value}</span>
              <span className="text-xs text-slate-400">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters bar ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            placeholder="Buscar producto, SKU..."
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Status pills */}
        <div className="flex gap-1">
          {statusOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => setStatusFilter(opt.key)}
              className={cn(
                'px-3 h-9 rounded-xl text-xs font-semibold border transition-all duration-150',
                statusFilter === opt.key
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-800',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Category filter */}
        {categories.length > 1 && (
          <select
            value={categoryFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-colors"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((c: { id: string; name: string; color: string }) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-card">
        <Table>
          <TableHeader>
            <TableRow className="border-0 bg-slate-50/80">
              <TableHead className="pl-5">
                <button
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  onClick={() => handleSort('product_name')}
                >
                  Producto <SortIcon field="product_name" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  onClick={() => handleSort('category_name')}
                >
                  Categoría <SortIcon field="category_name" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors ml-auto"
                  onClick={() => handleSort('current_stock')}
                >
                  Stock <SortIcon field="current_stock" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <span className="text-xs font-semibold text-slate-500">Estado</span>
              </TableHead>
              <TableHead className="text-right hidden lg:table-cell">
                <button
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors ml-auto"
                  onClick={() => handleSort('stock_value')}
                >
                  Valor <SortIcon field="stock_value" />
                </button>
              </TableHead>
              <TableHead className="text-right hidden xl:table-cell pr-5">
                <span className="text-xs font-semibold text-slate-500">Último mov.</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableSkeleton rows={8} cols={6} />
            ) : filtered.length === 0 ? (
              <TableEmpty
                icon={<Package size={28} />}
                title="Sin resultados"
                description="Intenta cambiar los filtros de búsqueda"
                colSpan={6}
              />
            ) : (
              filtered.map((item: CurrentStockRow) => (
                <TableRow
                  key={`${item.product_id}-${item.location_id}`}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    'group border-slate-100 transition-colors duration-100',
                    onRowClick && 'cursor-pointer',
                    item.stock_status === 'zero' ? 'bg-danger-50/20 hover:bg-danger-50/40' :
                    item.stock_status === 'low'  ? 'bg-amber-50/15 hover:bg-amber-50/30'  :
                    'hover:bg-slate-50/70',
                  )}
                >
                  {/* Product name + SKU */}
                  <TableCell className="pl-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-[3px] h-8 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.category_color || '#cbd5e1', opacity: 0.65 }}
                      />
                      <div>
                        <p className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-brand-700 transition-colors">
                          {item.product_name}
                        </p>
                        <p className="font-mono text-[11px] text-slate-400 leading-none mt-0.5">
                          {item.sku}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-1.5">
                      <CategoryDot color={item.category_color} />
                      <span className="text-xs text-slate-500">{item.category_name}</span>
                    </div>
                  </TableCell>

                  {/* Stock level + mini progress bar */}
                  <TableCell className="text-right py-3.5">
                    <div className="inline-flex flex-col items-end">
                      <span className={cn(
                        'font-bold tabular-nums text-sm leading-none',
                        item.stock_status === 'zero'    ? 'text-danger-600' :
                        item.stock_status === 'low'     ? 'text-danger-500' :
                        item.stock_status === 'warning' ? 'text-amber-600'  :
                        'text-slate-900',
                      )}>
                        {formatQuantity(item.current_stock)}{' '}
                        <span className="font-normal text-slate-400 text-[11px]">{item.unit_symbol}</span>
                      </span>
                      {item.min_stock > 0 && (
                        <span className="text-[10px] text-slate-400 leading-none mt-0.5">
                          mín.&nbsp;{formatQuantity(item.min_stock)}
                        </span>
                      )}
                      <div className="w-20">
                        <StockBar item={item} />
                      </div>
                    </div>
                  </TableCell>

                  {/* Status badge */}
                  <TableCell className="text-right py-3.5">
                    <StockStatusBadge status={item.stock_status as StockStatus} />
                  </TableCell>

                  {/* Value */}
                  <TableCell className="text-right tabular-nums text-sm text-slate-600 hidden lg:table-cell py-3.5">
                    {item.cost_price ? formatCurrency(item.stock_value) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </TableCell>

                  {/* Last movement */}
                  <TableCell className="text-right text-xs text-slate-400 hidden xl:table-cell py-3.5 pr-5">
                    {item.last_movement_at ? formatTimeAgo(item.last_movement_at) : (
                      <span className="text-slate-300">Sin mov.</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Footer count ──────────────────────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-400 text-right">
          {filtered.length === items.length
            ? `${items.length} productos`
            : `${filtered.length} de ${items.length} productos`
          }
        </p>
      )}
    </div>
  )
}
