import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, ClipboardList } from 'lucide-react'
import { requireAuth } from '@/lib/server/auth-guards'
import { getPhysicalCounts } from '@/lib/server/physical-counts'
import { getAccessibleLocations } from '@/lib/server/location-access'
import { formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

const STATUS_STYLES: Record<string, string> = {
  draft:       'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed:   'bg-emerald-100 text-emerald-700',
  cancelled:   'bg-red-100 text-red-500',
}

const STATUS_LABELS: Record<string, string> = {
  draft:       'Borrador',
  in_progress: 'En progreso',
  completed:   'Completado',
  cancelled:   'Cancelado',
}

export default async function CountsPage() {
  await requireAuth()

  const [{ counts, total }, locations] = await Promise.all([
    getPhysicalCounts({ page: 1, page_size: 20 }),
    getAccessibleLocations(),
  ])

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Conteos Físicos</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {total} conteo{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/counts/new"
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Nuevo conteo
        </Link>
      </div>

      {/* List */}
      {counts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-20">
          <ClipboardList className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">No hay conteos registrados</p>
          <Link
            href="/counts/new"
            className="mt-4 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            Iniciar primer conteo
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {counts.map((count) => (
            <Link
              key={count.id}
              href={`/counts/${count.id}`}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: count.location_color ?? '#e2e8f0' }}
                >
                  <ClipboardList className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800 truncate">{count.location_name}</p>
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLES[count.status])}>
                      {STATUS_LABELS[count.status] ?? count.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {count.count_code ?? count.id.slice(0, 8)} · {formatDate(count.count_date)}
                    {count.item_count > 0 && ` · ${count.item_count} productos`}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 ml-3">
                <p className="text-xs text-slate-400">{count.created_by_name ?? 'Sistema'}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
