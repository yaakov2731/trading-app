import * as React from 'react'
import { cn } from '@/lib/utils/cn'

// =============================================================================
// Premium Input System
// Clean, high-contrast, accessible, mobile-first
// =============================================================================

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?:  React.ReactNode
  rightIcon?: React.ReactNode
  error?:     boolean
  hint?:      string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, rightIcon, error, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            // Base
            'flex h-10 w-full rounded-lg',
            'bg-white text-slate-900 text-sm',
            'border border-slate-200',
            'px-3 py-2',
            // Placeholder
            'placeholder:text-slate-400',
            // Focus — premium ring effect
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500',
            // Hover
            'hover:border-slate-300',
            // Disabled
            'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
            // Error
            error && 'border-danger-400 bg-danger-50/30 focus:ring-danger-500/20 focus:border-danger-500',
            // Icon padding
            leftIcon  && 'pl-9',
            rightIcon && 'pr-9',
            className
          )}
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 flex items-center pointer-events-none text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

// =============================================================================
// Textarea
// =============================================================================

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-lg',
          'bg-white text-slate-900 text-sm',
          'border border-slate-200',
          'px-3 py-2',
          'placeholder:text-slate-400',
          'transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500',
          'hover:border-slate-300',
          'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
          'resize-y',
          error && 'border-danger-400 bg-danger-50/30 focus:ring-danger-500/20 focus:border-danger-500',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

// =============================================================================
// Form Field wrapper — label + input + error + hint
// =============================================================================

interface FormFieldProps {
  label?:    string
  hint?:     string
  error?:    string
  required?: boolean
  children:  React.ReactNode
  className?: string
  htmlFor?:  string
}

function FormField({ label, hint, error, required, children, className, htmlFor }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-slate-700 leading-none"
        >
          {label}
          {required && <span className="ml-0.5 text-danger-500">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-xs text-slate-400">{hint}</p>
      )}
      {error && (
        <p className="text-xs font-medium text-danger-600">{error}</p>
      )}
    </div>
  )
}

// =============================================================================
// NumberInput — formatted number input with increment/decrement
// =============================================================================

interface NumberInputProps extends Omit<InputProps, 'type' | 'onChange'> {
  value:    number | ''
  onChange: (value: number | '') => void
  min?:     number
  max?:     number
  step?:    number
}

function NumberInput({ value, onChange, min, max, step = 0.001, className, ...props }: NumberInputProps) {
  return (
    <Input
      type="number"
      inputMode="decimal"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={e => {
        const v = e.target.value
        onChange(v === '' ? '' : parseFloat(v))
      }}
      className={cn('tabular-nums', className)}
      {...props}
    />
  )
}

export { Input, Textarea, FormField, NumberInput }
