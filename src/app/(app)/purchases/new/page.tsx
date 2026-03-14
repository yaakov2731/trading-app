import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/server/auth-guards'
import { getAccessibleLocations } from '@/lib/server/location-access'
import { getActiveSupplierOptions } from '@/lib/server/suppliers'
import { getProducts } from '@/lib/server/supabase-products'
import { createPurchaseEntry } from '@/lib/server/purchases'
import { PurchaseEntryForm } from '@/components/forms/purchase-entry-form'
import type { CreatePurchaseInput } from '@/lib/validations/purchases'

export const metadata: Metadata = { title: 'Nueva Compra' }

export default async function NewPurchasePage() {
  const session = await requireAuth()

  const [locations, suppliers, { products }] = await Promise.all([
    getAccessibleLocations(),
    getActiveSupplierOptions(),
    getProducts({ pageSize: 300 }),
  ])

  async function handleCreate(data: CreatePurchaseInput) {
    'use server'
    const result = await createPurchaseEntry(data)
    redirect(`/purchases/${result.id}`)
  }

  const defaultLocationId = session.user.locations[0]?.locationId

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/purchases"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Nueva compra</h1>
          <p className="text-sm text-slate-500">
            Registra los productos recibidos o a recibir
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl">
        <PurchaseEntryForm
          locations={locations.map((l) => ({
            id: l.id,
            name: l.name,
            color: l.color,
          }))}
          suppliers={suppliers}
          products={products.map((p) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            unit_symbol: (p.unit as { symbol: string }).symbol,
            cost_price: p.cost_price ?? null,
          }))}
          onSubmit={handleCreate}
          defaultLocationId={defaultLocationId}
        />
      </div>
    </div>
  )
}
