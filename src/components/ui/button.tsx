'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// =============================================================================
// GastroStock — Premium 3D Button System
//
// Design philosophy:
//   Every button feels physically real — a layered object resting on a surface.
//   The user sees depth (the bottom edge), feels the hover lift, and hears
//   the conceptual "click" as the button presses into the surface.
//
// Implementation:
//   Three-layer box-shadow per state (defined as CSS vars in globals.css):
//     1. Inner top highlight   → gives the face a subtle light source
//     2. Colored bottom edge   → the physical "depth ledge" (4px tall)
//     3. Ambient drop shadow   → grounds the button on the page
//
//   On hover:  translateY(-1px) + edge grows to 5px → "lifts"
//   On active: translateY(+2px) + edge shrinks to 1px → "presses in"
//   Transition: 100ms for instant tactile feel
// =============================================================================

const buttonVariants = cva(
  // ── Shared base ────────────────────────────────────────────────────────────
  [
    // Layout
    'relative inline-flex items-center justify-center gap-2',
    // Typography
    'font-semibold tracking-tight leading-none',
    // Interaction
    'select-none cursor-pointer',
    'no-underline',
    // Outline override (we use box-shadow for focus)
    'outline-none',
    // Disabled
    'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
    // Transition timing
    '[transition:var(--transition-btn)]',
    // Vertical text alignment precision
    'whitespace-nowrap',
    // Prevent text from being selected on rapid clicks
    '[user-select:none]',
  ],
  {
    variants: {
      variant: {
        // ── Primary (Blue 3D) ───────────────────────────────────────────────
        // Strong brand action, most prominent CTA. Feels solid and confident.
        primary: [
          'btn-3d-primary',
          'text-white',
          'focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:ring-offset-1',
        ],

        // ── Secondary (White 3D) ────────────────────────────────────────────
        // Supporting action. Lighter weight, still tactile. Clean and premium.
        secondary: [
          'btn-3d-secondary',
          'text-slate-700',
          'hover:text-slate-900',
          'focus-visible:ring-2 focus-visible:ring-slate-400/30 focus-visible:ring-offset-1',
        ],

        // ── Danger (Red 3D) ─────────────────────────────────────────────────
        // Destructive actions. Clear intention, controlled weight.
        danger: [
          'btn-3d-danger',
          'text-white',
          'focus-visible:ring-2 focus-visible:ring-red-400/50 focus-visible:ring-offset-1',
        ],

        // ── Success (Green 3D) ──────────────────────────────────────────────
        // Confirmation, submit, save. Positive and clear.
        success: [
          'btn-3d-success',
          'text-white',
          'focus-visible:ring-2 focus-visible:ring-green-400/50 focus-visible:ring-offset-1',
        ],

        // ── Warning (Amber 3D) ──────────────────────────────────────────────
        // Cautious actions, overrides, non-destructive but notable.
        warning: [
          'btn-3d-warning',
          'text-amber-950',
          'focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-1',
        ],

        // ── Ghost (Flat) ────────────────────────────────────────────────────
        // Toolbar actions, secondary navigation. No depth — intentionally flat.
        ghost: [
          'bg-transparent text-slate-500',
          'hover:bg-slate-100/80 hover:text-slate-900',
          'active:bg-slate-200/80',
          'focus-visible:ring-2 focus-visible:ring-slate-400/30',
          // No 3D press on ghost — flat press only
          'active:scale-[0.97]',
          '[transition:background 120ms,color_120ms,transform_80ms]',
        ],

        // ── Outline ─────────────────────────────────────────────────────────
        // Border-only variant for less dominant actions.
        outline: [
          'border border-brand-300 bg-transparent text-brand-600',
          'hover:bg-brand-50/60 hover:border-brand-400 hover:text-brand-700',
          'active:bg-brand-100/60',
          'focus-visible:ring-2 focus-visible:ring-brand-400/30',
          'active:scale-[0.98]',
          '[transition:background 120ms,color_120ms,border-color_120ms,transform_80ms]',
        ],

        // ── Link ────────────────────────────────────────────────────────────
        // Inline text-link styled button.
        link: [
          'bg-transparent text-brand-600 underline-offset-4 decoration-brand-300',
          'hover:underline hover:text-brand-700',
          'focus-visible:ring-2 focus-visible:ring-brand-400/30',
          'active:opacity-70',
          '[transition:color_120ms,opacity_80ms]',
          'h-auto! p-0!',
        ],
      },

      size: {
        xs:        'h-7  px-2.5  text-xs  rounded-md  gap-1.5',
        sm:        'h-8  px-3    text-xs  rounded-lg  gap-1.5',
        md:        'h-10 px-4    text-sm  rounded-xl  gap-2',
        lg:        'h-11 px-5    text-sm  rounded-xl  gap-2',
        xl:        'h-13 px-6    text-base rounded-xl gap-2.5',
        // Square icon buttons
        'icon-xs': 'h-7  w-7  p-0 rounded-lg  text-xs',
        'icon-sm': 'h-8  w-8  p-0 rounded-lg  text-xs',
        'icon-md': 'h-10 w-10 p-0 rounded-xl  text-sm',
        'icon-lg': 'h-11 w-11 p-0 rounded-xl  text-sm',
        // Touch-optimized (≥44px, full width)
        touch:     'h-12 px-5 text-base rounded-xl gap-2 w-full min-h-[44px]',
      },

      fullWidth: {
        true: 'w-full',
      },
    },

    defaultVariants: {
      variant: 'primary',
      size:    'md',
    },
  }
)

