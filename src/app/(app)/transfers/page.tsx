import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, ArrowLeftRight, ArrowRight } from 'lucide-react'
import { requireAuth } from '@/lib/server/auth-guards'
import { getTransfers } from '@/lib/server/transfers'
import { TransferStatusBadge } from '@/components/transfers/transfer-status-badge'
import { formatDate } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'Traslados' }
export const revalidate = 0

export default async function TransfersPage() {
  await requireAuth()

  const { transfers, total } = await getTransfers({ page: 1, page_size: 30 })

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Traslados</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {total} traslado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/transfers/new"
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Nuevo traslado
        </Link>
      </div>

      {/* List */}
      {transfers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-20">
          <ArrowLeftRight className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">No hay traslados registrados</p>
          <Link
            href="/transfers/new"
            className="mt-4 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            Crear primer traslado
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {transfers.map((transfer) => (
            <Link
              key={transfer.id}
              href={`/transfers/${transfer.id}`}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <ArrowLeftRight className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className="text-sm font-semibold truncate"
                      style={{ color: transfer.from_location_color ?? '#475569' }}
                    >
                      {transfer.from_location_name}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span
                      className="text-sm font-semibold truncate"
                      style={{ color: transfer.to_location_color ?? '#475569' }}
                    >
                      {transfer.to_location_name}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {transfer.transfer_code ?? transfer.id.slice(0, 8)} · {formatDate(transfer.transfer_date)}
                    {transfer.item_count > 0 && ` · ${transfer.item_count} ítem${transfer.item_count !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>

              <div className="shrink-0 ml-3 flex flex-col items-end gap-1">
                <TransferStatusBadge status={transfer.status} size="sm" />
                <p className="text-xs text-slate-400">{transfer.requested_by_name ?? 'Sistema'}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
