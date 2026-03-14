/**
 * components/ui/mobile-action-bar.tsx
 * Sticky bottom action bar for mobile — shown on small screens only.
 */

import React from 'react'

interface MobileActionBarProps {
  children: React.ReactNode
  className?: string
}

export default function MobileActionBar({ children, className = '' }: MobileActionBarProps) {
  return (
    <div className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-safe-bottom
      pt-3 pb-3 bg-slate-950/95 border-t border-slate-800 backdrop-blur-sm ${className}`}>
      <div className="flex items-center gap-2">
        {children}
      </div>
    </div>
  )
}

// ── Mobile primary action ─────────────────────────────────────────────────────

interface MobilePrimaryActionProps {
  label: string
  onClick?: () => void
  href?: string
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit'
}

export function MobilePrimaryAction({
  label,
  onClick,
  href,
  disabled,
  loading,
  type = 'button',
}: MobilePrimaryActionProps) {
  const className = `flex-1 py-3 rounded-xl font-semibold text-sm text-white
    bg-brand-500 hover:bg-brand-400 border border-brand-400 shadow-lg shadow-brand-900/40
    transition-all active:scale-[0.98] disabled:opacity-60 text-center`

  if (href) {
    return <a href={href} className={className}>{label}</a>
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Cargando...
        </span>
      ) : label}
    </button>
  )
}
