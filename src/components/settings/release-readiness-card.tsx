/**
 * components/settings/release-readiness-card.tsx
 * Release readiness overview by category.
 */

import type { ReleaseReadinessReport, ReadinessLevel } from '@/lib/server/release-readiness'

function levelStyle(level: ReadinessLevel): string {
  return {
    ready:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    partial: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    blocked: 'text-red-400 bg-red-500/10 border-red-500/30',
  }[level]
}

function levelLabel(level: ReadinessLevel): string {
  return { ready: 'Listo', partial: 'Parcial', blocked: 'Bloqueado' }[level]
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 90 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-slate-400 w-8 text-right">{score}%</span>
    </div>
  )
}

interface ReleaseReadinessCardProps {
  report: ReleaseReadinessReport
}

export default function ReleaseReadinessCard({ report }: ReleaseReadinessCardProps) {
  const overallStyle = levelStyle(report.overall)

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-white">Preparación para producción</h2>
            <p className="text-sm text-slate-400 mt-1">{report.summary}</p>
          </div>
          <div className="flex-shrink-0 text-center">
            <div className={`text-3xl font-bold ${
              report.overallScore >= 80 ? 'text-emerald-400' :
              report.overallScore >= 60 ? 'text-amber-400' : 'text-red-400'
            }`}>{report.overallScore}%</div>
            <div className={`mt-1 px-2 py-0.5 rounded-lg text-xs font-medium border ${overallStyle}`}>
              {levelLabel(report.overall)}
            </div>
          </div>
        </div>
      </div>

      {/* Category grid */}
      <div className="p-5 grid sm:grid-cols-2 gap-4">
        {report.categories.map((cat) => (
          <div key={cat.id} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-slate-200 font-medium">{cat.label}</span>
              <span className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border ${levelStyle(cat.level)}`}>
                {levelLabel(cat.level)}
              </span>
            </div>
            <ScoreBar score={cat.score} />
            {cat.items.filter((i) => !i.done).length > 0 && (
              <ul className="space-y-0.5">
                {cat.items.filter((i) => !i.done).slice(0, 2).map((item, j) => (
                  <li key={j} className="text-xs text-slate-500 flex items-start gap-1">
                    <span className="mt-0.5 text-slate-600">·</span>
                    <span className="truncate">{item.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Blockers */}
      {report.blockers.length > 0 && (
        <div className="px-5 pb-5">
          <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
            <p className="text-xs font-semibold text-red-400 mb-1.5">Bloqueantes antes de producción:</p>
            <ul className="space-y-0.5">
              {report.blockers.map((b, i) => (
                <li key={i} className="text-xs text-red-300/80 flex items-start gap-1.5">
                  <span className="mt-0.5 text-red-500">✕</span> {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
