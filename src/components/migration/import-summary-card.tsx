/**
 * components/migration/import-summary-card.tsx
 * Post-import result summary card shown after a successful import run.
 */

'use client'

import Link from 'next/link'
import type { ImportSummary } from '@/lib/server/migration-import'

interface ImportSummaryCardProps {
  runId: string
  filename: string
  summary: ImportSummary
  importType: string
}

export default function ImportSummaryCard({
  runId,
  filename,
  summary,
  importType,
}: ImportSummaryCardProps) {
  const totalWithIssues = summary.needs_review
  const totalClean = summary.approved

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-white">Importación completada</h3>
          <p className="text-sm text-slate-400 truncate max-w-xs">{filename}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total filas', value: summary.total, color: 'text-slate-300' },
          { label: 'Limpias', value: totalClean, color: 'text-emerald-400' },
          { label: 'Para revisar', value: totalWithIssues, color: totalWithIssues > 0 ? 'text-amber-400' : 'text-slate-500' },
          { label: 'Fallidas', value: summary.failed, color: summary.failed > 0 ? 'text-red-400' : 'text-slate-500' },
        ].map((s) => (
          <div key={s.label} className="text-center p-3 bg-slate-800/50 rounded-xl">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Type tag */}
      <div className="flex items-center gap-2">
        <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-400">
          Tipo: <span className="text-slate-200 font-medium capitalize">{importType}</span>
        </span>
        {totalWithIssues > 0 && (
          <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400">
            {totalWithIssues} filas requieren revisión
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        {totalWithIssues > 0 ? (
          <Link
            href={`/migration/review?import_run_id=${runId}`}
            className="flex-1 text-center px-4 py-2.5 bg-brand-500 hover:bg-brand-400 text-white font-semibold
              text-sm rounded-xl border border-brand-400 shadow-lg shadow-brand-900/40 transition-all active:scale-95"
          >
            Revisar filas →
          </Link>
        ) : (
          <Link
            href="/migration/opening-balances"
            className="flex-1 text-center px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold
              text-sm rounded-xl border border-emerald-400 shadow-lg shadow-emerald-900/40 transition-all active:scale-95"
          >
            Ver saldos iniciales →
          </Link>
        )}
        <Link
          href="/migration"
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium
            text-sm rounded-xl border border-slate-700 transition-colors"
        >
          Volver
        </Link>
      </div>
    </div>
  )
}
