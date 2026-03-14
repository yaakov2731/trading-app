import type { Metadata } from 'next'
import { Suspense } from 'react'
import { requireAuth } from '@/lib/server/auth-guards'
import { getMovementHistory } from '@/lib/server/history'
import { getAccessibleLocations } from '@/lib/server/location-access'
import { isAdmin } from '@/lib/auth/permissions'
import { HistoryFilters } from '@/components/history/history-filters'
import { MovementHistoryTable } from '@/components/history/movement-history-table'
import { Download } from 'lucide-react'

export const metadata: Metadata = { title: 'Historial de Movimientos' }

interface PageProps {
  searchParams: Promise<Record<string, string | string[]>>
}

export default async function HistoryPage({ searchParams }: PageProps) {
  const session = await requireAuth()
  const params = await searchParams

  function str(v: string | string[] | undefined): string | undefined {
    if (!v) return undefined
    return Array.isArray(v) ? v[0] : v
  }

  // Build location filter from user access
  const locations = await getAccessibleLocations()
  const accessibleIds = locations.map((l) => l.id)

  const locationId = str(params.location_id)
  const page = Number(str(params.page) ?? '1')

  const { movements, total, hasMore } = await getMovementHistory({
    location_id: locationId,
    product_id: str(params.product_id),
    movement_type: str(params.movement_type),
    from_date: str(params.from_date),
    to_date: str(params.to_date),
    search: str(params.search),
    page,
    page_size: 50,
  })

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Historial de Movimientos</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {total.toLocaleString('es-AR')} movimiento{total !== 1 ? 's' : ''}
          </p>
        </div>
        <a
          href={`/api/history/export?${new URLSearchParams(
            Object.fromEntries(
              Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v ?? ''])
            )
          ).toString()}`}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
        >
          <Download className="h-4 w-4" />
          Exportar
        </a>
      </div>

      {/* Filters */}
      <Suspense>
        <HistoryFilters locations={locations} />
      </Suspense>

      {/* Table */}
      <MovementHistoryTable
        movements={movements}
        total={total}
        page={page}
        pageSize={50}
      />
    </div>
  )
}
