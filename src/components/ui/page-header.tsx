/**
 * components/ui/page-header.tsx
 * Standardised page header with title, subtitle, and action slot.
 */

import React from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  back?: { href: string; label?: string }
  actions?: React.ReactNode
  meta?: React.ReactNode
}

export default function PageHeader({ title, subtitle, back, actions, meta }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3 min-w-0">
        {back && (
          <a
            href={back.href}
            aria-label={back.label ?? 'Volver'}
            className="mt-0.5 p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800
              transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
        )}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight truncate">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
          {meta && <div className="mt-1.5">{meta}</div>}
        </div>
      </div>

      {actions && (
        <div className="flex-shrink-0 flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}
