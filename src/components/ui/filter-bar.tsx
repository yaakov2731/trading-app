/**
 * components/ui/filter-bar.tsx
 * Standardised filter bar — wraps filter controls with consistent styling.
 */

import React from 'react'

interface FilterBarProps {
  children: React.ReactNode
  className?: string
  onSubmit?: (e: React.FormEvent) => void
  method?: 'GET' | 'POST'
  action?: string
}

export default function FilterBar({ children, className = '', onSubmit, method = 'GET', action }: FilterBarProps) {
  if (onSubmit) {
    return (
      <div className={`p-3 sm:p-4 bg-slate-900/60 border border-slate-800 rounded-xl ${className}`}>
        <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2 sm:gap-3">
          {children}
        </form>
      </div>
    )
  }

  return (
    <div className={`p-3 sm:p-4 bg-slate-900/60 border border-slate-800 rounded-xl ${className}`}>
      <form method={method} action={action} className="flex flex-wrap items-center gap-2 sm:gap-3">
        {children}
      </form>
    </div>
  )
}

// ── Filter Select ─────────────────────────────────────────────────────────────

interface FilterSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export function FilterSelect({ label, className = '', ...props }: FilterSelectProps) {
  return (
    <select
      {...props}
      className={`px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300
        focus:outline-none focus:border-brand-500 transition-colors ${className}`}
    />
  )
}

// ── Filter Submit ─────────────────────────────────────────────────────────────

export function FilterSubmit({ label = 'Filtrar' }: { label?: string }) {
  return (
    <button
      type="submit"
      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm
        font-medium transition-colors"
    >
      {label}
    </button>
  )
}

// ── Filter Reset ──────────────────────────────────────────────────────────────

export function FilterReset({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="px-3 py-1.5 text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
    >
      Limpiar
    </a>
  )
}
