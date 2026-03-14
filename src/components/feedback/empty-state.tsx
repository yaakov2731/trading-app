/**
 * components/feedback/empty-state.tsx
 * Reusable empty state component with premium styling.
 */

import Link from 'next/link'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  secondaryAction?: {
    label: string
    href?: string
    onClick?: () => void
  }
  size?: 'sm' | 'md' | 'lg'
}

const DEFAULT_ICON = (
  <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
  </svg>
)

export default function EmptyState({
  icon = DEFAULT_ICON,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
}: EmptyStateProps) {
  const iconSize = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-16 h-16' : 'w-12 h-12'
  const padding = size === 'sm' ? 'py-10' : size === 'lg' ? 'py-24' : 'py-16'
  const titleSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'

  return (
    <div className={`flex flex-col items-center justify-center ${padding} text-center px-6`}>
      <div className={`${iconSize} rounded-2xl bg-slate-800/80 flex items-center justify-center mb-4`}>
        {icon}
      </div>

      <h3 className={`font-semibold text-slate-300 ${titleSize}`}>{title}</h3>

      {description && (
        <p className="mt-1.5 text-sm text-slate-500 max-w-sm">{description}</p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-center">
          {action && (
            action.href ? (
              <Link
                href={action.href}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm
                  bg-brand-500 hover:bg-brand-400 text-white shadow-lg shadow-brand-900/40
                  border border-brand-400 transition-all active:scale-95"
              >
                {action.label}
              </Link>
            ) : (
              <button
                onClick={action.onClick}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm
                  bg-brand-500 hover:bg-brand-400 text-white shadow-lg shadow-brand-900/40
                  border border-brand-400 transition-all active:scale-95"
              >
                {action.label}
              </button>
            )
          )}

          {secondaryAction && (
            secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                className="text-sm text-slate-400 hover:text-slate-200 font-medium transition-colors"
              >
                {secondaryAction.label}
              </Link>
            ) : (
              <button
                onClick={secondaryAction.onClick}
                className="text-sm text-slate-400 hover:text-slate-200 font-medium transition-colors"
              >
                {secondaryAction.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
