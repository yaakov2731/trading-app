import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/db/client'
import { MovementsPageClient } from './movements-client'

export const metadata: Metadata = { title: 'Movimientos' }

export default async function MovementsPage() {
  const supabase = await createServerSupabaseClient()

  const [locationsRes, productsRes] = await Promise.all([
    supabase.from('locations').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('products').select('*, category:categories(*), unit:units(*)').eq('is_active', true).order('name'),
  ])

  return (
    <MovementsPageClient
      locations={locationsRes.data ?? []}
      products={productsRes.data as any ?? []}
    />
  )
}
