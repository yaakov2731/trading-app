/**
 * app/(app)/settings/system/page.tsx
 * System status / launch console — final operational overview.
 */

import Link from 'next/link'
import { runSystemHealthCheck } from '@/lib/server/system-health'
import { generateReleaseReadiness } from '@/lib/server/release-readiness'
import { runFinalAudit } from '@/lib/server/final-audit'
import { getBacklogSummary } from '@/lib/server/post-mvp-backlog'
import { getConsistencyGaps } from '@/lib/server/final-consistency'
import SystemStatusCard from '@/components/settings/system-status-card'
import ReleaseReadinessCard from '@/components/settings/release-readiness-card'
import KnownIssuesPanel from '@/components/settings/known-issues-panel'

export const dynamic = 'force-dynamic'

export default async function SystemStatusPage() {
  const [health, readiness, audit, backlogSummary, gaps] = await Promise.all([
    runSystemHealthCheck(),
    generateReleaseReadiness(),
    runFinalAudit(),
    Promise.resolve(getBacklogSummary()),
    Promise.resolve(getConsistencyGaps()),
  ])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Consola de lanzamiento</h1>
              <p className="text-sm text-slate-400">
                Estado operacional del sistema · MVP v1.0
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/api/system/health"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 border border-slate-700
                hover:border-slate-600 transition-colors"
            >
              JSON health
            </Link>
            <Link
              href="/api/system/readiness"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 border border-slate-700
                hover:border-slate-600 transition-colors"
            >
              JSON readiness
            </Link>
          </div>
        </div>

        {/* Top summary row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Puntaje de sistema',
              value: `${health.score}%`,
              color: health.score >= 80 ? 'text-emerald-400' : health.score >= 60 ? 'text-amber-400' : 'text-red-400',
              sub: `${health.checks.filter((c) => c.status === 'ok').length}/${health.checks.length} checks OK`,
            },
            {
              label: 'Preparación MVP',
              value: `${readiness.overallScore}%`,
              color: readiness.overallScore >= 80 ? 'text-emerald-400' : 'text-amber-400',
              sub: `${readiness.categories.filter((c) => c.level === 'ready').length}/${readiness.categories.length} categorías listas`,
            },
            {
              label: 'Archivos presentes',
              value: `${audit.present}/${audit.totalChecked}`,
              color: audit.criticalMissing === 0 ? 'text-emerald-400' : 'text-red-400',
              sub: audit.criticalMissing > 0 ? `${audit.criticalMissing} críticos faltantes` : 'Sin críticos faltantes',
            },
            {
              label: 'Backlog post-MVP',
              value: backlogSummary.total,
              color: 'text-brand-400',
              sub: `P1: ${backlogSummary.p1} · P2: ${backlogSummary.p2} · P3: ${backlogSummary.p3}`,
            },
          ].map((s) => (
            <div key={s.label} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              <div className="text-xs text-slate-600 mt-1">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Consistency gaps */}
        {gaps.length > 0 && (
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <p className="text-xs font-semibold text-amber-400 mb-1.5">Gaps de consistencia detectados:</p>
            <ul className="space-y-0.5">
              {gaps.map((g, i) => (
                <li key={i} className="text-xs text-slate-400">· {g}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Critical audit findings */}
        {audit.criticalMissing.length > 0 && (
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
            <p className="text-xs font-semibold text-red-400 mb-1.5">
              {audit.criticalMissing.length} archivos críticos no encontrados:
            </p>
            <div className="grid sm:grid-cols-2 gap-1">
              {audit.criticalMissing.map((item) => (
                <p key={item.path} className="text-xs text-slate-400 font-mono">
                  · {item.path}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Main content grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          <SystemStatusCard report={health} />
          <ReleaseReadinessCard report={readiness} />
        </div>

        {/* Known issues */}
        <KnownIssuesPanel />

        {/* Quick links */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">Módulos operacionales</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Dashboard', href: '/dashboard', icon: '📊' },
              { label: 'Inventario', href: '/products', icon: '📦' },
              { label: 'Compras', href: '/purchases', icon: '🛒' },
              { label: 'Transferencias', href: '/transfers', icon: '↔️' },
              { label: 'Conteos', href: '/counts', icon: '📋' },
              { label: 'Historial', href: '/history', icon: '📜' },
              { label: 'Migración', href: '/migration', icon: '🔄' },
              { label: 'Roles', href: '/settings/roles', icon: '🔐' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 p-3 bg-slate-800/50 border border-slate-700/50
                  rounded-xl hover:border-slate-600 transition-colors"
              >
                <span className="text-base">{link.icon}</span>
                <span className="text-sm text-slate-300 font-medium">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Docs */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">Documentación</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: 'MVP Closeout', href: '/docs/MVP_CLOSEOUT.md' },
              { label: 'Production Checklist', href: '/docs/PRODUCTION_CHECKLIST.md' },
              { label: 'Known Issues', href: '/docs/KNOWN_ISSUES.md' },
              { label: 'Post-MVP Backlog', href: '/docs/POST_MVP_BACKLOG.md' },
              { label: 'Smoke Test Plan', href: '/docs/SMOKE_TEST_PLAN.md' },
              { label: 'Release Notes', href: '/docs/RELEASE_NOTES_DRAFT.md' },
            ].map((doc) => (
              <div key={doc.label} className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-lg">
                <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-slate-400">{doc.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
