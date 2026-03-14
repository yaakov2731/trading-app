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
import { Badge, StockStatusBadge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { formatQuantity, formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import {
  Search, Package, ChevronUp, ChevronDown, ChevronsUpDown,
  MoreHorizontal, Pencil, PowerOff, Eye
} from 'lucide-react'
import type { Product, Category, StockStatus } from '@/lib/types'

// =============================================================================
// Premium Products Table with sorting / filtering
// =============================================================================

export interface ProductWithStock extends Product {
  current_stock?: number
  stock_status?:  StockStatus
  location_name?: string
}

type SortKey    = 'name' | 'sku' | 'category' | 'stock' | 'min_stock'
type SortDir    = 'asc' | 'desc'
type StatusFilter = '' | 'ok' | 'warning' | 'low' | 'zero'

interface ProductsTableProps {
  products:      ProductWithStock[]
  categories?:   Category[]
  isLoading?:    boolean
  showStock?:    boolean
  onEdit?:       (product: ProductWithStock) => void
  onDeactivate?: (product: ProductWithStock) => void
  onView?:       (product: ProductWithStock) => void
  className?:    string
}

export function ProductsTable({
  products,
  categories = [],
  isLoading   = false,
  showStock   = true,
  onEdit,
  onDeactivate,
  onView,
  className,
}: ProductsTableProps) {
  // ── Local state ────────────────────────────────────────────────────────────
  const [search,     setSearch]     = React.useState('')
  const [categoryId, setCategoryId] = React.useState('')
  const [status,     setStatus]     = React.useState<StatusFilter>('')
  const [sortKey,    setSortKey]    = React.useState<SortKey>('name')
  const [sortDir,    setSortDir]    = React.useState<SortDir>('asc')
  const [openMenu,   setOpenMenu]   = React.useState<string | null>(null)

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = React.useMemo(() => {
    let list = products

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode ?? '').toLowerCase().includes(q) ||
        (p.category?.name ?? '').toLowerCase().includes(q)
      )
    }

    if (categoryId) list = list.filter(p => p.category_id === categoryId)
    if (status)     list = list.filter(p => (p.stock_status ?? 'ok') === status)

    return list
  }, [products, search, categoryId, status])

  // ── Sorting ────────────────────────────────────────────────────────────────
  const sorted = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      let va: any, vb: any
      switch (sortKey) {
        case 'name':      va = a.name;                      vb = b.name; break
        case 'sku':       va = a.sku;                       vb = b.sku; break
        case 'category':  va = a.category?.name ?? '';      vb = b.category?.name ?? ''; break
        case 'stock':     va = a.current_stock ?? 0;        vb = b.current_stock ?? 0; break
        case 'min_stock': va = a.min_stock ?? 0;            vb = b.min_stock ?? 0; break
        default:          va = a.name; vb = b.name
      }
      if (typeof va === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb, 'es') : vb.localeCompare(va, 'es')
      }
      return sortDir === 'asc' ? va - vb : vb - va
    })
  }, [filtered, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronsUpDown size={12} className="text-slate-300" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-brand-500" />
      : <ChevronDown size={12} className="text-brand-500" />
  }

  // ── Close action menu on outside click ────────────────────────────────────
  React.useEffect(() => {
    function handler() { setOpenMenu(null) }
    if (openMenu) document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [openMenu])

  return (
    <div className={cn('space-y-3', className)}>
      {/* ── Filters bar ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, SKU, código..."
            className="pl-8 h-9"
          />
        </div>

        {categories.length > 0 && (
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-44 h-9">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas las categorías</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                    {c.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {showStock && (
          <Select value={status} onValueChange={v => setStatus(v as StatusFilter)}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="ok">Normal</SelectItem>
              <SelectItem value="warning">Stock Bajo</SelectItem>
              <SelectItem value="low">Crítico</SelectItem>
              <SelectItem value="zero">Sin Stock</SelectItem>
            </SelectContent>
          </Select>
        )}

        <p className="text-xs text-slate-400 ml-1">
          {sorted.length.toLocaleString('es-AR')} producto{sorted.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
        {isLoading ? (
          <Table>
            <TableHeader>
              <ProductsTableHeadRow showStock={showStock} onSort={toggleSort} SortIcon={SortIcon} />
            </TableHeader>
            <TableBody><TableSkeleton rows={8} cols={showStock ? 8 : 6} /></TableBody>
          </Table>
        ) : sorted.length === 0 ? (
          <Table>
            <TableHeader>
              <ProductsTableHeadRow showStock={showStock} onSort={toggleSort} SortIcon={SortIcon} />
            </TableHeader>
            <TableBody>
              <TableEmpty
                icon={<Package size={24} />}
                title="Sin productos"
                description={search ? `Sin resultados para "${search}"` : 'No hay productos que mostrar'}
                colSpan={showStock ? 8 : 6}
              />
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              <ProductsTableHeadRow showStock={showStock} onSort={toggleSort} SortIcon={SortIcon} />
            </TableHeader>
            <TableBody>
              {sorted.map(product => (
                <ProductTableRow
                  key={product.id}
                  product={product}
                  showStock={showStock}
                  menuOpen={openMenu === product.id}
                  onMenuToggle={e => {
                    e.stopPropagation()
                    setOpenMenu(openMenu === product.id ? null : product.id)
                  }}
                  onView={onView   ? () => { onView(product);       setOpenMenu(null) } : undefined}
                  onEdit={onEdit   ? () => { onEdit(product);       setOpenMenu(null) } : undefined}
                  onDeactivate={onDeactivate ? () => { onDeactivate(product); setOpenMenu(null) } : undefined}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

// ── Head row ──────────────────────────────────────────────────────────────────

function ProductsTableHeadRow({
  showStock,
  onSort,
  SortIcon,
}: {
  showStock: boolean
  onSort: (k: SortKey) => void
  SortIcon: React.ComponentType<{ col: SortKey }>
}) {
  return (
    <TableRow>
      <TableHead>
        <button className="flex items-center gap-1" onClick={() => onSort('sku')}>
          SKU <SortIcon col="sku" />
        </button>
      </TableHead>
      <TableHead>
        <button className="flex items-center gap-1" onClick={() => onSort('name')}>
          Producto <SortIcon col="name" />
        </button>
      </TableHead>
      <TableHead className="hidden md:table-cell">
        <button className="flex items-center gap-1" onClick={() => onSort('category')}>
          Categoría <SortIcon col="category" />
        </button>
      </TableHead>
      <TableHead className="hidden sm:table-cell">Unidad</TableHead>
      {showStock && (
        <>
          <TableHead className="text-right">
            <button className="flex items-center gap-1 ml-auto" onClick={() => onSort('stock')}>
              Stock <SortIcon col="stock" />
            </button>
          </TableHead>
          <TableHead className="text-right hidden sm:table-cell">
            <button className="flex items-center gap-1 ml-auto" onClick={() => onSort('min_stock')}>
              Mínimo <SortIcon col="min_stock" />
            </button>
          </TableHead>
          <TableHead className="hidden sm:table-cell">Estado</TableHead>
        </>
      )}
      <TableHead className="w-10" />
    </TableRow>
  )
}

// ── Body row ──────────────────────────────────────────────────────────────────

function ProductTableRow({
  product,
  showStock,
  menuOpen,
  onMenuToggle,
  onView,
  onEdit,
  onDeactivate,
}: {
  product:      ProductWithStock
  showStock:    boolean
  menuOpen:     boolean
  onMenuToggle: (e: React.MouseEvent) => void
  onView?:      () => void
  onEdit?:      () => void
  onDeactivate?: () => void
}) {
  const stockStatus  = product.stock_status ?? 'ok'
  const currentStock = product.current_stock ?? null

  return (
    <TableRow className="cursor-pointer" onClick={onView}>
      {/* SKU */}
      <TableCell>
        <div className="flex items-center gap-2">
          {product.category?.color && (
            <span
              className="h-2 w-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: product.category.color }}
            />
          )}
          <span className="font-mono text-xs font-semibold text-slate-700">{product.sku}</span>
        </div>
      </TableCell>

      {/* Name */}
      <TableCell>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate max-w-56">{product.name}</p>
          {product.barcode && (
            <p className="text-xs text-slate-400 font-mono">{product.barcode}</p>
          )}
        </div>
      </TableCell>

      {/* Category */}
      <TableCell className="hidden md:table-cell">
        {product.category ? (
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: product.category.color }}
            />
            <span className="text-xs text-slate-600">{product.category.name}</span>
          </div>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        )}
      </TableCell>

      {/* Unit */}
      <TableCell className="hidden sm:table-cell">
        <span className="text-xs text-slate-500">{product.unit?.symbol ?? '—'}</span>
      </TableCell>

      {/* Stock */}
      {showStock && (
        <>
          <TableCell className="text-right">
            {currentStock !== null ? (
              <span className={cn(
                'text-sm font-bold tabular-nums',
                stockStatus === 'zero'    ? 'text-danger-600' :
                stockStatus === 'low'     ? 'text-danger-500' :
                stockStatus === 'warning' ? 'text-amber-600' :
                'text-slate-900'
              )}>
                {formatQuantity(currentStock)}
              </span>
            ) : (
              <span className="text-slate-300">—</span>
            )}
          </TableCell>

          <TableCell className="text-right hidden sm:table-cell">
            <span className="text-xs tabular-nums text-slate-500">
              {formatQuantity(product.min_stock ?? 0)}
            </span>
          </TableCell>

          <TableCell className="hidden sm:table-cell">
            <StockStatusBadge status={stockStatus} size="sm" />
          </TableCell>
        </>
      )}

      {/* Action menu */}
      <TableCell onClick={e => e.stopPropagation()}>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-slate-300 hover:text-slate-600"
            onClick={onMenuToggle}
          >
            <MoreHorizontal size={15} />
          </Button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 w-36 rounded-xl border border-slate-200 bg-white shadow-lg py-1">
              {onView && (
                <MenuAction icon={<Eye size={13} />} label="Ver detalle" onClick={onView} />
              )}
              {onEdit && (
                <MenuAction icon={<Pencil size={13} />} label="Editar" onClick={onEdit} />
              )}
              {onDeactivate && (
                <MenuAction
                  icon={<PowerOff size={13} />}
                  label="Desactivar"
                  onClick={onDeactivate}
                  danger
                />
              )}
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

function MenuAction({
  icon, label, onClick, danger = false
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onClick() }}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors',
        danger
          ? 'text-danger-600 hover:bg-danger-50'
          : 'text-slate-700 hover:bg-slate-50'
      )}
    >
      {icon}
      {label}
    </button>
  )
}
