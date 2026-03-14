import * as React from 'react'
import { cn } from '@/lib/utils/cn'

// =============================================================================
// Skeleton Loaders — content-aware placeholders during data fetch
// =============================================================================

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?:  string | number
  height?: string | number
  circle?: boolean
  lines?:  number  // render N stacked lines
}

export function Skeleton({ className, width, height, circle, lines, style, ...props }: SkeletonProps) {
  if (lines && lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{
              height: height ?? '14px',
              width:  i === lines - 1 ? '65%' : '100%',
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn('skeleton', circle && 'rounded-full', className)}
      style={{
        width:  width  ?? '100%',
        height: height ?? '14px',
        borderRadius: circle ? '50%' : undefined,
        ...style,
      }}
      {...props}
    />
  )
}

// ── Stat card skeleton ────────────────────────────────────────────────────────

export function StatCardSkeleton() {
  return (
    <div className="card-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Skeleton width="60%" height="12px" />
          <Skeleton width="45%" height="28px" className="mt-2.5" />
          <Skeleton width="35%" height="10px" className="mt-2" />
        </div>
        <Skeleton width="36px" height="36px" circle />
      </div>
    </div>
  )
}

// ── Table row skeletons ───────────────────────────────────────────────────────

export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  const widths = ['32%', '18%', '14%', '12%', '12%', '12%', '10%', '10%']
  return (
    <tr className="border-b border-slate-50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <Skeleton width={widths[i] ?? '15%'} height="13px" />
        </td>
      ))}
    </tr>
  )
}

// ── Product card skeleton ─────────────────────────────────────────────────────

export function ProductCardSkeleton() {
  return (
    <div className="card-surface p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton width="40px" height="40px" circle />
        <div className="flex-1">
          <Skeleton width="70%" height="14px" />
          <Skeleton width="40%" height="11px" className="mt-1.5" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton height="44px" />
        <Skeleton height="44px" />
      </div>
    </div>
  )
}

// ── List item skeleton ────────────────────────────────────────────────────────

export function ListItemSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-slate-50">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton width="32px" height="32px" circle className="flex-shrink-0" />
          <div className="flex-1">
            <Skeleton width="55%" height="13px" />
            <Skeleton width="35%" height="11px" className="mt-1.5" />
          </div>
          <Skeleton width="48px" height="20px" />
        </div>
      ))}
    </div>
  )
}
