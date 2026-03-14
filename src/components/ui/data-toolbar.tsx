/**
 * components/ui/data-toolbar.tsx
 * Standardised toolbar above data tables/lists.
 * Contains: result count, export link, bulk actions, view toggles.
 */

import React from 'react'
import Link from 'next/link'

interface DataToolbarProps {
  count?: number
  countLabel?: string
  exportHref?: string
  exportLabel?: string
  actions?: React.ReactNode
  className?: string
}

export default function DataToolbar({
  count,
  countLabel = 'resultados',
  exportHref,
  exportLabel = 'Exportar',
  actions,
  className = '',
}: DataToolbarProps) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      {count !== undefined ? (
        <p className="text-sm text-slate-500">
          <span className="text-slate-300 font-medium">{count.toLocaleString('es-AR')}</span>{' '}
          {countLabel}
        </p>
      ) : <div />}

      <div className="flex items-center gap-2">
        {actions}
        {exportHref && (
          <Link
            href={exportHref}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
              text-slate-300 border border-slate-700 hover:border-slate-600 hover:text-white
              transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exportLabel}
          </Link>
        )}
      </div>
    </div>
  )
}
