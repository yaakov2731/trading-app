import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MovementsPageClient } from './movements-client'

export const metadata: Metadata = { title: 'Movimientos' }

export default async function MovementsPage() {
  const supabase = await createServerSupabaseClient()

  const [locationsRes, productsRes, recentRes] = await Promise.all([
    supabase
      .from('locations')
      .select('*')
      .eq('is_active', true)
      .order('sort_order'),

    supabase
      .from('products')
      .select('*, category:categories(id,name,color,prefix), unit:units(id,name,symbol)')
      .eq('is_active', true)
      .order('name'),

    // Pre-load first page server-side — no spinner on initial render
    supabase
      .from('v_movement_history')
      .select('*')
      .order('performed_at', { ascending: false })
      .limit(50),
  ])

  return (
    <MovementsPageClient
      locations={locationsRes.data ?? []}
      products={productsRes.data as any ?? []}
      initialMovements={recentRes.data ?? []}
    />
  )
}
