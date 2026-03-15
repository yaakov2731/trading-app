import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ProductsPageClient } from './products-client'

export const metadata: Metadata = { title: 'Productos' }

export default async function ProductsPage() {
  const supabase = await createServerSupabaseClient()

  const [productsRes, categoriesRes, unitsRes] = await Promise.all([
    supabase.from('products').select('*, category:categories(*), unit:units(*)').order('name'),
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('units').select('*').eq('is_active', true).order('name'),
  ])

  return (
    <ProductsPageClient
      initialProducts={productsRes.data as any ?? []}
      categories={categoriesRes.data ?? []}
      units={unitsRes.data ?? []}
    />
  )
}
