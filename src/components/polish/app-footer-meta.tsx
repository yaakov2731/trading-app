/**
 * components/polish/app-footer-meta.tsx
 * Small contextual footer with app version, session info, and keyboard hint.
 */

interface AppFooterMetaProps {
  version?: string
  environment?: string
  userRole?: string
  locationName?: string
}

export default function AppFooterMeta({
  version = '1.0.0',
  environment,
  userRole,
  locationName,
}: AppFooterMetaProps) {
  const isDev = environment === 'development'

  return (
    <div className="flex items-center justify-between px-4 py-2 text-xs text-slate-600
      border-t border-slate-800/50">
      <div className="flex items-center gap-3">
        <span>v{version}</span>
        {isDev && (
          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
            DEV
          </span>
        )}
        {locationName && (
          <span className="text-slate-500">{locationName}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {userRole && (
          <span className="capitalize">{userRole}</span>
        )}
        <span className="hidden sm:inline">
          <kbd className="font-mono">⌘K</kbd> búsqueda rápida
        </span>
      </div>
    </div>
  )
}
