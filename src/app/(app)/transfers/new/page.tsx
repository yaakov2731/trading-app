import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { requireAuth } from '@/lib/server/auth-guards'
import { getAccessibleLocations } from '@/lib/server/location-access'
import { searchProducts } from '@/lib/server/supabase-products'
import { TransferForm } from '@/components/forms/transfer-form'
import { createTransfer } from '@/lib/server/transfers'
import { redirect } from 'next/navigation'
import type { CreateTransferInput } from '@/lib/validations/transfers'

export const metadata: Metadata = { title: 'Nuevo Traslado' }

export default async function NewTransferPage() {
  const session = await requireAuth()

  const [locations, products] = await Promise.all([
    getAccessibleLocations(),
    searchProducts('', undefined, 200),
  ])

  async function handleCreate(data: CreateTransferInput) {
    'use server'
    const result = await createTransfer(data)
    redirect(`/transfers/${result.id}`)
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Link href="/transfers" className="rounded-xl p-2 hover:bg-slate-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Nuevo traslado</h1>
          <p className="text-sm text-slate-500">Trasladar stock entre ubicaciones</p>
        </div>
      </div>

      <TransferForm
        locations={locations.map((l) => ({ id: l.id, name: l.name, color: l.color }))}
        products={products.map((p) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          unit_symbol: p.unit_symbol,
          current_stock: p.current_stock ?? 0,
        }))}
        onSubmit={handleCreate}
        defaultFromLocationId={session.user.locations[0]?.locationId}
      />
    </div>
  )
}
