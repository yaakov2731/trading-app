/**
 * components/ui/app-breadcrumbs.tsx
 * Lightweight breadcrumb navigation component.
 */

import Link from 'next/link'
import React from 'react'

interface Crumb {
  label: string
  href?: string
}

interface AppBreadcrumbsProps {
  crumbs: Crumb[]
  className?: string
}

export default function AppBreadcrumbs({ crumbs, className = '' }: AppBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 text-sm ${className}`}>
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <React.Fragment key={i}>
            {i > 0 && (
              <svg className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            {isLast || !crumb.href ? (
              <span className={isLast ? 'text-slate-300 font-medium' : 'text-slate-500'}>
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
