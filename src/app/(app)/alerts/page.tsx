import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/db/client'
import { LowStockList } from '@/components/alerts/low-stock-list'
import type { LowStockAlert } from '@/components/alerts/low-stock-list'

export const metadata: Metadata = { title: 'Alertas de Stock' }

// Revalidate every 60s so alerts stay fresh without manual refresh
export const revalidate = 60

export default async function AlertsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: rawAlerts } = await supabase
    .from('v_low_stock_alerts')
    .select('*')
    .order('stock_status')
    .order('location_name')
    .order('product_name')

  // Map DB rows to the LowStockAlert interface
  const alerts: LowStockAlert[] = (rawAlerts ?? []).map((a: any) => ({
    product_id:      a.product_id,
    product_name:    a.product_name,
    sku:             a.sku ?? '',
    category_name:   a.category_name ?? undefined,
    category_color:  a.category_color ?? undefined,
    location_id:     a.location_id,
    location_name:   a.location_name,
    location_color:  a.location_color ?? undefined,
    current_stock:   a.current_stock ?? 0,
    min_stock:       a.min_stock ?? 0,
    unit_symbol:     a.unit_symbol ?? undefined,
    stock_status:    a.stock_status as 'zero' | 'low' | 'warning',
    last_movement_at: a.last_movement_at ?? null,
  }))

  return (
    <div className="max-w-7xl mx-auto">
      <LowStockList alerts={alerts} compact={false} />
    </div>
  )
}
