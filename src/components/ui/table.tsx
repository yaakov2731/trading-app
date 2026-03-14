import * as React from 'react'
import { cn } from '@/lib/utils/cn'

// =============================================================================
// Premium Data Table Components
// =============================================================================

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
)
Table.displayName = 'Table'

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('[&_tr]:border-b [&_tr]:border-slate-100', className)} {...props} />
  )
)
TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
)
TableBody.displayName = 'TableBody'

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn('border-t border-slate-100 bg-slate-50/50 font-medium', className)}
      {...props}
    />
  )
)
TableFooter.displayName = 'TableFooter'

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b border-slate-50 transition-colors duration-100',
        'hover:bg-slate-50/60',
        'data-[state=selected]:bg-brand-50',
        className
      )}
      {...props}
    />
  )
)
TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-10 px-4 text-left align-middle',
        'text-xs font-semibold text-slate-500 uppercase tracking-wider',
        'bg-slate-50/80',
        '[&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  )
)
TableHead.displayName = 'TableHead'

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        'px-4 py-3 align-middle text-sm text-slate-700',
        '[&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  )
)
TableCell.displayName = 'TableCell'

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption
      ref={ref}
      className={cn('mt-4 text-sm text-slate-500', className)}
      {...props}
    />
  )
)
TableCaption.displayName = 'TableCaption'

// ── Empty state ───────────────────────────────────────────────────────────────

interface TableEmptyProps {
  icon?:       React.ReactNode
  title:       string
  description?: string
  action?:     React.ReactNode
  colSpan?:    number
}

function TableEmpty({ icon, title, description, action, colSpan = 10 }: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          {icon && (
            <div className="mb-4 rounded-2xl bg-slate-100 p-4 text-slate-400">
              {icon}
            </div>
          )}
          <p className="text-base font-semibold text-slate-700">{title}</p>
          {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
          {action && <div className="mt-4">{action}</div>}
        </div>
      </td>
    </tr>
  )
}

// ── Loading skeleton rows ─────────────────────────────────────────────────────

function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <TableCell key={j}>
              <div className={cn(
                'h-4 rounded bg-slate-100 animate-pulse',
                j === 0 ? 'w-32' : j === cols - 1 ? 'w-16' : 'w-24'
              )} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableEmpty,
  TableSkeleton,
}
