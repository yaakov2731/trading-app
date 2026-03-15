/**
 * components/migration/opening-balance-table.tsx
 * Opening balance candidate table with approve/exclude actions.
 */

'use client'

import { useState, useTransition } from 'react'
import MappingStatusBadge from './mapping-status-badge'
import type { OpeningBalanceCandidate } from '@/lib/server/opening-balances'

interface OpeningBalanceTableProps {
  candidates: OpeningBalanceCandidate[]
  total: number
  page: number
  pageSize: number
}

function statusStyle(status: string) {
  switch (status) {
    case 'approved': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    case 'excluded': return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
    case 'applied':  return 'text-brand-400 bg-brand-500/10 border-brand-500/30'
    default:         return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
  }
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Pendiente', approved: 'Aprobado', excluded: 'Excluido', applied: 'Aplicado'
  }
  return map[status] ?? status
}

interface CandidateActionsProps {
  candidate: OpeningBalanceCandidate
  onUpdate: (id: string, updates: Partial<OpeningBalanceCandidate>) => void
}

function CandidateActions({ candidate, onUpdate }: CandidateActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!['pending', 'excluded'].includes(candidate.status)) return null

  const handleAction = (action: 'approve' | 'exclude') => {
    setError(null)
    startTransition(async () => {
      try {
        const endpoint = action === 'approve'
          ? `/api/migration/opening-balances/${candidate.id}/approve`
          : `/api/migration/opening-balances/${candidate.id}/exclude`

        const res = await fetch(endpoint, { method: 'POST' })
        if (!res.ok) {
          const data = await res.json()
          setError(data.error ?? 'Error')
          return
        }
        onUpdate(candidate.id, { status: action === 'approve' ? 'approved' : 'excluded' })
      } catch {
        setError('Error de conexión')
      }
    })
  }

  return (
    <div className="flex items-center gap-1">
      {candidate.status === 'pending' && (
        <>
          <button
            onClick={() => handleAction('approve')}
            disabled={isPending || !candidate.matched_product_id || !candidate.matched_location_id}
            className="px-2 py-1 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400
              border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors disabled:opacity-40"
            title={!candidate.matched_product_id || !candidate.matched_location_id ? 'Falta producto o ubicación' : ''}
          >
            Aprobar
          </button>
          <button
            onClick={() => handleAction('exclude')}
            disabled={isPending}
            className="px-2 py-1 text-xs font-medium rounded-lg bg-slate-700 text-slate-400
              border border-slate-600 hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            Excluir
          </button>
        </>
      )}
      {candidate.status === 'excluded' && (
        <button
          onClick={() => handleAction('approve')}
          disabled={isPending}
          className="px-2 py-1 text-xs font-medium rounded-lg bg-slate-700 text-slate-400
            border border-slate-600 hover:bg-slate-600 transition-colors disabled:opacity-50"
        >
          Re-aprobar
        </button>
      )}
      {error && <span className="text-xs text-red-400 ml-1">{error}</span>}
    </div>
  )
}

export default function OpeningBalanceTable({
  candidates: initialCandidates,
  total,
}: OpeningBalanceTableProps) {
  const [candidates, setCandidates] = useState(initialCandidates)

  const handleUpdate = (id: string, updates: Partial<OpeningBalanceCandidate>) => {
    setCandidates((prev) => prev.map((c) => c.id === id ? { ...c, ...updates } : c))
  }

  if (candidates.length === 0) {
    return (
      <div className="py-16 text-center bg-slate-900/60 border border-slate-800 rounded-2xl">
        <p className="text-slate-500 text-sm">No hay candidatos para mostrar.</p>
        <p className="text-xs text-slate-600 mt-1">
          Importa y revisa archivos legados para derivar saldos iniciales.
        </p>
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
              {['SKU', 'Producto', 'Cantidad', 'Unidad', 'Ubicación', 'Fecha snapshot', 'Confianza', 'Estado', 'Acciones'].map((h) => (
                <th key={h} className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {candidates.map((c) => (
              <tr key={c.id} className={`hover:bg-slate-800/30 transition-colors ${
                c.status === 'excluded' ? 'opacity-50' : ''
              }`}>
                <td className="px-3 py-2.5">
                  <code className="text-xs text-brand-400">{c.matched_product_sku ?? c.sku ?? '—'}</code>
                </td>
                <td className="px-3 py-2.5 text-slate-200 max-w-[160px]">
                  <div className="truncate">{c.matched_product_name ?? c.product_name ?? '—'}</div>
                  {!c.matched_product_id && (
                    <div className="text-xs text-red-400 mt-0.5">Sin vincular</div>
                  )}
                </td>
                <td className="px-3 py-2.5 text-slate-100 font-semibold">
                  {c.override_quantity ?? c.quantity}
                </td>
                <td className="px-3 py-2.5 text-slate-400 text-xs">{c.unit_raw ?? '—'}</td>
                <td className="px-3 py-2.5 text-slate-300 max-w-[120px]">
                  <div className="truncate">{c.matched_location_name ?? c.location_raw ?? '—'}</div>
                  {!c.matched_location_id && (
                    <div className="text-xs text-red-400 mt-0.5">Sin vincular</div>
                  )}
                </td>
                <td className="px-3 py-2.5 text-slate-500 text-xs whitespace-nowrap">
                  {c.snapshot_datetime
                    ? new Date(c.snapshot_datetime).toLocaleDateString('es-AR')
                    : '—'}
                </td>
                <td className="px-3 py-2.5">
                  <MappingStatusBadge confidence={c.confidence} />
                </td>
                <td className="px-3 py-2.5">
                  <span className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border ${statusStyle(c.status)}`}>
                    {statusLabel(c.status)}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <CandidateActions candidate={c} onUpdate={handleUpdate} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="lg:hidden divide-y divide-slate-800">
        {candidates.map((c) => (
          <div key={c.id} className={`p-4 space-y-2 ${c.status === 'excluded' ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-100 truncate">
                  {c.matched_product_name ?? c.product_name ?? '—'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  {c.matched_product_sku ?? c.sku ?? 'Sin SKU'}
                </p>
              </div>
              <span className={`flex-shrink-0 px-2 py-0.5 rounded-lg text-[11px] font-medium border ${statusStyle(c.status)}`}>
                {statusLabel(c.status)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
              <span className="text-slate-100 font-semibold text-sm">
                {c.override_quantity ?? c.quantity} {c.unit_raw ?? ''}
              </span>
              {c.matched_location_name ?? c.location_raw ? (
                <span>· {c.matched_location_name ?? c.location_raw}</span>
              ) : (
                <span className="text-red-400">· Sin ubicación</span>
              )}
              {c.snapshot_datetime && (
                <span>· {new Date(c.snapshot_datetime).toLocaleDateString('es-AR')}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <MappingStatusBadge confidence={c.confidence} />
              <CandidateActions candidate={c} onUpdate={handleUpdate} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
