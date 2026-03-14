import * as React from 'react'
import { cn } from '@/lib/utils/cn'

// =============================================================================
// Premium Card System
// Layered elevation, clean borders, subtle backgrounds
// =============================================================================

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'flat' | 'interactive' | 'highlight' | 'stat'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base
          'relative rounded-xl bg-white',
          // Padding variants
          {
            'p-0':    padding === 'none',
            'p-4':    padding === 'sm',
            'p-5':    padding === 'md',
            'p-6':    padding === 'lg',
          },
          // Style variants
          {
            // Default: clean with subtle border + shadow
            'border border-slate-200/80 shadow-card':
              variant === 'default',
            // Elevated: stronger shadow for modals, floating panels
            'border border-slate-200/60 shadow-lg':
              variant === 'elevated',
            // Flat: no shadow, just border
            'border border-slate-200':
              variant === 'flat',
            // Interactive: hover lift effect
            'border border-slate-200/80 shadow-card cursor-pointer transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 hover:border-slate-300':
              variant === 'interactive',
            // Highlight: brand accent top border
            'border border-slate-200/80 shadow-card before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-brand-400 before:to-brand-600 before:rounded-t-xl overflow-hidden':
              variant === 'highlight',
            // Stat card: optimized for KPI numbers
            'border border-slate-200/80 shadow-card':
              variant === 'stat',
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

// ── Card Header ──────────────────────────────────────────────────────────────

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, bordered = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col space-y-1',
        bordered && 'pb-4 mb-4 border-b border-slate-100',
        className
      )}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

// ── Card Title ───────────────────────────────────────────────────────────────

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-base font-semibold leading-tight text-slate-900', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

// ── Card Description ─────────────────────────────────────────────────────────

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-slate-500', className)} {...props} />
  )
)
CardDescription.displayName = 'CardDescription'

// ── Card Content ─────────────────────────────────────────────────────────────

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

// ── Card Footer ──────────────────────────────────────────────────────────────

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-4 mt-4 border-t border-slate-100', className)}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: React.ReactNode
  iconColor?: string
  className?: string
  loading?: boolean
}

function StatCard({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
  iconColor = 'bg-brand-50 text-brand-600',
  className,
  loading,
}: StatCardProps) {
  return (
    <Card variant="stat" className={className}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 truncate">{label}</p>
          {loading ? (
            <div className="mt-1.5 h-8 w-24 rounded-md bg-slate-100 animate-pulse" />
          ) : (
            <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
          )}
          {change && !loading && (
            <p className={cn(
              'mt-1 text-xs font-medium',
              changeType === 'positive' && 'text-success-600',
              changeType === 'negative' && 'text-danger-600',
              changeType === 'neutral'  && 'text-slate-500',
            )}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn('flex-shrink-0 rounded-xl p-2.5', iconColor)}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatCard,
  type CardProps,
  type StatCardProps,
}
