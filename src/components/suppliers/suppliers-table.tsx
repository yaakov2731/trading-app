'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Phone, Mail, Building2, MoreHorizontal, ToggleLeft, ToggleRight, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/format'
import type { SupplierRow } from '@/lib/server/suppliers'

interface SuppliersTableProps {
  suppliers: SupplierRow[]
  onToggleActive?: (id: string, is_active: boolean) => Promise<void>
  className?: string
}

export function SuppliersTable({
  suppliers,
  onToggleActive,
  className,
}: SuppliersTableProps) {
  const [pending, startTransition] = useTransition()
  const [actionId, setActionId] = useState<string | null>(null)

  if (suppliers.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-20',
          className
        )}
      >
        <Building2 className="h-10 w-10 text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-500">No hay proveedores registrados</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 shadow-sm md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {['Proveedor', 'Contacto', 'Teléfono', 'Email', 'CUIT', 'Estado', 'Alta', ''].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 last:w-16"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suppliers.map((s) => (
              <tr key={s.id} className="group bg-white transition-colors hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800">{s.name}</p>
                  {s.notes && (
                    <p className="mt-0.5 text-xs text-slate-400 truncate max-w-[200px]">
                      {s.notes}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {s.contact_name ?? <span className="text-slate-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  {s.phone ? (
                    <a
                      href={`tel:${s.phone}`}
                      className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
                    >
                      <Phone className="h-3 w-3" />
                      {s.phone}
                    </a>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {s.email ? (
                    <a
                      href={`mailto:${s.email}`}
                      className="flex items-center gap-1 text-xs text-brand-600 hover:underline truncate max-w-[160px]"
                    >
                      <Mail className="h-3 w-3 shrink-0" />
                      {s.email}
                    </a>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                  {s.tax_id ?? <span className="text-slate-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
                      s.is_active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        s.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                      )}
                    />
                    {s.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                  {formatDate(s.created_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Link
                      href={`/suppliers/${s.id}/edit`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    {onToggleActive && (
                      <button
                        onClick={() => {
                          setActionId(s.id)
                          startTransition(async () => {
                            await onToggleActive(s.id, !s.is_active)
                            setActionId(null)
                          })
                        }}
                        disabled={pending && actionId === s.id}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-50"
                        title={s.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {s.is_active ? (
                          <ToggleRight className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {suppliers.map((s) => (
          <div
            key={s.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-800 truncate">{s.name}</p>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                      s.is_active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {s.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                {s.contact_name && (
                  <p className="mt-0.5 text-xs text-slate-500">{s.contact_name}</p>
                )}
              </div>
              <Link
                href={`/suppliers/${s.id}/edit`}
                className="ml-2 shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-2 flex flex-wrap gap-3">
              {s.phone && (
                <a href={`tel:${s.phone}`} className="flex items-center gap-1 text-xs text-brand-600">
                  <Phone className="h-3 w-3" />{s.phone}
                </a>
              )}
              {s.email && (
                <a href={`mailto:${s.email}`} className="flex items-center gap-1 text-xs text-brand-600 truncate max-w-[200px]">
                  <Mail className="h-3 w-3 shrink-0" />{s.email}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
