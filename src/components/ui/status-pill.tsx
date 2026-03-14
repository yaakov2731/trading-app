/**
 * components/ui/status-pill.tsx
 * Reusable status pill / badge with consistent colour semantics.
 */

type StatusVariant =
  | 'success' | 'warning' | 'error' | 'info' | 'neutral'
  | 'draft' | 'pending' | 'active' | 'inactive' | 'cancelled'

interface StatusPillProps {
  label: string
  variant?: StatusVariant
  dot?: boolean
  size?: 'sm' | 'md'
  className?: string
}

const VARIANT_STYLES: Record<StatusVariant, string> = {
  success:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  warning:   'text-amber-400 bg-amber-500/10 border-amber-500/30',
  error:     'text-red-400 bg-red-500/10 border-red-500/30',
  info:      'text-blue-400 bg-blue-500/10 border-blue-500/30',
  neutral:   'text-slate-400 bg-slate-500/10 border-slate-500/20',
  draft:     'text-slate-400 bg-slate-700/50 border-slate-600/50',
  pending:   'text-amber-400 bg-amber-500/10 border-amber-500/30',
  active:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  inactive:  'text-slate-500 bg-slate-700/50 border-slate-600/50',
  cancelled: 'text-red-400 bg-red-500/10 border-red-500/30',
}

const DOT_COLORS: Record<StatusVariant, string> = {
  success:   'bg-emerald-400',
  warning:   'bg-amber-400',
  error:     'bg-red-400',
  info:      'bg-blue-400',
  neutral:   'bg-slate-400',
  draft:     'bg-slate-500',
  pending:   'bg-amber-400',
  active:    'bg-emerald-400',
  inactive:  'bg-slate-500',
  cancelled: 'bg-red-400',
}

export default function StatusPill({
  label,
  variant = 'neutral',
  dot = false,
  size = 'sm',
  className = '',
}: StatusPillProps) {
  const sizeClass = size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border font-medium
      ${sizeClass} ${VARIANT_STYLES[variant]} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${DOT_COLORS[variant]}`} />
      )}
      {label}
    </span>
  )
}

// ── Convenience exports ────────────────────────────────────────────────────────

export function SuccessPill({ label, ...props }: Omit<StatusPillProps, 'variant'>) {
  return <StatusPill label={label} variant="success" {...props} />
}

export function WarningPill({ label, ...props }: Omit<StatusPillProps, 'variant'>) {
  return <StatusPill label={label} variant="warning" {...props} />
}

export function ErrorPill({ label, ...props }: Omit<StatusPillProps, 'variant'>) {
  return <StatusPill label={label} variant="error" {...props} />
}

export function DraftPill({ label, ...props }: Omit<StatusPillProps, 'variant'>) {
  return <StatusPill label={label} variant="draft" {...props} />
}
