import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Package, Truck, Calendar, FileText, MapPin, User, Hash } from 'lucide-react'
import { requireAuth } from '@/lib/server/auth-guards'
import { getPurchaseEntryById, getPurchaseItems, cancelPurchaseEntry } from '@/lib/server/purchases'
import { receivePurchaseEntry } from '@/lib/server/purchase-receiving'
import { PurchaseStatusBadge } from '@/components/purchases/purchase-status-badge'
import { formatDate, formatDateTime, formatCurrency, formatQuantity } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { revalidatePath } from 'next/cache'
import { ReceiveButton } from './receive-button'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const entry = await getPurchaseEntryById(id)
  return { title: entry?.entry_code ?? 'Compra' }
}

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAuth()
  const { id } = await params

  const [entry, items] = await Promise.all([
    getPurchaseEntryById(id),
    getPurchaseItems(id),
  ])

  if (!entry) notFound()

  const canReceive = entry.status === 'draft'
  const canCancel = entry.status === 'draft'

  async function handleReceive() {
    'use server'
    await receivePurchaseEntry({
      purchase_entry_id: id,
      received_items: items.map((item) => ({
        purchase_item_id: item.id,
        quantity_received: item.quantity_ordered,
      })),
    })
    revalidatePath(`/purchases/${id}`)
    revalidatePath('/purchases')
  }

  async function handleCancel() {
    'use server'
    await cancelPurchaseEntry(id)
    revalidatePath(`/purchases/${id}`)
    revalidatePath('/purchases')
  }

  const estimatedTotal = items.reduce((sum, item) => {
    if (item.unit_cost == null) return sum
    return sum + item.quantity_ordered * item.unit_cost
  }, 0)

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/purchases"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">
                {entry.entry_code ?? id.slice(0, 8)}
              </h1>
              <PurchaseStatusBadge status={entry.status} />
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {entry.supplier_name ?? 'Sin proveedor'} · {entry.location_name}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {canReceive && (
            <ReceiveButton entryId={id} onReceive={handleReceive} />
          )}
          {canCancel && (
            <form action={handleCancel}>
              <button
                type="submit"
                className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                Cancelar compra
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Received banner */}
      {entry.status === 'received' && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Mercadería recibida y stock actualizado
            </p>
            {entry.received_at && (
              <p className="text-xs text-emerald-600">
                Recibido por {entry.received_by_name ?? 'Sistema'} el {formatDateTime(entry.received_at)}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* ── Items table ───────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-700">
                Productos ({items.length})
              </h2>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Package className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">Sin productos en esta compra</p>
              </div>
            ) : (
              <>
                {/* Desktop */}
                <table className="w-full text-sm hidden sm:table">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">SKU</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Producto</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide">Qty Pedida</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide">Qty Recibida</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide">Costo Unit.</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map((item) => {
                      const lineTotal =
                        item.unit_cost != null
                          ? item.quantity_received * item.unit_cost
                          : null
                      const isReceived = entry.status === 'received'

                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.sku}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800 truncate max-w-[200px]">{item.product_name}</p>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                            {formatQuantity(item.quantity_ordered)} {item.unit_symbol}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            <span className={cn(
                              'font-semibold',
                              isReceived ? 'text-emerald-600' : 'text-slate-400'
                            )}>
                              {isReceived
                                ? `${formatQuantity(item.quantity_received)} ${item.unit_symbol}`
                                : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                            {item.unit_cost != null ? formatCurrency(item.unit_cost) : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-800">
                            {lineTotal != null ? formatCurrency(lineTotal) : <span className="text-slate-300">—</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {/* Total footer */}
                  {(entry.total_amount ?? estimatedTotal) > 0 && (
                    <tfoot>
                      <tr className="border-t border-slate-200 bg-slate-50">
                        <td colSpan={5} className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Total
                        </td>
                        <td className="px-4 py-3 text-right text-base font-bold text-slate-900">
                          {formatCurrency(entry.total_amount ?? estimatedTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>

                {/* Mobile */}
                <div className="space-y-2 p-3 sm:hidden">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{item.product_name}</p>
                          <p className="font-mono text-xs text-slate-400">{item.sku}</p>
                        </div>
                        {item.unit_cost != null && (
                          <p className="text-sm font-semibold text-slate-700 shrink-0">
                            {formatCurrency(item.unit_cost)}/{item.unit_symbol}
                          </p>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
                        <span>Pedido: <strong>{formatQuantity(item.quantity_ordered)} {item.unit_symbol}</strong></span>
                        {entry.status === 'received' && (
                          <span>Recibido: <strong className="text-emerald-600">{formatQuantity(item.quantity_received)} {item.unit_symbol}</strong></span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Metadata sidebar ──────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">
              Detalles
            </h2>

            {[
              { icon: MapPin, label: 'Ubicación', value: entry.location_name },
              { icon: Truck, label: 'Proveedor', value: entry.supplier_name ?? 'Sin proveedor' },
              { icon: Calendar, label: 'Fecha', value: formatDate(entry.entry_date) },
              { icon: FileText, label: 'Remito/Factura', value: entry.invoice_number ?? '—' },
              { icon: User, label: 'Registrado por', value: entry.created_by_name ?? '—' },
              { icon: Hash, label: 'Código', value: entry.entry_code ?? id.slice(0, 8) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-2.5">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
                  <p className="text-sm text-slate-700 font-medium truncate">{value}</p>
                </div>
              </div>
            ))}

            {entry.notes && (
              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                {entry.notes}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Acciones</h2>
            <div className="space-y-2">
              <a
                href={`/api/purchases/${id}/export`}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <FileText className="h-4 w-4 text-slate-400" />
                Exportar Excel
              </a>
              <Link
                href="/purchases/new"
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Package className="h-4 w-4 text-slate-400" />
                Nueva compra
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
