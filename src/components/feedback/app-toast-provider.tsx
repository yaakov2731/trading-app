/**
 * components/feedback/app-toast-provider.tsx
 * Premium toast notification system.
 * Wrap in layout; use useToast() hook to show toasts.
 */

'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  variant: ToastVariant
  title: string
  description?: string
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  toast: (options: Omit<Toast, 'id'>) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
  dismiss: (id: string) => void
}

// ── Context ───────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within AppToastProvider')
  return ctx
}

// ── Toast component ───────────────────────────────────────────────────────────

const TOAST_STYLES: Record<ToastVariant, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10',
  error:   'border-red-500/30 bg-red-500/10',
  warning: 'border-amber-500/30 bg-amber-500/10',
  info:    'border-blue-500/30 bg-blue-500/10',
}

const TOAST_ICON_COLORS: Record<ToastVariant, string> = {
  success: 'text-emerald-400',
  error:   'text-red-400',
  warning: 'text-amber-400',
  info:    'text-blue-400',
}

const TOAST_ICONS: Record<ToastVariant, React.ReactNode> = {
  success: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, t.duration ?? 4000)
    return () => clearTimeout(timer)
  }, [t.duration, onDismiss])

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm shadow-2xl
      max-w-sm w-full pointer-events-auto ${TOAST_STYLES[t.variant]}
      animate-in slide-in-from-right-5 duration-300`}>
      <span className={`mt-0.5 flex-shrink-0 ${TOAST_ICON_COLORS[t.variant]}`}>
        {TOAST_ICONS[t.variant]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-100">{t.title}</p>
        {t.description && (
          <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">{t.description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
        aria-label="Cerrar"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ── Provider ──────────────────────────────────────────────────────────────────

export default function AppToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev.slice(-4), { ...options, id }]) // max 5
  }, [])

  const success = useCallback((title: string, description?: string) =>
    toast({ variant: 'success', title, description }), [toast])

  const error = useCallback((title: string, description?: string) =>
    toast({ variant: 'error', title, description, duration: 6000 }), [toast])

  const warning = useCallback((title: string, description?: string) =>
    toast({ variant: 'warning', title, description }), [toast])

  const info = useCallback((title: string, description?: string) =>
    toast({ variant: 'info', title, description }), [toast])

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, warning, info, dismiss }}>
      {children}

      {/* Toast container */}
      <div
        className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-label="Notificaciones"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
