import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SettingsPageClient } from './settings-client'

export const metadata: Metadata = { title: 'Configuración' }

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()

  const [categoriesRes, unitsRes, locationsRes] = await Promise.all([
    supabase.from('categories').select('*, sku_sequences(last_sequence)').order('sort_order'),
    supabase.from('units').select('*').order('name'),
    supabase.from('locations').select('*').order('sort_order'),
  ])

  return (
    <SettingsPageClient
      categories={categoriesRes.data ?? []}
      units={unitsRes.data ?? []}
      locations={locationsRes.data ?? []}
    />
  )
}
