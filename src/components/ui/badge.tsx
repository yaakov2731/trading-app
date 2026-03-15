import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'
import type { StockStatus, MovementType } from '@/lib/types'

// =============================================================================
// Premium Badge / Chip System
// =============================================================================

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-medium transition-colors',
  {
    variants: {
      variant: {
        default:  'bg-slate-100 text-slate-700',
        primary:  'bg-brand-50 text-brand-700 ring-1 ring-brand-200/60',
        success:  'bg-success-50 text-success-700 ring-1 ring-success-200/60',
        warning:  'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
        danger:   'bg-danger-50 text-danger-700 ring-1 ring-danger-200/60',
        info:     'bg-sky-50 text-sky-700 ring-1 ring-sky-200/60',
        purple:   'bg-purple-50 text-purple-700 ring-1 ring-purple-200/60',
        // Filled versions
        'primary-filled':  'bg-brand-600 text-white',
        'success-filled':  'bg-success-600 text-white',
        'warning-filled':  'bg-amber-500 text-white',
        'danger-filled':   'bg-danger-600 text-white',
      },
      size: {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-xs px-2.5 py-0.5',
        lg: 'text-sm px-3 py-1',
      },
      dot: {
        true: 'pl-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'md',
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?:  boolean
  dotColor?: string
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, dot, dotColor, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, dot }), className)}
        {...props}
      >
        {dot && (
          <span
            className={cn('inline-block w-1.5 h-1.5 rounded-full flex-shrink-0', dotColor ?? 'bg-current')}
            aria-hidden
          />
        )}
        {children}
      </span>
    )
  }
)
Badge.displayName = 'Badge'

// =============================================================================
// Stock Status Badge
// =============================================================================

const STOCK_STATUS_BADGE: Record<StockStatus, {
  variant: BadgeProps['variant']
  label:   string
}> = {
  ok:      { variant: 'success', label: 'Normal'    },
  warning: { variant: 'warning', label: 'Bajo'      },
  low:     { variant: 'danger',  label: 'Crítico'   },
  zero:    { variant: 'danger-filled', label: 'Sin Stock' },
}

interface StockStatusBadgeProps {
  status:    StockStatus
  size?:     BadgeProps['size']
  showDot?:  boolean
  className?: string
}

function StockStatusBadge({ status, size = 'md', showDot = true, className }: StockStatusBadgeProps) {
  const config = STOCK_STATUS_BADGE[status]
  return (
    <Badge variant={config.variant} size={size} dot={showDot} className={className}>
      {config.label}
    </Badge>
  )
}

// =============================================================================
// Movement Type Badge
// =============================================================================

const MOVEMENT_BADGE_VARIANTS: Record<MovementType, BadgeProps['variant']> = {
  opening_stock:             'info',
  purchase_in:               'success',
  production_in:             'success',
  consumption_out:           'warning',
  transfer_out:              'purple',
  transfer_in:               'primary',
  waste_out:                 'danger',
  manual_adjustment:         'default',
  physical_count:            'info',
  reconciliation_adjustment: 'purple',
}

const MOVEMENT_LABELS_ES: Record<MovementType, string> = {
  opening_stock:             'Stock Inicial',
  purchase_in:               'Compra',
  production_in:             'Producción',
  consumption_out:           'Consumo',
  transfer_out:              'Transf. Sal.',
  transfer_in:               'Transf. Ent.',
  waste_out:                 'Merma',
  manual_adjustment:         'Ajuste',
  physical_count:            'Conteo',
  reconciliation_adjustment: 'Reconcil.',
}

interface MovementTypeBadgeProps {
  type:    MovementType
  size?:   BadgeProps['size']
  full?:   boolean
  className?: string
}

function MovementTypeBadge({ type, size = 'sm', full = false, className }: MovementTypeBadgeProps) {
  return (
    <Badge variant={MOVEMENT_BADGE_VARIANTS[type]} size={size} className={className}>
      {full ? MOVEMENT_LABELS_ES[type] : MOVEMENT_LABELS_ES[type]}
    </Badge>
  )
}

// =============================================================================
// Transfer / Purchase Status Badges
// =============================================================================

const TRANSFER_STATUS_CONFIG: Record<string, { variant: BadgeProps['variant']; label: string }> = {
  draft:            { variant: 'default',  label: 'Borrador'    },
  pending_approval: { variant: 'warning',  label: 'Pendiente'   },
  in_transit:       { variant: 'info',     label: 'En tránsito' },
  received:         { variant: 'success',  label: 'Recibido'    },
  partial:          { variant: 'warning',  label: 'Parcial'     },
  cancelled:        { variant: 'danger',   label: 'Cancelado'   },
}

const PURCHASE_STATUS_CONFIG: Record<string, { variant: BadgeProps['variant']; label: string }> = {
  draft:     { variant: 'default', label: 'Borrador'  },
  ordered:   { variant: 'info',    label: 'Pedido'    },
  partial:   { variant: 'warning', label: 'Parcial'   },
  received:  { variant: 'success', label: 'Recibido'  },
  cancelled: { variant: 'danger',  label: 'Cancelado' },
}

function TransferStatusBadge({ status, size = 'sm' }: { status: string; size?: BadgeProps['size'] }) {
  const cfg = TRANSFER_STATUS_CONFIG[status] ?? { variant: 'default' as const, label: status }
  return <Badge variant={cfg.variant} size={size}>{cfg.label}</Badge>
}

function PurchaseStatusBadge({ status, size = 'sm' }: { status: string; size?: BadgeProps['size'] }) {
  const cfg = PURCHASE_STATUS_CONFIG[status] ?? { variant: 'default' as const, label: status }
  return <Badge variant={cfg.variant} size={size}>{cfg.label}</Badge>
}

export {
  Badge,
  badgeVariants,
  StockStatusBadge,
  MovementTypeBadge,
  TransferStatusBadge,
  PurchaseStatusBadge,
  type BadgeProps,
}
