import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/server/auth-guards'
import { createSupplier } from '@/lib/server/suppliers'
import { SupplierForm } from '@/components/forms/supplier-form'
import type { CreateSupplierInput } from '@/lib/validations/suppliers'

export const metadata: Metadata = { title: 'Nuevo Proveedor' }

export default async function NewSupplierPage() {
  await requireAuth()

  async function handleCreate(data: CreateSupplierInput) {
    'use server'
    const supplier = await createSupplier(data)
    redirect(`/suppliers`)
  }

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/suppliers"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Nuevo proveedor</h1>
          <p className="text-sm text-slate-500">Agrega un proveedor al directorio</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        <SupplierForm onSubmit={handleCreate} />
      </div>
    </div>
  )
}
