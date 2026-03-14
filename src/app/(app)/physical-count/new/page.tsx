import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/db/client'
import { PhysicalCountForm } from './physical-count-form'

export const metadata: Metadata = { title: 'Conteo Físico' }

export default async function NewPhysicalCountPage() {
  const supabase = await createServerSupabaseClient()

  const [locationsRes, productsRes] = await Promise.all([
    supabase.from('locations').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('products')
      .select('*, category:categories(id,name,color,prefix), unit:units(id,name,symbol)')
      .eq('is_active', true)
      .order('name'),
  ])

  return (
    <PhysicalCountForm
      locations={locationsRes.data ?? []}
      products={productsRes.data as any ?? []}
    />
  )
}
