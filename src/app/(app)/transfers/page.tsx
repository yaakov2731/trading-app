import type { Metadata } from 'next'
import { getTransfers } from '@/server/actions/transfers'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils/format'
import { ArrowLeftRight, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Transferencias' }

const STATUS_LABELS: Record<string, { label: string; variant: any }> = {
  pending:   { label: 'Pendiente', variant: 'warning' },
  in_transit:{ label: 'En tránsito', variant: 'info' },
  completed: { label: 'Completada', variant: 'success' },
  cancelled: { label: 'Cancelada',  variant: 'danger' },
}

export default async function TransfersPage() {
  const transfers = await getTransfers()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Transferencias</h1>
          <p className="text-sm text-slate-400">{transfers.length} registros</p>
        </div>
        <Link href="/transfers/new">
          <Button variant="primary" size="sm" leftIcon={<Plus size={15} />}>
            Nueva transferencia
          </Button>
        </Link>
      </div>

      {transfers.length === 0 ? (
        <Card padding="md" className="text-center py-12">
          <ArrowLeftRight size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700 mb-1">Sin transferencias registradas</p>
          <p className="text-xs text-slate-400 mb-4">Las transferencias entre locales aparecerán aquí</p>
          <Link href="/transfers/new">
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />}>
              Crear primera transferencia
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
          <div className="divide-y divide-slate-100">
            {transfers.map((transfer: any) => {
              const status = STATUS_LABELS[transfer.status] ?? STATUS_LABELS.completed
              return (
                <div key={transfer.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <ArrowLeftRight size={16} className="text-purple-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: transfer.from_location?.color }}
                      >
                        {transfer.from_location?.name}
                      </span>
                      <ArrowRight size={13} className="text-slate-300 flex-shrink-0" />
                      <span
                        className="text-sm font-semibold"
                        style={{ color: transfer.to_location?.color }}
                      >
                        {transfer.to_location?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-400">{formatDate(transfer.transfer_date)}</span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{transfer.items?.length ?? 0} productos</span>
                      {transfer.notes && (
                        <>
                          <span className="text-xs text-slate-300">·</span>
                          <span className="text-xs text-slate-400 truncate max-w-32">{transfer.notes}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <Badge variant={status.variant} size="sm">{status.label}</Badge>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
