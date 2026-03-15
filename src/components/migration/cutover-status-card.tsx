/**
 * components/migration/cutover-status-card.tsx
 * Cutover execution card — dry-run, confirm, execute, rollback.
 */

'use client'

import { useState, useTransition } from 'react'
import type { CutoverStatus, CutoverPreflight } from '@/lib/server/cutover'

interface CutoverStatusCardProps {
  status: CutoverStatus
  preflight: CutoverPreflight
  balanceStats: {
    approved: number
    applied: number
    readyToApply: number
  }
}

export default function CutoverStatusCard({
  status,
  preflight,
  balanceStats,
}: CutoverStatusCardProps) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{
    applied?: number
    failed?: number
    dry_run?: boolean
    errors?: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [notes, setNotes] = useState('')
  const [showRollback, setShowRollback] = useState(false)
  const [rollbackConfirmed, setRollbackConfirmed] = useState(false)
  const [rollbackResult, setRollbackResult] = useState<{
    deleted_movements?: number
    reset_candidates?: number
  } | null>(null)

  const handleExecute = (dryRun: boolean) => {
    if (!dryRun && !confirmed) return
    setError(null)
    setResult(null)

    startTransition(async () => {
      try {
        const res = await fetch('/api/migration/cutover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dry_run: dryRun, confirmed: true, notes: notes || undefined }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Error al ejecutar corte'); return }
        setResult(data)
      } catch {
        setError('Error de conexión')
      }
    })
  }

  const handleRollback = () => {
    if (!rollbackConfirmed) return
    startTransition(async () => {
      try {
        const res = await fetch('/api/migration/cutover/rollback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: 'Rollback manual' }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Error en rollback'); return }
        setRollbackResult(data)
        setShowRollback(false)
      } catch {
        setError('Error de conexión')
      }
    })
  }

  if (status.has_run && balanceStats.applied > 0 && !rollbackResult) {
    return (
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">Corte ejecutado</h3>
            <p className="text-sm text-slate-400">
              {balanceStats.applied} saldos iniciales aplicados
              {status.last_run_at ? ` · ${new Date(status.last_run_at).toLocaleDateString('es-AR')}` : ''}
            </p>
          </div>
        </div>

        {status.can_rollback && (
          <div className="pt-2 border-t border-slate-800">
            {!showRollback ? (
              <button
                onClick={() => setShowRollback(true)}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                ↩ Revertir corte (avanzado)
              </button>
            ) : (
              <div className="space-y-3 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                <p className="text-xs text-red-400 font-medium">
                  ⚠ Esto eliminará los movimientos de saldo inicial generados y reseteará los candidatos a &ldquo;aprobado&rdquo;.
                </p>
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input type="checkbox" checked={rollbackConfirmed} onChange={(e) => setRollbackConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-red-500" />
                  Confirmo que quiero revertir el corte
                </label>
                <div className="flex gap-2">
                  <button onClick={handleRollback} disabled={!rollbackConfirmed || isPending}
                    className="px-3 py-1.5 bg-red-500 hover:bg-red-400 text-white text-xs font-semibold rounded-lg
                      disabled:opacity-50 transition-colors">
                    Revertir corte
                  </button>
                  <button onClick={() => { setShowRollback(false); setRollbackConfirmed(false) }}
                    className="px-3 py-1.5 bg-slate-700 text-slate-300 text-xs font-medium rounded-lg hover:bg-slate-600 transition-colors">
                    Cancelar
                  </button>
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-5">
      <h2 className="font-semibold text-white">Ejecutar corte</h2>

      {/* Result display */}
      {result && (
        <div className={`p-4 rounded-xl border ${
          result.dry_run
            ? 'bg-blue-500/5 border-blue-500/20'
            : 'bg-emerald-500/5 border-emerald-500/20'
        }`}>
          <p className="text-sm font-medium text-white mb-2">
            {result.dry_run ? '🔍 Simulación completada' : '✅ Corte ejecutado'}
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xl font-bold text-emerald-400">{result.applied ?? 0}</div>
              <div className="text-xs text-slate-500">{result.dry_run ? 'Se aplicarían' : 'Aplicados'}</div>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-400">{result.failed ?? 0}</div>
              <div className="text-xs text-slate-500">Fallidos</div>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-500">
                {(result.errors?.length ?? 0)}
              </div>
              <div className="text-xs text-slate-500">Errores</div>
            </div>
          </div>
          {(result.errors?.length ?? 0) > 0 && (
            <div className="mt-3 space-y-1">
              {result.errors!.slice(0, 5).map((e, i) => (
                <p key={i} className="text-xs text-red-400">· {e}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {rollbackResult && (
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
          <p className="text-sm font-medium text-emerald-300">Rollback completado</p>
          <p className="text-xs text-slate-400 mt-1">
            {rollbackResult.deleted_movements} movimientos eliminados ·{' '}
            {rollbackResult.reset_candidates} candidatos reseteados
          </p>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Notas (opcional)
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej: Corte inicial — apertura Mayo 2025"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200
            placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
          maxLength={500}
        />
      </div>

      {/* Confirm checkbox */}
      {!status.has_run && (
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-800 text-brand-500"
          />
          <span className="text-sm text-slate-300">
            Confirmo que revisé y aprobé todos los saldos iniciales y quiero aplicar el corte.
          </span>
        </label>
      )}

      {error && (
        <p className="text-sm text-red-400 flex items-center gap-1.5">
          <span>✕</span> {error}
        </p>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => handleExecute(true)}
          disabled={isPending || !preflight.ok}
          className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-sm
            rounded-xl border border-slate-600 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Procesando...' : '🔍 Simular (dry-run)'}
        </button>
        <button
          onClick={() => handleExecute(false)}
          disabled={isPending || !preflight.ok || (!confirmed && !status.has_run)}
          className="flex-1 px-4 py-2.5 bg-brand-500 hover:bg-brand-400 text-white font-semibold text-sm
            rounded-xl border border-brand-400 shadow-lg shadow-brand-900/40 transition-all active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Ejecutando...' : '⚡ Ejecutar corte'}
        </button>
      </div>
    </div>
  )
}
