'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// =============================================================================
// Premium 3D Button Design System
//
// Philosophy: Corporate elegance + tactile depth + operational clarity.
// Every button feels physically real: you can see and feel the depth,
// the hover lift, and the press-in click response.
// =============================================================================

const buttonVariants = cva(
  // Base styles — every button shares these
  [
    'relative inline-flex items-center justify-center gap-2',
    'font-semibold tracking-tight',
    'select-none cursor-pointer',
    'border-0 outline-none',
    'focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'transition-all duration-100 ease-out',
    'active:duration-75',
    // 3D press effect — translateY shifts down on click
    '[&:not(:disabled)]:active:translate-y-[2px]',
  ],
  {
    variants: {
      variant: {
        // ── Primary ─────────────────────────────────────────────────────────
        // Strong blue, 3D depth with bottom edge + ambient shadow
        primary: [
          'bg-gradient-to-b from-brand-500 to-brand-600 text-white',
          'shadow-btn-primary',
          'hover:shadow-btn-primary-hover hover:-translate-y-[1px]',
          'active:shadow-btn-primary-active',
          'focus-visible:ring-brand-400',
        ],

        // ── Secondary ───────────────────────────────────────────────────────
        // Clean white/light with slate edge — feels premium, not flat
        secondary: [
          'bg-white text-slate-700',
          'border border-slate-200',
          'shadow-btn-secondary',
          'hover:shadow-btn-secondary-hover hover:-translate-y-[1px] hover:border-slate-300 hover:text-slate-900',
          'active:shadow-btn-secondary-active',
          'focus-visible:ring-brand-400',
        ],

        // ── Danger ──────────────────────────────────────────────────────────
        danger: [
          'bg-gradient-to-b from-danger-500 to-danger-600 text-white',
          'shadow-btn-danger',
          'hover:shadow-btn-danger-hover hover:-translate-y-[1px]',
          'active:shadow-btn-danger-active',
          'focus-visible:ring-danger-400',
        ],

        // ── Success ─────────────────────────────────────────────────────────
        success: [
          'bg-gradient-to-b from-success-500 to-success-600 text-white',
          'shadow-btn-success',
          'hover:shadow-btn-success-hover hover:-translate-y-[1px]',
          'active:shadow-btn-success-active',
          'focus-visible:ring-success-500',
        ],

        // ── Warning ─────────────────────────────────────────────────────────
        warning: [
          'bg-gradient-to-b from-amber-400 to-amber-500 text-amber-950',
          'shadow-[0_4px_0_#b45309,0_5px_8px_rgba(245,158,11,0.25)]',
          'hover:shadow-[0_5px_0_#b45309,0_6px_12px_rgba(245,158,11,0.3)] hover:-translate-y-[1px]',
          'active:shadow-[0_1px_0_#b45309,0_2px_4px_rgba(245,158,11,0.15)]',
          'focus-visible:ring-amber-400',
        ],

        // ── Ghost ───────────────────────────────────────────────────────────
        // Flat but premium — used for toolbar and nav actions
        ghost: [
          'bg-transparent text-slate-600',
          'hover:bg-slate-100 hover:text-slate-900',
          'active:bg-slate-200',
          'focus-visible:ring-brand-400',
          // No 3D effect for ghost — intentionally flat
          '[&:not(:disabled)]:active:translate-y-0',
        ],

        // ── Link ────────────────────────────────────────────────────────────
        link: [
          'bg-transparent text-brand-600 underline-offset-4',
          'hover:underline hover:text-brand-700',
          'focus-visible:ring-brand-400',
          '[&:not(:disabled)]:active:translate-y-0',
          'shadow-none',
        ],

        // ── Outline ─────────────────────────────────────────────────────────
        outline: [
          'bg-transparent text-brand-600 border border-brand-300',
          'hover:bg-brand-50 hover:border-brand-400',
          'active:bg-brand-100',
          'focus-visible:ring-brand-400',
          '[&:not(:disabled)]:active:translate-y-0',
        ],
      },

      size: {
        xs:   'h-7 px-2.5 text-xs rounded-md gap-1.5',
        sm:   'h-8 px-3 text-sm rounded-md gap-1.5',
        md:   'h-10 px-4 text-sm rounded-lg gap-2',
        lg:   'h-12 px-5 text-base rounded-lg gap-2',
        xl:   'h-14 px-6 text-base rounded-xl gap-2.5',
        // Icon-only (square)
        'icon-xs': 'h-7 w-7 p-0 rounded-md',
        'icon-sm': 'h-8 w-8 p-0 rounded-md',
        'icon-md': 'h-10 w-10 p-0 rounded-lg',
        'icon-lg': 'h-12 w-12 p-0 rounded-lg',
        // Full-width touch target for mobile (min 44px)
        'touch': 'h-12 px-5 text-base rounded-lg gap-2 w-full',
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
// Loading state visual
// =============================================================================

type ButtonState = 'idle' | 'loading' | 'success' | 'error'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?:    boolean
  loading?:    boolean
  loadingText?: string
  successText?: string
  state?:       ButtonState
  leftIcon?:    React.ReactNode
  rightIcon?:   React.ReactNode
  fullWidth?:   boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      loadingText,
      successText,
      state = 'idle',
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
    const isDisabled = disabled || isLoading

    return (
      <Comp
        ref={ref}
        disabled={isDisabled}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        aria-busy={isLoading}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
        )}

        {/* Success checkmark */}
        {isSuccess && !isLoading && (
          <CheckCircle className="h-4 w-4 shrink-0" aria-hidden />
        )}

        {/* Left icon (not shown during loading/success) */}
        {!isLoading && !isSuccess && leftIcon && (
          <span className="shrink-0" aria-hidden>{leftIcon}</span>
        )}

        {/* Label */}
        <span>
          {isLoading ? (loadingText ?? children) :
           isSuccess ? (successText ?? children) :
           children}
        </span>

        {/* Right icon */}
        {!isLoading && !isSuccess && rightIcon && (
          <span className="shrink-0" aria-hidden>{rightIcon}</span>
        )}
      </Comp>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }

// =============================================================================
// Specialized button presets
// =============================================================================

export function SaveButton(props: Omit<ButtonProps, 'variant'> & { variant?: ButtonProps['variant'] }) {
  return <Button variant="primary" {...props}>{props.children ?? 'Guardar'}</Button>
}

export function CancelButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="secondary" {...props}>{props.children ?? 'Cancelar'}</Button>
}

export function DeleteButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="danger" {...props}>{props.children ?? 'Eliminar'}</Button>
}

export function AddButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="primary" {...props}>{props.children ?? 'Agregar'}</Button>
}
