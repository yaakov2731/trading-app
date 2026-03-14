/**
 * components/ui/form-section.tsx
 * Standardised form section with title and optional description.
 */

import React from 'react'

interface FormSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export default function FormSection({ title, description, children, className = '' }: FormSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {(title || description) && (
        <div>
          {title && <h3 className="text-sm font-semibold text-slate-200">{title}</h3>}
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

// ── Form field wrapper ────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
  className?: string
}

export function FormField({ label, required, hint, error, children, className = '' }: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-sm font-medium text-slate-300">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ── Form row (side-by-side on desktop) ────────────────────────────────────────

export function FormRow({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  const colClass = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4' }[cols]
  return (
    <div className={`grid grid-cols-1 ${colClass} gap-4`}>
      {children}
    </div>
  )
}

// ── Form divider ──────────────────────────────────────────────────────────────

export function FormDivider({ label }: { label?: string }) {
  if (!label) return <hr className="border-slate-800" />
  return (
    <div className="flex items-center gap-3">
      <hr className="flex-1 border-slate-800" />
      <span className="text-xs text-slate-600 font-medium uppercase tracking-wider">{label}</span>
      <hr className="flex-1 border-slate-800" />
    </div>
  )
}

// ── Input style ───────────────────────────────────────────────────────────────

export const inputClass = `w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200
  placeholder:text-slate-500 focus:outline-none focus:border-brand-500 text-sm transition-colors`

export const selectClass = `w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200
  focus:outline-none focus:border-brand-500 text-sm transition-colors`

export const textareaClass = `w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200
  placeholder:text-slate-500 focus:outline-none focus:border-brand-500 text-sm transition-colors resize-y`
