import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/db/client'
import { AlertTriangle, Package, MapPin } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { StockStatusBadge } from '@/components/ui/badge'
import { formatQuantity, formatTimeAgo } from '@/lib/utils/format'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Alertas de Stock' }

export default async function AlertsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: alerts } = await supabase
    .from('v_low_stock_alerts')
    .select('*')
    .order('stock_status')
    .order('location_name')
    .order('product_name')

  const zeroItems    = alerts?.filter(a => a.stock_status === 'zero')    ?? []
  const lowItems     = alerts?.filter(a => a.stock_status === 'low')     ?? []
  const warningItems = alerts?.filter(a => a.stock_status === 'warning') ?? []

  if (!alerts || alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-2xl bg-success-50 p-5 mb-4">
          <Package size={32} className="text-success-500" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800">Sin alertas activas</h2>
        <p className="mt-1 text-sm text-slate-500">Todo el stock está en niveles normales.</p>
      </div>
    )
  }

  const AlertSection = ({
    title,
    items,
    variant,
  }: {
    title: string
    items: any[]
    variant: 'zero' | 'low' | 'warning'
  }) => {
    if (items.length === 0) return null
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} className={
            variant === 'zero'    ? 'text-danger-500' :
            variant === 'low'     ? 'text-danger-400' :
            'text-amber-500'
          } />
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
          <span className="ml-1 text-xs font-bold text-slate-400">({items.length})</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {items.map(alert => (
            <Card key={`${alert.product_id}-${alert.location_id}`} variant="default" padding="md">
              <div className="flex items-start gap-3">
                <div className={[
                  'h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0',
                  variant === 'zero'    ? 'bg-danger-50' :
                  variant === 'low'     ? 'bg-danger-50' :
                  'bg-amber-50'
                ].join(' ')}>
                  <Package size={16} className={
                    variant === 'zero'    ? 'text-danger-500' :
                    variant === 'low'     ? 'text-danger-400' :
                    'text-amber-500'
                  } />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{alert.product_name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin size={11} className="text-slate-400" />
                    <p className="text-xs text-slate-500 truncate">{alert.location_name}</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-xs text-slate-400">Stock actual</p>
                  <p className={[
                    'text-lg font-bold tabular-nums',
                    variant === 'zero' ? 'text-danger-600' : variant === 'low' ? 'text-danger-500' : 'text-amber-600'
                  ].join(' ')}>
                    {formatQuantity(alert.current_stock)} {alert.unit_symbol}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Mínimo</p>
                  <p className="text-sm font-medium text-slate-600 tabular-nums">
                    {formatQuantity(alert.min_stock)} {alert.unit_symbol}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <StockStatusBadge status={alert.stock_status as any} size="sm" />
                <Link
                  href={`/stock?location=${alert.location_id}`}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  Ver stock →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-amber-50 p-2.5">
          <AlertTriangle size={20} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Alertas de Stock</h1>
          <p className="text-sm text-slate-500">{alerts.length} productos requieren atención</p>
        </div>
      </div>

      <AlertSection title="Sin Stock"     items={zeroItems}    variant="zero"    />
      <AlertSection title="Stock Crítico" items={lowItems}     variant="low"     />
      <AlertSection title="Stock Bajo"    items={warningItems} variant="warning" />
    </div>
  )
}
