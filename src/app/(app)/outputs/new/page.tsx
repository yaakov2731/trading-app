import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { OutputPageClient } from './output-page-client'

export const metadata: Metadata = { title: 'Registrar Salida' }

export default async function NewOutputPage() {
  const supabase = await createServerSupabaseClient()

  const [locationsRes, productsRes] = await Promise.all([
    supabase.from('locations').select('*').eq('is_active', true).order('sort_order'),
    supabase
      .from('products')
      .select('*, category:categories(id,name,color,prefix), unit:units(id,name,symbol)')
      .eq('is_active', true)
      .order('name'),
  ])

  return (
    <OutputPageClient
      locations={locationsRes.data ?? []}
      products={productsRes.data as any ?? []}
    />
  )
}
