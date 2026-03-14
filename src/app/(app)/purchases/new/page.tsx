import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/db/client'
import { PurchaseForm } from './purchase-form'

export const metadata: Metadata = { title: 'Nueva Compra' }

export default async function NewPurchasePage() {
  const supabase = await createServerSupabaseClient()

  const [locationsRes, suppliersRes, productsRes] = await Promise.all([
    supabase.from('locations').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('suppliers').select('*').eq('is_active', true).order('name'),
    supabase.from('products')
      .select('*, category:categories(id,name,color,prefix), unit:units(id,name,symbol)')
      .eq('is_active', true)
      .order('name'),
  ])

  return (
    <PurchaseForm
      locations={locationsRes.data ?? []}
      suppliers={suppliersRes.data ?? []}
      products={productsRes.data as any ?? []}
    />
  )
}
