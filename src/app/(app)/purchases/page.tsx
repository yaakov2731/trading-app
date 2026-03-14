import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, ShoppingCart, Download, Filter } from 'lucide-react'
import { requireAuth } from '@/lib/server/auth-guards'
import { getPurchaseEntries } from '@/lib/server/purchases'
import { getAccessibleLocations } from '@/lib/server/location-access'
import { getActiveSupplierOptions } from '@/lib/server/suppliers'
import { PurchasesTable } from '@/components/purchases/purchases-table'
import { PurchaseStatusBadge } from '@/components/purchases/purchase-status-badge'
import { formatCurrency } from '@/lib/utils/format'
import { PURCHASE_STATUSES, PURCHASE_STATUS_LABELS } from '@/lib/validations/purchases'

export const metadata: Metadata = { title: 'Compras' }
export const revalidate = 0

interface PageProps {
  searchParams: Promise<Record<string, string | string[]>>
}

export default async function PurchasesPage({ searchParams }: PageProps) {
  await requireAuth()
  const params = await searchParams

  function str(v: string | string[] | undefined) {
    if (!v) return undefined
    return Array.isArray(v) ? v[0] : v
  }

  const page = Number(str(params.page) ?? '1')
  const pageSize = 20

  const [{ entries, total }, locations, suppliers] = await Promise.all([
    getPurchaseEntries({
      location_id: str(params.location_id),
      supplier_id: str(params.supplier_id),
      status: str(params.status) as 'draft' | 'received' | 'cancelled' | undefined,
      from_date: str(params.from_date),
      to_date: str(params.to_date),
      search: str(params.search),
      page,
      page_size: pageSize,
    }),
    getAccessibleLocations(),
    getActiveSupplierOptions(),
  ])

  // Quick stats from current page — header summary
  const totalSpend = entries
    .filter((e) => e.status === 'received' && e.total_amount != null)
    .reduce((s, e) => s + (e.total_amount ?? 0), 0)

  const activeFilters = [
    params.location_id,
    params.supplier_id,
    params.status,
    params.from_date,
    params.to_date,
    params.search,
  ].filter(Boolean).length

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Compras</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {total.toLocaleString('es-AR')} registro{total !== 1 ? 's' : ''}
            {totalSpend > 0 && (
              <span className="ml-2 text-slate-400">
                · <span className="font-semibold text-slate-700">{formatCurrency(totalSpend)}</span> recibido
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/purchases/export?${new URLSearchParams(
              Object.fromEntries(
                Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v ?? ''])
              )
            ).toString()}`}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar
          </a>
          <Link
            href="/purchases/new"
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Nueva compra
          </Link>
        </div>
      </div>

      {/* ── Filters bar ─────────────────────────────────────────────────────── */}
      <Suspense>
        <PurchaseFilters
          locations={locations}
          suppliers={suppliers}
          currentParams={params as Record<string, string>}
          activeFilters={activeFilters}
        />
      </Suspense>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <PurchasesTable
        entries={entries}
        total={total}
        page={page}
        pageSize={pageSize}
      />
    </div>
  )
}

// ── Inline filter bar (server component) ─────────────────────────────────────

function PurchaseFilters({
  locations,
  suppliers,
  currentParams,
  activeFilters,
}: {
  locations: Array<{ id: string; name: string }>
  suppliers: Array<{ id: string; name: string }>
  currentParams: Record<string, string>
  activeFilters: number
}) {
  function buildHref(key: string, value: string) {
    const p = { ...currentParams, [key]: value, page: '1' }
    if (!value) delete p[key]
    return `/purchases?${new URLSearchParams(p).toString()}`
  }

  const active = currentParams.status ?? ''
  const locationId = currentParams.location_id ?? ''
  const supplierId = currentParams.supplier_id ?? ''

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <form method="GET" action="/purchases" className="relative flex-1 min-w-[200px] max-w-xs">
        {Object.entries(currentParams)
          .filter(([k]) => k !== 'search' && k !== 'page')
          .map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
        <input
          type="search"
          name="search"
          defaultValue={currentParams.search ?? ''}
          placeholder="Buscar remito, factura…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-4 text-sm placeholder-slate-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </form>

      {/* Status tabs */}
      <div className="flex items-center gap-1">
        <a
          href={buildHref('status', '')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            !active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Todos
        </a>
        {PURCHASE_STATUSES.map((s) => (
          <a
            key={s}
            href={buildHref('status', s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              active === s
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {PURCHASE_STATUS_LABELS[s]}
          </a>
        ))}
      </div>

      {/* Location selector */}
      {locations.length > 1 && (
        <form method="GET" action="/purchases">
          {Object.entries(currentParams)
            .filter(([k]) => k !== 'location_id' && k !== 'page')
            .map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
          <select
            name="location_id"
            defaultValue={locationId}
            onChange={(e) => (e.target.form as HTMLFormElement)?.submit()}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="">Todas las ubicaciones</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </form>
      )}

      {/* Supplier selector */}
      {suppliers.length > 0 && (
        <form method="GET" action="/purchases">
          {Object.entries(currentParams)
            .filter(([k]) => k !== 'supplier_id' && k !== 'page')
            .map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
          <select
            name="supplier_id"
            defaultValue={supplierId}
            onChange={(e) => (e.target.form as HTMLFormElement)?.submit()}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="">Todos los proveedores</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </form>
      )}

      {/* Clear filters */}
      {activeFilters > 0 && (
        <a
          href="/purchases"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
        >
          ✕ Limpiar ({activeFilters})
        </a>
      )}
    </div>
  )
}
