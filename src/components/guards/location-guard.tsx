/**
 * components/guards/location-guard.tsx
 * UI guard for location-scoped access control.
 */

'use client'

interface LocationGuardProps {
  locationId: string
  accessibleLocationIds: string[] | 'all'
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function LocationGuard({
  locationId,
  accessibleLocationIds,
  children,
  fallback = null,
}: LocationGuardProps) {
  const hasAccess =
    accessibleLocationIds === 'all' ||
    accessibleLocationIds.includes(locationId)

  if (!hasAccess) return <>{fallback}</>
  return <>{children}</>
}

// ── Location access indicator ─────────────────────────────────────────────────

interface LocationAccessBadgeProps {
  locationId: string
  accessibleLocationIds: string[] | 'all'
  locationName: string
}

export function LocationAccessBadge({
  locationId,
  accessibleLocationIds,
  locationName,
}: LocationAccessBadgeProps) {
  const hasAccess =
    accessibleLocationIds === 'all' ||
    accessibleLocationIds.includes(locationId)

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-medium border ${
      hasAccess
        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
        : 'text-slate-500 bg-slate-700/50 border-slate-600/50'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${hasAccess ? 'bg-emerald-400' : 'bg-slate-500'}`} />
      {locationName}
    </span>
  )
}

// ── No access placeholder ─────────────────────────────────────────────────────

export function NoLocationAccess({ locationName }: { locationName: string }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
      <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      <p className="text-xs text-slate-500">
        Sin acceso a <span className="font-medium text-slate-400">{locationName}</span>
      </p>
    </div>
  )
}
