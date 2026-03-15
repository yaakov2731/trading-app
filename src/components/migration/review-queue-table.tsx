/**
 * components/migration/review-queue-table.tsx
 * Review queue — desktop table + mobile cards with action buttons.
 */

'use client'

import { useState, useTransition } from 'react'
import MappingStatusBadge from './mapping-status-badge'
import type { ReviewRow } from '@/lib/server/migration-review'

interface ReviewQueueTableProps {
  rows: ReviewRow[]
  total: number
  page: number
  pageSize: number
  importRunId?: string
}

function rowStatusStyle(status: string) {
  switch (status) {
    case 'matched':      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    case 'needs_review': return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    case 'failed':       return 'text-red-400 bg-red-500/10 border-red-500/30'
    case 'skipped':      return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
    default:             return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
  }
}

function rowStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Pendiente', needs_review: 'Revisar', matched: 'Vinculado',
    failed: 'Error', skipped: 'Omitido', approved: 'Aprobado',
  }
  return map[status] ?? status
}

interface RowActionsProps {
  rowId: string
  status: string
  onActionComplete: (rowId: string, newStatus: string) => void
}

function RowActions({ rowId, status, onActionComplete }: RowActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!['needs_review', 'pending'].includes(status)) return null

  const handleAction = (action: 'approve' | 'reject' | 'skip') => {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/migration/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ row_id: rowId, action }),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.error ?? 'Error al procesar')
          return
        }
        const statusMap: Record<string, string> = { approve: 'matched', reject: 'failed', skip: 'skipped' }
        onActionComplete(rowId, statusMap[action])
      } catch {
        setError('Error de conexión')
      }
    })
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleAction('approve')}
        disabled={isPending}
        className="px-2 py-1 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400
          border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
      >
        Aprobar
      </button>
      <button
        onClick={() => handleAction('skip')}
        disabled={isPending}
        className="px-2 py-1 text-xs font-medium rounded-lg bg-slate-700 text-slate-300
          border border-slate-600 hover:bg-slate-600 transition-colors disabled:opacity-50"
      >
        Omitir
      </button>
      <button
        onClick={() => handleAction('reject')}
        disabled={isPending}
        className="px-2 py-1 text-xs font-medium rounded-lg bg-red-500/10 text-red-400
          border border-red-500/30 hover:bg-red-500/20 transition-colors disabled:opacity-50"
      >
        Rechazar
      </button>
      {error && <span className="text-xs text-red-400 ml-1">{error}</span>}
    </div>
  )
}

export default function ReviewQueueTable({
  rows: initialRows,
  total,
}: ReviewQueueTableProps) {
  const [rows, setRows] = useState(initialRows)

  const handleActionComplete = (rowId: string, newStatus: string) => {
    setRows((prev) => prev.map((r) => r.id === rowId ? { ...r, status: newStatus } : r))
  }

  if (rows.length === 0) {
    return (
      <div className="py-16 text-center bg-slate-900/60 border border-slate-800 rounded-2xl">
        <div className="w-12 h-12 rounded-full bg-slate-800 mx-auto mb-3 flex items-center justify-center">
          <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-slate-500 text-sm">No hay filas para mostrar</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Desktop */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              {['#', 'SKU', 'Producto', 'Stock', 'Unidad', 'Ubicación', 'Confianza', 'Estado', 'Acciones'].map((h) => (
                <th key={h} className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((row) => {
              const parsed = row.parsed_data as Record<string, unknown> | null
              return (
                <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-3 py-2.5 text-slate-500 text-xs">{row.row_number}</td>
                  <td className="px-3 py-2.5">
                    <code className="text-xs text-brand-400">{parsed?.sku as string ?? '—'}</code>
                  </td>
                  <td className="px-3 py-2.5 text-slate-200 max-w-[160px] truncate">
                    {parsed?.productName as string ?? '—'}
                  </td>
                  <td className="px-3 py-2.5 text-slate-300 font-medium">
                    {parsed?.quantity != null ? String(parsed.quantity) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-slate-400 text-xs">
                    {parsed?.unitNormalized as string ?? parsed?.unitRaw as string ?? '—'}
                  </td>
                  <td className="px-3 py-2.5 text-slate-400 text-xs max-w-[120px] truncate">
                    {row.location_raw ?? '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <MappingStatusBadge confidence={row.confidence} />
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border ${rowStatusStyle(row.status)}`}>
                      {rowStatusLabel(row.status)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <RowActions
                      rowId={row.id}
                      status={row.status}
                      onActionComplete={handleActionComplete}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="lg:hidden divide-y divide-slate-800">
        {rows.map((row) => {
          const parsed = row.parsed_data as Record<string, unknown> | null
          return (
            <div key={row.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-100 truncate">
                    {parsed?.productName as string ?? '—'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {parsed?.sku as string ?? 'Sin SKU'} · Fila {row.row_number}
                  </p>
                </div>
                <span className={`flex-shrink-0 px-2 py-0.5 rounded-lg text-[11px] font-medium border ${rowStatusStyle(row.status)}`}>
                  {rowStatusLabel(row.status)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                {parsed?.quantity != null && (
                  <span className="text-slate-200 font-medium">{String(parsed.quantity)} {parsed?.unitNormalized as string ?? ''}</span>
                )}
                {row.location_raw && <span>· {row.location_raw}</span>}
              </div>

              {/* Issues */}
              {row.issues && row.issues.length > 0 && (
                <div className="space-y-0.5">
                  {row.issues.slice(0, 2).map((issue, i) => (
                    <p key={i} className="text-xs text-amber-400">⚠ {issue.message}</p>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <MappingStatusBadge confidence={row.confidence} />
                <RowActions rowId={row.id} status={row.status} onActionComplete={handleActionComplete} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
