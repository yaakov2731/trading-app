import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/db/client'
import { MovementsClient } from '../movements/movements-client'

export const metadata: Metadata = { title: 'Historial de Movimientos' }

// History is the full movement ledger — reuses the movements client
// with a default view showing all types, all locations

export default async function HistoryPage() {
  const supabase = await createServerSupabaseClient()

  const [locationsRes, movementsRes] = await Promise.all([
    supabase.from('locations').select('*').eq('is_active', true).order('sort_order'),
    supabase
      .from('v_movement_history')
      .select('*')
      .order('performed_at', { ascending: false })
      .limit(50),
  ])

  return (
    <MovementsClient
      locations={locationsRes.data ?? []}
      initialMovements={movementsRes.data ?? []}
    />
  )
}
