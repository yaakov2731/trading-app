/**
 * app/(app)/migration/review/page.tsx
 * Review queue — validate and action imported rows before cutover.
 */

import { Suspense } from 'react'
import Link from 'next/link'
import { getReviewRows, getReviewIssueCodes } from '@/lib/server/migration-review'
import { getImportRuns } from '@/lib/server/migration-import'
import ReviewQueueTable from '@/components/migration/review-queue-table'
import type { ReviewFilterInput } from '@/lib/validations/migration'

interface PageProps {
  searchParams: Promise<{
    import_run_id?: string
    status?: string
    issue_type?: string
    page?: string
  }>
}

export default async function MigrationReviewPage({ searchParams }: PageProps) {
  const params = await searchParams
  const importRunId = params.import_run_id
  const status = params.status
  const issueType = params.issue_type
  const page = Number(params.page ?? 1)

  const filter: Partial<ReviewFilterInput> = {
    page,
    page_size: 50,
  }
  if (importRunId) filter.import_run_id = importRunId
  if (status && status !== 'all') filter.status = status as ReviewFilterInput['status']
  if (issueType) filter.issue_type = issueType

  const [result, issueCodes, runs] = await Promise.all([
    getReviewRows(filter),
    getReviewIssueCodes(importRunId),
    getImportRuns(),
  ])

  const selectedRun = runs.find((r) => r.id === importRunId)

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
              <h1 className="text-xl font-bold text-white">Cola de revisión</h1>
              <p className="text-sm text-slate-400">
                {selectedRun ? selectedRun.filename : 'Todas las importaciones'} ·{' '}
                {result.total} filas
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/api/migration/review?format=xlsx"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 border border-slate-700
                hover:border-slate-600 hover:text-white transition-colors"
            >
              Exportar
            </Link>
            <Link
              href="/migration/opening-balances"
              className="px-3 py-2 rounded-lg text-sm font-medium bg-brand-500 hover:bg-brand-400
                text-white border border-brand-400 transition-colors"
            >
              Saldos iniciales →
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          {/* Run selector */}
          <form method="GET" className="flex gap-2 flex-wrap">
            <select
              name="import_run_id"
              defaultValue={importRunId ?? ''}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300
                focus:outline-none focus:border-brand-500"
              onChange={(e) => {}}
            >
              <option value="">Todas las importaciones</option>
              {runs.map((r) => (
                <option key={r.id} value={r.id}>{r.filename}</option>
              ))}
            </select>

            <select
              name="status"
              defaultValue={status ?? ''}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300
                focus:outline-none focus:border-brand-500"
            >
              <option value="">Estado: Todos</option>
              <option value="needs_review">Necesita revisión</option>
              <option value="pending">Pendiente</option>
              <option value="matched">Vinculado</option>
              <option value="failed">Error</option>
              <option value="skipped">Omitido</option>
            </select>

            {issueCodes.length > 0 && (
              <select
                name="issue_type"
                defaultValue={issueType ?? ''}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300
                  focus:outline-none focus:border-brand-500"
              >
                <option value="">Todos los problemas</option>
                {issueCodes.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            )}

            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm
                font-medium transition-colors"
            >
              Filtrar
            </button>
          </form>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { label: 'Total', value: result.total, color: 'text-slate-300' },
            { label: 'Revisión', value: result.rows.filter((r) => r.status === 'needs_review').length, color: 'text-amber-400' },
            { label: 'Pendiente', value: result.rows.filter((r) => r.status === 'pending').length, color: 'text-blue-400' },
            { label: 'Vinculado', value: result.rows.filter((r) => r.status === 'matched').length, color: 'text-emerald-400' },
            { label: 'Error', value: result.rows.filter((r) => r.status === 'failed').length, color: 'text-red-400' },
            { label: 'Omitido', value: result.rows.filter((r) => r.status === 'skipped').length, color: 'text-slate-500' },
          ].map((s) => (
            <div key={s.label} className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg text-center">
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-600">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Review table */}
        <Suspense fallback={
          <div className="h-96 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
        }>
          <ReviewQueueTable
            rows={result.rows}
            total={result.total}
            page={page}
            pageSize={50}
            importRunId={importRunId}
          />
        </Suspense>

        {/* Pagination */}
        {result.total > 50 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Página {page} · {Math.ceil(result.total / 50)} total
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
