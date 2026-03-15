/**
 * app/(app)/migration/page.tsx
 * Migration hub — lists import runs and provides navigation to the full workflow.
 */

import Link from 'next/link'
import { getImportRuns } from '@/lib/server/migration-import'
import { getCutoverStatus } from '@/lib/server/cutover'
import { getOpeningBalanceStats } from '@/lib/server/opening-balances'
import { IMPORT_RUN_STATUSES } from '@/lib/validations/migration'

function statusColor(status: string) {
  switch (status) {
    case 'completed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    case 'partial':   return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    case 'running':   return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
    case 'failed':    return 'text-red-400 bg-red-500/10 border-red-500/30'
    default:          return 'text-slate-400 bg-slate-500/10 border-slate-500/30'
  }
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Pendiente', running: 'Procesando',
    completed: 'Completado', failed: 'Error', partial: 'Parcial',
  }
  return map[status] ?? status
}

export default async function MigrationPage() {
  const [runs, cutoverStatus, balanceStats] = await Promise.all([
    getImportRuns(),
    getCutoverStatus(),
    getOpeningBalanceStats(),
  ])

  const stepsComplete = [
    runs.some((r) => r.status === 'completed' || r.status === 'partial'),
    balanceStats.approved > 0,
    cutoverStatus.has_run,
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Migración de Datos Legados</h1>
            <p className="mt-1 text-sm text-slate-400">
              Importa, revisa y aplica el saldo inicial desde sistemas anteriores.
            </p>
          </div>
          <Link
            href="/migration/import"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm
              bg-brand-500 hover:bg-brand-400 text-white shadow-lg shadow-brand-900/40
              border border-brand-400 transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Nueva importación
          </Link>
        </div>

        {/* Progress steps */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '1. Importar', sub: 'Cargar archivos legados', href: '/migration/import', done: stepsComplete[0] },
            { label: '2. Revisar', sub: 'Validar y aprobar filas', href: '/migration/review', done: stepsComplete[1] },
            { label: '3. Corte', sub: 'Aplicar saldos iniciales', href: '/migration/cutover', done: stepsComplete[2] },
          ].map((step, i) => (
            <Link
              key={i}
              href={step.href}
              className={`p-4 rounded-xl border transition-all hover:border-slate-600
                ${step.done
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : 'bg-slate-900/60 border-slate-800'
                }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                  ${step.done ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                  {step.done ? '✓' : i + 1}
                </div>
                <span className="font-semibold text-sm text-white">{step.label}</span>
              </div>
              <p className="text-xs text-slate-400 pl-7">{step.sub}</p>
            </Link>
          ))}
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Importaciones', value: runs.length, color: 'text-blue-400' },
            { label: 'Candidatos pendientes', value: balanceStats.pending, color: 'text-amber-400' },
            { label: 'Candidatos aprobados', value: balanceStats.approved, color: 'text-emerald-400' },
            { label: 'Saldos aplicados', value: balanceStats.applied, color: 'text-brand-400' },
          ].map((s) => (
            <div key={s.label} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Cutover status banner */}
        {cutoverStatus.has_run && (
          <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-300">Corte ejecutado</p>
              <p className="text-xs text-slate-400">
                {cutoverStatus.applied_count} saldos aplicados
                {cutoverStatus.last_run_at
                  ? ` · ${new Date(cutoverStatus.last_run_at).toLocaleDateString('es-AR')}`
                  : ''}
              </p>
            </div>
            <Link
              href="/migration/cutover"
              className="ml-auto text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Ver detalles →
            </Link>
          </div>
        )}

        {/* Import runs table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-white">Historial de importaciones</h2>
            <span className="text-xs text-slate-500">{runs.length} registros</span>
          </div>

          {runs.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-800 mx-auto mb-3 flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm">No hay importaciones aún</p>
              <Link href="/migration/import" className="mt-3 inline-block text-sm text-brand-400 hover:text-brand-300 font-medium">
                Comenzar primera importación →
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {['Archivo', 'Tipo', 'Estado', 'Filas', 'Revisión', 'Fecha', ''].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {runs.map((run) => (
                      <tr key={run.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-100 max-w-[200px] truncate">
                          {run.filename}
                        </td>
                        <td className="px-4 py-3 text-slate-400 capitalize">{run.import_type}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${statusColor(run.status)}`}>
                            {statusLabel(run.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{run.total_rows}</td>
                        <td className="px-4 py-3">
                          {run.needs_review > 0 ? (
                            <span className="text-amber-400 font-medium">{run.needs_review} pendientes</span>
                          ) : (
                            <span className="text-emerald-400 text-xs">OK</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {new Date(run.started_at).toLocaleDateString('es-AR')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/migration/review?import_run_id=${run.id}`}
                            className="text-xs text-brand-400 hover:text-brand-300 font-medium"
                          >
                            Revisar →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="sm:hidden divide-y divide-slate-800">
                {runs.map((run) => (
                  <Link
                    key={run.id}
                    href={`/migration/review?import_run_id=${run.id}`}
                    className="flex items-center justify-between p-4 hover:bg-slate-800/40"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-100 truncate">{run.filename}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {run.total_rows} filas · {new Date(run.started_at).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <span className={`ml-3 flex-shrink-0 px-2 py-1 rounded-lg text-xs font-medium border ${statusColor(run.status)}`}>
                      {statusLabel(run.status)}
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Revisar filas', href: '/migration/review', icon: '🔍' },
            { label: 'Saldos iniciales', href: '/migration/opening-balances', icon: '📊' },
            { label: 'Ejecutar corte', href: '/migration/cutover', icon: '⚡' },
            { label: 'Exportar revisión', href: '/api/migration/review?format=xlsx', icon: '📥', external: true },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors text-center"
            >
              <span className="text-lg">{link.icon}</span>
              <p className="text-xs text-slate-400 mt-1 font-medium">{link.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
