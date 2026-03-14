import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/db/client'
import { getPurchaseEntries } from '@/server/actions/purchases'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { ShoppingCart, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Compras' }

const STATUS_LABELS: Record<string, { label: string; variant: any }> = {
  draft:     { label: 'Borrador',  variant: 'default' },
  ordered:   { label: 'Pedido',    variant: 'info' },
  received:  { label: 'Recibido',  variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'danger' },
}

export default async function PurchasesPage() {
  const entries = await getPurchaseEntries()

  return (
    <div className="space-y-5">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Compras</h1>
          <p className="text-sm text-slate-400">{entries.length} registros</p>
        </div>
        <Link href="/purchases/new">
          <Button variant="primary" size="sm" leftIcon={<Plus size={15} />}>
            Nueva compra
          </Button>
        </Link>
      </div>

      {/* ── List ──────────────────────────────────────────────────────────── */}
      {entries.length === 0 ? (
        <Card padding="md" className="text-center py-12">
          <ShoppingCart size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700 mb-1">Sin compras registradas</p>
          <p className="text-xs text-slate-400 mb-4">Las compras que registres aparecerán aquí</p>
          <Link href="/purchases/new">
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />}>
              Registrar primera compra
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
          <div className="divide-y divide-slate-100">
            {entries.map((entry: any) => {
              const status = STATUS_LABELS[entry.status] ?? STATUS_LABELS.draft
              return (
                <div key={entry.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: (entry.location?.color ?? '#3b82f6') + '20' }}
                  >
                    <ShoppingCart size={16} style={{ color: entry.location?.color ?? '#3b82f6' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {entry.supplier?.name ?? 'Sin proveedor'}
                      </p>
                      {entry.reference_number && (
                        <span className="text-xs text-slate-400 font-mono">{entry.reference_number}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-400">{entry.location?.name}</span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{formatDate(entry.entry_date)}</span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{entry.items?.length ?? 0} productos</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 flex items-center gap-3">
                    {entry.total_amount > 0 && (
                      <span className="text-sm font-bold text-slate-900 tabular-nums">
                        {formatCurrency(entry.total_amount)}
                      </span>
                    )}
                    <Badge variant={status.variant} size="sm">{status.label}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
