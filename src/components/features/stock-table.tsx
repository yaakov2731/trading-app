'use client'

import * as React from 'react'
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Package, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Input } from '@/components/ui/input'
import { StockStatusBadge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty, TableSkeleton } from '@/components/ui/table'
import { formatQuantity, formatCurrency, formatTimeAgo } from '@/lib/utils/format'
import type { CurrentStockRow, StockStatus } from '@/lib/types'

// =============================================================================
// Stock Table — main inventory view per location
// =============================================================================

type SortField = 'product_name' | 'sku' | 'current_stock' | 'stock_value' | 'last_movement_at' | 'category_name'
type SortDir   = 'asc' | 'desc'

interface StockTableProps {
  items:      CurrentStockRow[]
  loading?:   boolean
  onRowClick?: (item: CurrentStockRow) => void
  className?: string
}

export function StockTable({ items, loading, onRowClick, className }: StockTableProps) {
  const [query,      setQuery]      = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<StockStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all')
  const [sortField,  setSortField]  = React.useState<SortField>('product_name')
  const [sortDir,    setSortDir]    = React.useState<SortDir>('asc')

  // Unique categories from data
  const categories = React.useMemo(() => {
    const seen = new Map<string, string>()
    items.forEach(i => seen.set(i.category_id, i.category_name))
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [items])

  // Filtered + sorted items
  const filtered = React.useMemo(() => {
    let result = items

    // Text search
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(i =>
        i.product_name.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        i.category_name.toLowerCase().includes(q)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(i => i.stock_status === statusFilter)
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(i => i.category_id === categoryFilter)
    }

    // Sort
    return [...result].sort((a, b) => {
      let va: string | number = a[sortField] as string | number
      let vb: string | number = b[sortField] as string | number
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
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={13} className="opacity-30" />
    return sortDir === 'asc'
      ? <ArrowUp size={13} className="text-brand-600" />
      : <ArrowDown size={13} className="text-brand-600" />
  }

  // Stats
  const stats = React.useMemo(() => ({
    total:   items.length,
    low:     items.filter(i => i.stock_status === 'low' || i.stock_status === 'zero').length,
    zero:    items.filter(i => i.stock_status === 'zero').length,
    value:   items.reduce((sum, i) => sum + (i.stock_value ?? 0), 0),
  }), [items])

  return (
    <div className={cn('space-y-4', className)}>
      {/* ── Summary strip ─────────────────────────────────────────────────── */}
      {!loading && (
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Productos',    value: stats.total, color: 'text-slate-700' },
            { label: 'Sin stock',    value: stats.zero,  color: 'text-danger-600', hide: stats.zero === 0 },
            { label: 'Stock bajo',   value: stats.low,   color: 'text-amber-600',  hide: stats.low === 0 },
            { label: 'Valor total',  value: formatCurrency(stats.value), color: 'text-slate-700' },
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
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nombre, SKU..."
            className="pl-9 h-9"
          />
        </div>

        {/* Status quick-filter pills */}
        <div className="flex gap-1.5">
          {(['all', 'ok', 'warning', 'low', 'zero'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 h-9 rounded-lg text-xs font-medium border transition-all duration-150',
                statusFilter === s
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
              )}
            >
              {s === 'all'     ? 'Todos' :
               s === 'ok'      ? 'Normal' :
               s === 'warning' ? 'Bajo' :
               s === 'low'     ? 'Crítico' :
               'Sin stock'}
            </button>
          ))}
        </div>

        {/* Category filter */}
        {categories.length > 1 && (
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="all">Todas las categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="border-0">
              <TableHead className="rounded-tl-xl">
                <button
                  className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
                  onClick={() => handleSort('product_name')}
                >
                  Producto <SortIcon field="product_name" />
                </button>
              </TableHead>
              <TableHead>
                <button className="flex items-center gap-1.5 hover:text-slate-900 transition-colors" onClick={() => handleSort('sku')}>
                  SKU <SortIcon field="sku" />
                </button>
              </TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">
                <button className="flex items-center gap-1.5 hover:text-slate-900 transition-colors ml-auto" onClick={() => handleSort('current_stock')}>
                  Stock <SortIcon field="current_stock" />
                </button>
              </TableHead>
              <TableHead className="text-right">Estado</TableHead>
              <TableHead className="text-right hidden lg:table-cell">
                <button className="flex items-center gap-1.5 hover:text-slate-900 transition-colors ml-auto" onClick={() => handleSort('stock_value')}>
                  Valor <SortIcon field="stock_value" />
                </button>
              </TableHead>
              <TableHead className="text-right hidden xl:table-cell">Último mov.</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableSkeleton rows={8} cols={7} />
            ) : filtered.length === 0 ? (
              <TableEmpty
                icon={<Package size={28} />}
                title="Sin resultados"
                description="Intenta cambiar los filtros de búsqueda"
                colSpan={7}
              />
            ) : (
              filtered.map(item => (
                <TableRow
                  key={`${item.product_id}-${item.location_id}`}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    onRowClick && 'cursor-pointer',
                    item.stock_status === 'zero' && 'bg-danger-50/30',
                    item.stock_status === 'low'  && 'bg-amber-50/20',
                  )}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      {(item.stock_status === 'low' || item.stock_status === 'zero') && (
                        <AlertTriangle size={14} className={cn(
                          'flex-shrink-0',
                          item.stock_status === 'zero' ? 'text-danger-500' : 'text-amber-500'
                        )} />
                      )}
                      <p className="font-medium text-slate-900 text-sm">{item.product_name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-slate-500">{item.sku}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-500">{item.category_name}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      'font-semibold tabular-nums text-sm',
                      item.stock_status === 'zero' ? 'text-danger-600' :
                      item.stock_status === 'low'  ? 'text-amber-600' : 'text-slate-900'
                    )}>
                      {formatQuantity(item.current_stock)} {item.unit_symbol}
                    </span>
                    {item.min_stock > 0 && (
                      <p className="text-xs text-slate-400">mín. {formatQuantity(item.min_stock)}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <StockStatusBadge status={item.stock_status as any} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm hidden lg:table-cell">
                    {item.cost_price ? formatCurrency(item.stock_value) : '—'}
                  </TableCell>
                  <TableCell className="text-right text-xs text-slate-400 hidden xl:table-cell">
                    {item.last_movement_at ? formatTimeAgo(item.last_movement_at) : 'Sin mov.'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Result count ─────────────────────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-400 text-right">
          Mostrando {filtered.length} de {items.length} productos
        </p>
      )}
    </div>
  )
}
