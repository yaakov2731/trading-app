'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, Filter, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { MOVEMENT_LABELS } from '@/lib/utils/format'

const MOVEMENT_TYPES = Object.entries(MOVEMENT_LABELS).map(([value, label]) => ({ value, label }))

interface HistoryFiltersProps {
  locations: Array<{ id: string; name: string }>
  className?: string
}

export function HistoryFilters({ locations, className }: HistoryFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  const search = searchParams.get('search') ?? ''
  const locationId = searchParams.get('location_id') ?? ''
  const movementType = searchParams.get('movement_type') ?? ''
  const fromDate = searchParams.get('from_date') ?? ''
  const toDate = searchParams.get('to_date') ?? ''

  const activeFilterCount = [locationId, movementType, fromDate, toDate].filter(Boolean).length

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  function clearAll() {
    router.push(pathname)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Search bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar producto, SKU, referencia…"
          defaultValue={search}
          onChange={(e) => update('search', e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 shadow-sm outline-none ring-0 transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        {search && (
          <button
            onClick={() => update('search', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
            open || activeFilterCount > 0
              ? 'border-brand-500 bg-brand-50 text-brand-700'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          )}
        >
          <Filter className="h-4 w-4" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Limpiar
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {open && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Location */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Ubicación</label>
              <select
                value={locationId}
                onChange={(e) => update('location_id', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="">Todas</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            {/* Movement type */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Tipo de movimiento</label>
              <select
                value={movementType}
                onChange={(e) => update('movement_type', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="">Todos</option>
                {MOVEMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* From date */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Desde</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => update('from_date', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>

            {/* To date */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Hasta</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => update('to_date', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
