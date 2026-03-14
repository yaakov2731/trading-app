'use client'

import Link from 'next/link'
import { ShoppingCart, Package, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatDate, formatCurrency } from '@/lib/utils/format'
import { PurchaseStatusBadge } from './purchase-status-badge'
import type { PurchaseEntryRow } from '@/lib/server/purchases'

interface PurchasesTableProps {
  entries: PurchaseEntryRow[]
  total: number
  page: number
  pageSize: number
  onPageChange?: (page: number) => void
  className?: string
}

export function PurchasesTable({
  entries,
  total,
  page,
  pageSize,
  onPageChange,
  className,
}: PurchasesTableProps) {
  const totalPages = Math.ceil(total / pageSize)

  if (entries.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-20',
          className
        )}
      >
        <ShoppingCart className="h-10 w-10 text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-500">No hay compras registradas</p>
        <p className="text-xs text-slate-400 mt-1">Ajusta los filtros o registra una nueva compra</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 shadow-sm md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {['Código', 'Fecha', 'Ubicación', 'Proveedor', 'Remito', 'Items', 'Total', 'Estado', ''].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 last:w-8"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((e) => (
              <tr
                key={e.id}
                className="group bg-white transition-colors hover:bg-slate-50"
              >
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-semibold text-slate-700">
                    {e.entry_code ?? e.id.slice(0, 8)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                  {formatDate(e.entry_date)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {e.location_color && (
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: e.location_color }}
                      />
                    )}
                    <span className="truncate text-xs text-slate-600 max-w-[120px]">
                      {e.location_name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600 max-w-[140px] truncate">
                  {e.supplier_name ?? <span className="text-slate-300">—</span>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400">
                  {e.invoice_number ?? '—'}
                </td>
                <td className="px-4 py-3 text-center text-xs text-slate-500">
                  {e.item_count}
                </td>
                <td className="px-4 py-3 text-right">
                  {e.total_amount != null ? (
                    <span className="text-sm font-semibold text-slate-800">
                      {formatCurrency(e.total_amount)}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <PurchaseStatusBadge status={e.status} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/purchases/${e.id}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="space-y-2 md:hidden">
        {entries.map((e) => (
          <Link
            key={e.id}
            href={`/purchases/${e.id}`}
            className="flex items-start justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-semibold text-slate-700">
                  {e.entry_code ?? e.id.slice(0, 8)}
                </span>
                <PurchaseStatusBadge status={e.status} size="sm" />
              </div>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {e.supplier_name ?? 'Sin proveedor'}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                {e.location_color && (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: e.location_color }}
                  />
                )}
                <span className="text-xs text-slate-500">{e.location_name}</span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-400">{formatDate(e.entry_date)}</span>
                {e.invoice_number && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono text-xs text-slate-400">{e.invoice_number}</span>
                  </>
                )}
              </div>
            </div>
            <div className="ml-3 shrink-0 text-right">
              {e.total_amount != null ? (
                <p className="text-base font-bold text-slate-900">
                  {formatCurrency(e.total_amount)}
                </p>
              ) : null}
              <p className="text-xs text-slate-400">
                {e.item_count} ítem{e.item_count !== 1 ? 's' : ''}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-slate-500">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
            >
              Anterior
            </button>
            <span className="text-xs text-slate-500">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
