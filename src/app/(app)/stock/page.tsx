import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/db/client'
import { StockPageClient } from './stock-client'

export const metadata: Metadata = { title: 'Stock Actual' }

export default async function StockPage({
  searchParams,
}: {
  searchParams: { location?: string }
}) {
  const supabase = await createServerSupabaseClient()

  const [stockRes, locationsRes, productsRes] = await Promise.all([
    supabase.from('v_current_stock').select('*').order('category_name').order('product_name'),
    supabase.from('locations').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('products').select('*, category:categories(*), unit:units(*)').eq('is_active', true).order('name'),
  ])

  return (
    <StockPageClient
      allStock={stockRes.data ?? []}
      locations={locationsRes.data ?? []}
      products={productsRes.data as any ?? []}
      defaultLocationId={searchParams.location}
    />
  )
}
