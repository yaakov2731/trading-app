/**
 * components/settings/system-status-card.tsx
 * System health check status card with grouped checks.
 */

import type { SystemHealthReport, HealthCheck, HealthStatus } from '@/lib/server/system-health'

function statusIcon(status: HealthStatus) {
  if (status === 'ok') return (
    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
  if (status === 'warning') return (
    <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v3.75M12 15.75h.007M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
  if (status === 'error') return (
    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
  return <span className="w-4 h-4 rounded-full bg-slate-600 flex-shrink-0" />
}

function overallBadge(status: HealthStatus, score: number) {
  const styles: Record<HealthStatus, string> = {
    ok:      'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    error:   'bg-red-500/10 border-red-500/30 text-red-400',
    unknown: 'bg-slate-700/50 border-slate-600 text-slate-400',
  }
  const labels: Record<HealthStatus, string> = {
    ok: 'Operacional', warning: 'Con advertencias', error: 'Problemas detectados', unknown: 'Sin verificar'
  }
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold ${styles[status]}`}>
      {statusIcon(status)}
      {labels[status]} · {score}%
    </span>
  )
}

function groupChecks(checks: HealthCheck[]): Record<string, HealthCheck[]> {
  return {
    'Entorno': checks.filter((c) => c.id.startsWith('env_') || c.id === 'node_env'),
    'Base de datos': checks.filter((c) => c.id.startsWith('db_')),
    'Auth y usuarios': checks.filter((c) => c.id.startsWith('auth_')),
  }
}

interface SystemStatusCardProps {
  report: SystemHealthReport
}

export default function SystemStatusCard({ report }: SystemStatusCardProps) {
  const groups = groupChecks(report.checks)

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-white">Estado del sistema</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verificado {new Date(report.generatedAt).toLocaleTimeString('es-AR')}
          </p>
        </div>
        {overallBadge(report.overall, report.score)}
      </div>

      <div className="divide-y divide-slate-800">
        {Object.entries(groups).map(([groupName, checks]) => (
          <div key={groupName} className="p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{groupName}</p>
            <div className="space-y-2">
              {checks.map((check) => (
                <div key={check.id} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex-shrink-0">{statusIcon(check.status)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-slate-200">{check.label}</span>
                      <span className={`text-xs font-medium flex-shrink-0 ${
                        check.status === 'ok' ? 'text-emerald-400' :
                        check.status === 'warning' ? 'text-amber-400' :
                        check.status === 'error' ? 'text-red-400' : 'text-slate-500'
                      }`}>{check.message}</span>
                    </div>
                    {check.detail && (
                      <p className="text-xs text-slate-500 mt-0.5">{check.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
