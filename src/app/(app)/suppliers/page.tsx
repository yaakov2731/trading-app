import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Building2, Download } from 'lucide-react'
import { requireAuth } from '@/lib/server/auth-guards'
import { getSuppliers, toggleSupplierActive } from '@/lib/server/suppliers'
import { SuppliersTable } from '@/components/suppliers/suppliers-table'
import { revalidatePath } from 'next/cache'

export const metadata: Metadata = { title: 'Proveedores' }
export const revalidate = 0

interface PageProps {
  searchParams: Promise<Record<string, string | string[]>>
}

export default async function SuppliersPage({ searchParams }: PageProps) {
  await requireAuth()
  const params = await searchParams

  const search = Array.isArray(params.search) ? params.search[0] : params.search ?? ''
  const showInactive = params.inactive === '1'

  const { suppliers, total } = await getSuppliers({
    search: search || undefined,
    is_active: showInactive ? undefined : true,
    page_size: 100,
  })

  async function handleToggle(id: string, is_active: boolean) {
    'use server'
    await toggleSupplierActive(id, is_active)
    revalidatePath('/suppliers')
  }

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Proveedores</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {total} proveedor{total !== 1 ? 'es' : ''}
            {!showInactive && total > 0 && ' activo' + (total !== 1 ? 's' : '')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/suppliers/export"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar
          </a>
          <Link
            href="/suppliers/new"
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Nuevo proveedor
          </Link>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-2">
        <form method="GET" action="/suppliers" className="relative flex-1 min-w-[200px] max-w-xs">
          {showInactive && <input type="hidden" name="inactive" value="1" />}
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Buscar proveedor, contacto…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-4 text-sm placeholder-slate-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </form>

        <a
          href={`/suppliers?${showInactive ? '' : 'inactive=1'}${search ? `&search=${search}` : ''}`}
          className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
            showInactive
              ? 'border-brand-500 bg-brand-50 text-brand-700'
              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
          }`}
        >
          {showInactive ? 'Ocultar inactivos' : 'Mostrar inactivos'}
        </a>
      </div>

      <SuppliersTable
        suppliers={suppliers}
        onToggleActive={handleToggle}
      />
    </div>
  )
}
