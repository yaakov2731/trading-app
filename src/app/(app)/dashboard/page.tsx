import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch all locations with their stock stats
  const [locationsRes, stockRes, movementsRes, alertsRes] = await Promise.all([
    supabase.from('locations').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('v_current_stock').select('*'),
    supabase.from('v_movement_history').select('*').order('performed_at', { ascending: false }).limit(20),
    supabase.from('v_low_stock_alerts').select('*').order('stock_status'),
  ])

  return (
    <DashboardClient
      locations={locationsRes.data ?? []}
      allStock={stockRes.data ?? []}
      recentMovements={movementsRes.data ?? []}
      alerts={alertsRes.data ?? []}
    />
  )
}
