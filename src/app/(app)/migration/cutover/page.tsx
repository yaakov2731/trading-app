/**
 * app/(app)/migration/cutover/page.tsx
 * Cutover execution page — pre-flight, dry-run, confirm + execute.
 */

import Link from 'next/link'
import { getCutoverStatus, runCutoverPreflight } from '@/lib/server/cutover'
import { getOpeningBalanceStats } from '@/lib/server/opening-balances'
import CutoverStatusCard from '@/components/migration/cutover-status-card'

export default async function CutoverPage() {
  const [cutoverStatus, preflight, balanceStats] = await Promise.all([
    getCutoverStatus(),
    runCutoverPreflight(),
    getOpeningBalanceStats(),
  ])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/migration"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Ejecución del corte</h1>
            <p className="text-sm text-slate-400">
              Aplica los saldos iniciales aprobados al inventario real.
            </p>
          </div>
        </div>

        {/* Pre-flight summary */}
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
          <h2 className="font-semibold text-white">Verificación previa</h2>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Listos para aplicar', value: preflight.approved_ready, ok: preflight.approved_ready > 0, color: 'text-emerald-400' },
              { label: 'Sin producto vinculado', value: preflight.unresolved_product, ok: preflight.unresolved_product === 0, color: 'text-red-400' },
              { label: 'Sin ubicación vinculada', value: preflight.unresolved_location, ok: preflight.unresolved_location === 0, color: 'text-red-400' },
              { label: 'Ya aplicados', value: balanceStats.applied, ok: true, color: 'text-slate-400' },
            ].map((item) => (
              <div key={item.label} className={`p-3 rounded-xl border ${
                item.ok ? 'bg-slate-800/50 border-slate-700' : 'bg-red-500/5 border-red-500/30'
              }`}>
                <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>

          {preflight.warnings.length > 0 && (
            <div className="space-y-1">
              {preflight.warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-400 flex items-start gap-1.5">
                  <span className="mt-0.5">⚠</span> {w}
                </p>
              ))}
            </div>
          )}

          {preflight.blocking_errors.length > 0 && (
            <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg space-y-1">
              {preflight.blocking_errors.map((e, i) => (
                <p key={i} className="text-xs text-red-400 flex items-start gap-1.5">
                  <span className="mt-0.5">✕</span> {e}
                </p>
              ))}
            </div>
          )}

          {preflight.ok && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-xs text-emerald-300">
                Verificación pasada — {preflight.approved_ready} saldos listos para aplicar.
              </p>
            </div>
          )}
        </div>

        {/* Cutover execution card */}
        <CutoverStatusCard
          status={cutoverStatus}
          preflight={preflight}
          balanceStats={balanceStats}
        />

        {/* Warning section */}
        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
          <h3 className="text-sm font-semibold text-amber-300 mb-2">⚠ Antes de ejecutar el corte</h3>
          <ul className="space-y-1 text-xs text-slate-400 list-disc list-inside">
            <li>Asegurate de haber revisado y aprobado todos los saldos iniciales.</li>
            <li>El corte crea movimientos de tipo <code className="text-brand-400">opening_stock</code> en el inventario real.</li>
            <li>El proceso es idempotente — no genera duplicados si se ejecuta dos veces.</li>
            <li>El rollback elimina los movimientos generados y resetea el estado de los candidatos.</li>
            <li>Después del corte, el inventario refleja los saldos del archivo legado.</li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <Link
            href="/migration/opening-balances"
            className="flex-1 text-center px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700
              text-slate-300 font-medium text-sm rounded-xl transition-colors"
          >
            ← Revisar saldos
          </Link>
          <Link
            href="/migration"
            className="flex-1 text-center px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700
              text-slate-300 font-medium text-sm rounded-xl transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
