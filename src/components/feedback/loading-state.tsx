/**
 * components/feedback/loading-state.tsx
 * Premium skeleton and loading state components.
 */

// ── Skeleton primitives ───────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-slate-800 rounded-lg ${className}`} />
  )
}

// ── Table skeleton ────────────────────────────────────────────────────────────

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="divide-y divide-slate-800">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton
                key={j}
                className={`h-4 ${j === 0 ? 'w-16' : j === 1 ? 'flex-1' : 'w-20'}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Card grid skeleton ────────────────────────────────────────────────────────

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}

// ── Page loading ──────────────────────────────────────────────────────────────

export function PageLoading({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  )
}

// ── Full page skeleton ────────────────────────────────────────────────────────

export default function LoadingState({ label }: { label?: string }) {
  return <PageLoading label={label} />
}

// ── Inline loading ────────────────────────────────────────────────────────────

export function InlineLoading({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 'w-5 h-5' : 'w-4 h-4'
  return (
    <div className={`${dim} border-2 border-brand-500 border-t-transparent rounded-full animate-spin flex-shrink-0`} />
  )
}

// ── List skeleton ─────────────────────────────────────────────────────────────

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  )
}
