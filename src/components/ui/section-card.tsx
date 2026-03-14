/**
 * components/ui/section-card.tsx
 * Standardised content card with optional header and footer.
 */

import React from 'react'

interface SectionCardProps {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
}

export default function SectionCard({
  title,
  subtitle,
  actions,
  children,
  footer,
  padding = 'none',
  className = '',
}: SectionCardProps) {
  const padMap = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' }

  return (
    <div className={`bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div>
            {title && <h2 className="font-semibold text-white text-sm sm:text-base">{title}</h2>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      <div className={padMap[padding]}>{children}</div>

      {footer && (
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/40">
          {footer}
        </div>
      )}
    </div>
  )
}
