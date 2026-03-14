/**
 * app/(app)/migration/opening-balances/page.tsx
 * Opening balance candidate review — approve, exclude, correct before cutover.
 */

import { Suspense } from 'react'
import Link from 'next/link'
import { getOpeningBalanceCandidates, getOpeningBalanceStats } from '@/lib/server/opening-balances'
import { getImportRuns } from '@/lib/server/migration-import'
import OpeningBalanceTable from '@/components/migration/opening-balance-table'
import type { OpeningBalanceFilterInput } from '@/lib/validations/migration'
import { CONFIDENCE_LABELS } from '@/lib/validations/migration'

interface PageProps {
  searchParams: Promise<{
    location_id?: string
    confidence?: string
    status?: string
    unresolved_only?: string
    page?: string
  }>
}

export default async function OpeningBalancesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Number(params.page ?? 1)

  const filter: Partial<OpeningBalanceFilterInput> = {
    page,
    page_size: 100,
  }
  if (params.location_id) filter.location_id = params.location_id
  if (params.confidence) filter.confidence = params.confidence as OpeningBalanceFilterInput['confidence']
  if (params.status) filter.status = params.status as OpeningBalanceFilterInput['status']
  if (params.unresolved_only === '1') filter.unresolved_only = true

  const [result, stats] = await Promise.all([
    getOpeningBalanceCandidates(filter),
    getOpeningBalanceStats(),
  ])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              <h1 className="text-xl font-bold text-white">Saldos iniciales</h1>
              <p className="text-sm text-slate-400">
                Revisa y aprueba los saldos derivados de snapshots legados.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/api/migration/opening-balances?format=xlsx"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 border border-slate-700
                hover:border-slate-600 hover:text-white transition-colors"
            >
              Exportar Excel
            </Link>
            <Link
              href="/migration/cutover"
              className="px-3 py-2 rounded-lg text-sm font-medium bg-brand-500 hover:bg-brand-400
                text-white border border-brand-400 transition-colors"
            >
              Ir al corte →
            </Link>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Pendientes', value: stats.pending, color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/20' },
            { label: 'Aprobados', value: stats.approved, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20' },
            { label: 'Excluidos', value: stats.excluded, color: 'text-slate-400', bg: 'bg-slate-900/60 border-slate-800' },
            { label: 'Aplicados', value: stats.applied, color: 'text-brand-400', bg: 'bg-brand-500/5 border-brand-500/20' },
            { label: 'Sin resolver', value: stats.unresolved, color: 'text-red-400', bg: 'bg-red-500/5 border-red-500/20' },
          ].map((s) => (
            <div key={s.label} className={`p-4 rounded-xl border ${s.bg}`}>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Ready to apply banner */}
        {stats.approved > 0 && stats.applied === 0 && (
          <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-300">
                  {stats.approved} candidatos aprobados listos para aplicar
                </p>
                <p className="text-xs text-slate-400">El corte creará movimientos de saldo inicial para todos.</p>
              </div>
            </div>
            <Link
              href="/migration/cutover"
              className="flex-shrink-0 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white
                font-semibold text-sm rounded-lg transition-colors"
            >
              Ejecutar corte
            </Link>
          </div>
        )}

        {/* Filters */}
        <form method="GET" className="flex flex-wrap gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <select
            name="confidence"
            defaultValue={params.confidence ?? ''}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300
              focus:outline-none focus:border-brand-500"
          >
            <option value="">Toda confianza</option>
            {(['high', 'medium', 'low', 'unresolved'] as const).map((c) => (
              <option key={c} value={c}>{CONFIDENCE_LABELS[c]}</option>
            ))}
          </select>

          <select
            name="status"
            defaultValue={params.status ?? ''}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300
              focus:outline-none focus:border-brand-500"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="approved">Aprobado</option>
            <option value="excluded">Excluido</option>
            <option value="applied">Aplicado</option>
          </select>

          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              name="unresolved_only"
              value="1"
              defaultChecked={params.unresolved_only === '1'}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-brand-500"
            />
            Solo sin resolver
          </label>

          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
          >
            Filtrar
          </button>
        </form>

        {/* Table */}
        <Suspense fallback={
          <div className="h-96 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
        }>
          <OpeningBalanceTable
            candidates={result.candidates}
            total={result.total}
            page={page}
            pageSize={100}
          />
        </Suspense>

        {/* Pagination */}
        {result.total > 100 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Página {page} · {Math.ceil(result.total / 100)} páginas
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-700"
                >
                  ← Anterior
                </Link>
              )}
              {result.hasMore && (
                <Link
                  href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-700"
                >
                  Siguiente →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