// =============================================================================
// Types
// =============================================================================

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>
export type ButtonSize    = NonNullable<VariantProps<typeof buttonVariants>['size']>
export type ButtonState   = 'idle' | 'loading' | 'success' | 'error'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  // Render as a different element / component (polymorphic)
  asChild?:     boolean
  // Async state handling
  loading?:     boolean
  state?:       ButtonState
  // State-specific label overrides
  loadingText?: string
  successText?: string
  errorText?:   string
  // Icon slots (not shown during loading/success)
  leftIcon?:    React.ReactNode
  rightIcon?:   React.ReactNode
  // Layout
  fullWidth?:   boolean
}

// =============================================================================
// Button Component
// =============================================================================

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      state = 'idle',
      loadingText,
      successText,
      errorText,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'

    const isLoading = loading || state === 'loading'
    const isSuccess = state === 'success'
    const isError   = state === 'error'
    const isDisabled = disabled || isLoading

    // Resolved variant for state overrides
    const resolvedVariant = isSuccess ? 'success' : isError ? 'danger' : variant

    const label =
      isLoading ? (loadingText ?? children) :
      isSuccess ? (successText ?? children) :
      isError   ? (errorText   ?? children) :
      children

    return (
      <Comp
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        className={cn(
          buttonVariants({ variant: resolvedVariant, size, fullWidth }),
          className
        )}
        {...props}
      >
        {/* ── Loading spinner ─────────────────────────────────── */}
        {isLoading && (
          <Loader2
            className="shrink-0 animate-spin"
            size={size === 'xs' || size === 'sm' ? 13 : 15}
            aria-hidden
          />
        )}

        {/* ── Success check ───────────────────────────────────── */}
        {isSuccess && !isLoading && (
          <CheckCircle2
            className="shrink-0 animate-success-bounce"
            size={size === 'xs' || size === 'sm' ? 13 : 15}
            aria-hidden
          />
        )}

        {/* ── Error icon ──────────────────────────────────────── */}
        {isError && !isLoading && (
          <AlertCircle
            className="shrink-0"
            size={size === 'xs' || size === 'sm' ? 13 : 15}
            aria-hidden
          />
        )}

        {/* ── Left icon (hidden during state) ─────────────────── */}
        {!isLoading && !isSuccess && !isError && leftIcon && (
          <span className="shrink-0" aria-hidden>
            {leftIcon}
          </span>
        )}

        {/* ── Label ───────────────────────────────────────────── */}
        {label != null && <span>{label}</span>}

        {/* ── Right icon ──────────────────────────────────────── */}
        {!isLoading && !isSuccess && !isError && rightIcon && (
          <span className="shrink-0" aria-hidden>
            {rightIcon}
          </span>
        )}
      </Comp>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }

// =============================================================================
// Pre-composed button shortcuts
// =============================================================================

type BtnAlias = Omit<ButtonProps, 'variant'>

export const PrimaryButton   = (p: BtnAlias) => <Button variant="primary"   {...p} />
export const SecondaryButton = (p: BtnAlias) => <Button variant="secondary" {...p} />
export const DangerButton    = (p: BtnAlias) => <Button variant="danger"    {...p} />
export const SuccessButton   = (p: BtnAlias) => <Button variant="success"   {...p} />
export const GhostButton     = (p: BtnAlias) => <Button variant="ghost"     {...p} />

export function SaveButton(p: BtnAlias & { variant?: ButtonProps['variant'] }) {
  return <Button variant={p.variant ?? 'primary'} {...p}>{p.children ?? 'Guardar'}</Button>
}
export function CancelButton(p: BtnAlias) {
  return <Button variant="secondary" {...p}>{p.children ?? 'Cancelar'}</Button>
}
export function DeleteButton(p: BtnAlias) {
  return <Button variant="danger" {...p}>{p.children ?? 'Eliminar'}</Button>
}
