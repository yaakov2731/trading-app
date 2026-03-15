/**
 * components/ui/empty-list-state.tsx
 * Consistent empty state for list/table views inside section cards.
 */

import Link from 'next/link'

interface EmptyListStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  createHref?: string
  createLabel?: string
}

const DEFAULT_ICON = (
  <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
  </svg>
)

export default function EmptyListState({
  icon = DEFAULT_ICON,
  title,
  description,
  createHref,
  createLabel = 'Crear nuevo',
}: EmptyListStateProps) {
  return (
    <div className="py-14 text-center px-6">
      <div className="w-12 h-12 rounded-2xl bg-slate-800 mx-auto mb-3 flex items-center justify-center">
        {icon}
      </div>
      <p className="text-sm font-medium text-slate-400">{title}</p>
      {description && <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">{description}</p>}
      {createHref && (
        <Link
          href={createHref}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
            bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {createLabel}
        </Link>
      )}
    </div>
  )
}
