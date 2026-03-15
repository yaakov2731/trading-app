/**
 * components/ui/responsive-table-shell.tsx
 * Consistent card shell for tables with desktop/mobile split.
 */

import React from 'react'

interface Column {
  key: string
  header: string
  hideOnMobile?: boolean
  className?: string
}

interface ResponsiveTableShellProps {
  columns: Column[]
  children: React.ReactNode
  mobileView?: React.ReactNode
  emptyState?: React.ReactNode
  isEmpty?: boolean
  className?: string
}

export default function ResponsiveTableShell({
  columns,
  children,
  mobileView,
  emptyState,
  isEmpty = false,
  className = '',
}: ResponsiveTableShellProps) {
  if (isEmpty && emptyState) return <>{emptyState}</>

  return (
    <div className={`bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden ${className}`}>
      {/* Desktop */}
      {!isEmpty && (
        <div className={`${mobileView ? 'hidden sm:block' : 'block'} overflow-x-auto`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider
                      ${col.hideOnMobile ? 'hidden sm:table-cell' : ''}
                      ${col.className ?? ''}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {children}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile */}
      {mobileView && !isEmpty && (
        <div className="sm:hidden">{mobileView}</div>
      )}
    </div>
  )
}

// ── Table row ─────────────────────────────────────────────────────────────────

export function TableRow({ children, className = '', onClick }: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-slate-800/40 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  )
}

// ── Table cell ────────────────────────────────────────────────────────────────

export function TableCell({ children, className = '', mobileHidden = false }: {
  children: React.ReactNode
  className?: string
  mobileHidden?: boolean
}) {
  return (
    <td className={`px-4 py-3 text-sm ${mobileHidden ? 'hidden sm:table-cell' : ''} ${className}`}>
      {children}
    </td>
  )
}
