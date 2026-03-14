import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/db/client'
import { TransferForm } from './transfer-form'

export const metadata: Metadata = { title: 'Nueva Transferencia' }

export default async function NewTransferPage() {
  const supabase = await createServerSupabaseClient()

  const [locationsRes, productsRes] = await Promise.all([
    supabase.from('locations').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('products')
      .select('*, category:categories(id,name,color,prefix), unit:units(id,name,symbol)')
      .eq('is_active', true)
      .order('name'),
  ])

  return (
    <TransferForm
      locations={locationsRes.data ?? []}
      products={productsRes.data as any ?? []}
    />
  )
}
