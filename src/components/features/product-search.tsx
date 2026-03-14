'use client'

import * as React from 'react'
import { Search, X, Tag, Package } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Product } from '@/lib/types'

// =============================================================================
// Fast product search with keyboard navigation
// =============================================================================

interface ProductSearchProps {
  products:         Product[]
  value?:           Product | null
  onSelect:         (product: Product | null) => void
  placeholder?:     string
  disabled?:        boolean
  className?:       string
  recentProductIds?: string[]
}

export function ProductSearch({
  products,
  value,
  onSelect,
  placeholder = 'Buscar producto (SKU, nombre o código)...',
  disabled,
  className,
  recentProductIds = [],
}: ProductSearchProps) {
  const [query, setQuery]     = React.useState('')
  const [open, setOpen]       = React.useState(false)
  const [highlighted, setHighlighted] = React.useState(0)

  const inputRef    = React.useRef<HTMLInputElement>(null)
  const listRef     = React.useRef<HTMLUListElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Filter products by query — trigram-style matching
  const filtered = React.useMemo(() => {
    if (!query.trim()) {
      // Show recent products first when no query
      const recent = recentProductIds
        .map(id => products.find(p => p.id === id))
        .filter(Boolean) as Product[]
      const others = products.filter(p => !recentProductIds.includes(p.id)).slice(0, 5)
      return [...recent, ...others].slice(0, 10)
    }

    const q = query.toLowerCase()
    return products
      .filter(p => {
        if (!p.is_active) return false
        return (
          p.sku.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q) ||
          p.category?.name?.toLowerCase().includes(q)
        )
      })
      .slice(0, 12)
  }, [query, products, recentProductIds])

  // Close on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true)
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlighted(h => Math.min(h + 1, filtered.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlighted(h => Math.max(h - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filtered[highlighted]) {
          handleSelect(filtered[highlighted])
        }
        break
      case 'Escape':
        setOpen(false)
        break
    }
  }

  function handleSelect(product: Product) {
    onSelect(product)
    setQuery('')
    setOpen(false)
    setHighlighted(0)
  }

  function handleClear() {
    onSelect(null)
    setQuery('')
    inputRef.current?.focus()
  }

  // Scroll highlighted item into view
  React.useEffect(() => {
    const el = listRef.current?.children[highlighted] as HTMLElement
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlighted])

  if (value) {
    // Show selected product chip
    return (
      <div className={cn(
        'flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-3',
        className
      )}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Package size={16} className="text-brand-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{value.name}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500">{value.sku}</span>
              {value.category && (
                <span className="text-xs text-slate-400">· {value.category.name}</span>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="flex-shrink-0 rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all"
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Search input */}
      <div className="relative flex items-center">
        <Search size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setOpen(true)
            setHighlighted(0)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            'flex h-11 w-full rounded-xl',
            'border border-slate-200 bg-white',
            'pl-9 pr-4 text-sm text-slate-900',
            'placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500',
            'hover:border-slate-300',
            'disabled:cursor-not-allowed disabled:bg-slate-50',
            'transition-all duration-150'
          )}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setHighlighted(0) }}
            className="absolute right-3 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className={cn(
          'absolute z-50 top-full mt-1.5 w-full',
          'bg-white rounded-xl border border-slate-200 shadow-xl',
          'overflow-hidden',
          'animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150'
        )}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package size={24} className="text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-500">Sin resultados</p>
              <p className="text-xs text-slate-400 mt-0.5">Intenta con otro término</p>
            </div>
          ) : (
            <>
              {!query && recentProductIds.length > 0 && (
                <div className="px-3 pt-2.5 pb-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Recientes
                  </p>
                </div>
              )}
              <ul ref={listRef} className="py-1 max-h-64 overflow-y-auto">
                {filtered.map((product, i) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      onMouseDown={e => { e.preventDefault(); handleSelect(product) }}
                      onMouseEnter={() => setHighlighted(i)}
                      className={cn(
                        'flex items-center gap-3 w-full px-3 py-2.5 text-left',
                        'transition-colors duration-75',
                        i === highlighted ? 'bg-brand-50 text-brand-900' : 'text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0',
                        i === highlighted ? 'bg-brand-100' : 'bg-slate-100'
                      )}>
                        <Package size={14} className={i === highlighted ? 'text-brand-600' : 'text-slate-400'} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-mono text-slate-400">{product.sku}</span>
                          {product.category && (
                            <span className="flex items-center gap-0.5 text-xs text-slate-400">
                              <Tag size={10} />
                              {product.category.name}
                            </span>
                          )}
                        </div>
                      </div>
                      {product.unit && (
                        <span className="text-xs font-medium text-slate-400 flex-shrink-0">
                          {product.unit.symbol}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
