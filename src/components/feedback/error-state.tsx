/**
 * components/feedback/error-state.tsx
 * Reusable error state with retry support.
 */

'use client'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  code?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function ErrorState({
  title = 'Algo salió mal',
  message = 'Ocurrió un error inesperado. Intenta nuevamente.',
  onRetry,
  code,
  size = 'md',
}: ErrorStateProps) {
  const padding = size === 'sm' ? 'py-10' : size === 'lg' ? 'py-24' : 'py-16'
  const iconSize = size === 'sm' ? 'w-10 h-10' : 'w-12 h-12'

  return (
    <div className={`flex flex-col items-center justify-center ${padding} text-center px-6`}>
      <div className={`${iconSize} rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4`}>
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>

      <h3 className="font-semibold text-slate-200 text-base">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-500 max-w-sm">{message}</p>

      {code && (
        <span className="mt-2 px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-500 font-mono">
          {code}
        </span>
      )}

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 px-4 py-2.5 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700
            text-slate-200 border border-slate-700 transition-colors active:scale-95"
        >
          Intentar nuevamente
        </button>
      )}
    </div>
  )
}
