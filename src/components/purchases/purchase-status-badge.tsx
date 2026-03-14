'use client'

import { cn } from '@/lib/utils/cn'
import { PURCHASE_STATUS_LABELS, type PurchaseStatus } from '@/lib/validations/purchases'

interface PurchaseStatusBadgeProps {
  status: PurchaseStatus | string
  size?: 'sm' | 'md'
  className?: string
}

const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-amber-100 text-amber-800 border border-amber-200',
  received:  'bg-emerald-100 text-emerald-800 border border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-500 border border-slate-200',
}

const STATUS_DOTS: Record<string, string> = {
  draft:     'bg-amber-500',
  received:  'bg-emerald-500',
  cancelled: 'bg-slate-400',
}

export function PurchaseStatusBadge({
  status,
  size = 'md',
  className,
}: PurchaseStatusBadgeProps) {
  const label =
    PURCHASE_STATUS_LABELS[status as PurchaseStatus] ?? status
  const styles =
    STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600 border border-slate-200'
  const dot = STATUS_DOTS[status] ?? 'bg-slate-400'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        styles,
        className
      )}
    >
      <span
        className={cn(
          'rounded-full',
          size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2',
          dot
        )}
      />
      {label}
    </span>
  )
}
