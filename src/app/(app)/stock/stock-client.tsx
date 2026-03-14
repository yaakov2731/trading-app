'use client'

import * as React from 'react'
import { Download, Zap, Package, AlertTriangle, TrendingDown, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { StockTable } from '@/components/features/stock-table'
import { QuickMovementForm } from '@/components/features/quick-movement-form'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody,
} from '@/components/ui/dialog'
import { recordMovement } from '@/server/actions/movements'
import { exportToExcel } from '@/lib/utils/export'
import { getExportData } from '@/server/actions/export'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { CurrentStockRow, Location, Product } from '@/lib/types'

interface StockPageClientProps {
  allStock:          CurrentStockRow[]
  locations:         Location[]
  products:          Product[]
  defaultLocationId?: string
}

export function StockPageClient({
  allStock,
  locations,
  products,
  defaultLocationId,
}: StockPageClientProps) {
  const [activeLocationId, setActiveLocationId] = React.useState(
    defaultLocationId ?? locations[0]?.id ?? ''
  )
  const [quickMovementOpen, setQuickMovementOpen] = React.useState(false)
  const [selectedProduct, setSelectedProduct]     = React.useState<CurrentStockRow | null>(null)
  const [isExporting, setIsExporting]             = React.useState(false)

  const activeLocation = locations.find(l => l.id === activeLocationId) ?? locations[0]
  const locationStock  = allStock.filter(s => s.location_id === activeLocationId)
  const currentStock   = selectedProduct
    ? locationStock.find(s => s.product_id === selectedProduct.product_id)?.current_stock
    : undefined

  // KPI stats for the active location
  const stats = React.useMemo(() => ({
    total: locationStock.length,
    zero:  locationStock.filter(i => i.stock_status === 'zero').length,
    low:   locationStock.filter(i => i.stock_status === 'low' || i.stock_status === 'warning').length,
    value: locationStock.reduce((sum, i) => sum + (i.stock_value ?? 0), 0),
  }), [locationStock])

  async function handleMovementSubmit(data: any) {
    const result = await recordMovement(data)
    if (!result.success) throw new Error(result.error ?? 'Error al registrar movimiento')
    toast.success('Movimiento registrado correctamente')
  }

  async function handleExport() {
    setIsExporting(true)
    try {
      const result = await getExportData(activeLocationId)
      if (!result.success || !result.data) { toast.error('Error al exportar datos'); return }
      await exportToExcel(result.data)
      toast.success('Exportación exitosa')
    } catch {
      toast.error('Error al generar el archivo')
    } finally {
      setIsExporting(false)
    }
  }

  function handleRowClick(item: CurrentStockRow) {
    setSelectedProduct(item)
    setQuickMovementOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-up">

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Stock Actual</h1>
          <p className="text-sm text-slate-500 mt-0.5">Inventario en tiempo real por ubicación</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            loading={isExporting}
            onClick={handleExport}
            leftIcon={<Download size={15} />}
          >
            Exportar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => { setSelectedProduct(null); setQuickMovementOpen(true) }}
            leftIcon={<Zap size={15} />}
          >
            Movimiento
          </Button>
        </div>
      </div>

      {/* ── Location tabs ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
        {locations.map(loc => {
          const isActive  = loc.id === activeLocationId
          const locStock  = allStock.filter(s => s.location_id === loc.id)
          const locAlerts = locStock.filter(s => s.stock_status === 'zero' || s.stock_status === 'low').length

          return (
            <button
              key={loc.id}
              onClick={() => setActiveLocationId(loc.id)}
              className={cn(
                'flex-shrink-0 flex items-center gap-2.5 px-4 h-10 rounded-2xl text-sm font-semibold',
                'transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                isActive
                  ? 'text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:shadow-sm',
              )}
              style={isActive ? {
                backgroundColor: loc.color,
                boxShadow: `0 4px 16px ${loc.color}45, 0 2px 6px ${loc.color}25`,
              } : {}}
            >
              <span
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.65)' : loc.color }}
              />
              {loc.name}
              {locAlerts > 0 && (
                <span className={cn(
                  'flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none',
                  isActive ? 'bg-black/15 text-white' : 'bg-danger-100 text-danger-700',
                )}>
                  {locAlerts}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          {
            label:  'Productos',
            value:  String(stats.total),
            icon:   <Package size={18} />,
            iconBg: 'bg-brand-50 text-brand-600',
            val:    'text-slate-900',
            accent: 'from-brand-50/50',
          },
          {
            label:  'Sin Stock',
            value:  String(stats.zero),
            icon:   <AlertTriangle size={18} />,
            iconBg: stats.zero > 0 ? 'bg-danger-50 text-danger-600' : 'bg-slate-50 text-slate-300',
            val:    stats.zero > 0 ? 'text-danger-600' : 'text-slate-300',
            accent: stats.zero > 0 ? 'from-danger-50/50' : 'from-transparent',
          },
          {
            label:  'Stock Bajo',
            value:  String(stats.low),
            icon:   <TrendingDown size={18} />,
            iconBg: stats.low > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-300',
            val:    stats.low > 0 ? 'text-amber-600' : 'text-slate-300',
            accent: stats.low > 0 ? 'from-amber-50/50' : 'from-transparent',
          },
          {
            label:  'Valor Total',
            value:  formatCurrency(stats.value),
            icon:   <DollarSign size={18} />,
            iconBg: 'bg-success-50 text-success-600',
            val:    'text-slate-900',
            accent: 'from-success-50/40',
          },
        ] as const).map(kpi => (
          <div
            key={kpi.label}
            className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-card p-4 flex items-center gap-3"
          >
            <div className={cn('absolute inset-0 bg-gradient-to-br to-transparent pointer-events-none', kpi.accent)} />
            <div className={cn('relative rounded-xl p-2.5 flex-shrink-0', kpi.iconBg)}>
              {kpi.icon}
            </div>
            <div className="relative min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1.5">
                {kpi.label}
              </p>
              <p className={cn('text-[22px] font-bold tabular-nums leading-none truncate', kpi.val)}>
                {kpi.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Stock table ────────────────────────────────────────────────────── */}
      <StockTable
        items={locationStock}
        onRowClick={handleRowClick}
        hideSummary
      />

      {/* ── Quick movement dialog ──────────────────────────────────────────── */}
      <Dialog open={quickMovementOpen} onOpenChange={setQuickMovementOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? `Movimiento — ${selectedProduct.product_name}` : 'Registrar Movimiento'}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            {activeLocation && (
              <QuickMovementForm
                products={products}
                location={activeLocation}
                currentStock={currentStock}
                defaultProductId={selectedProduct?.product_id}
                onSubmit={handleMovementSubmit}
                onSuccess={() => setQuickMovementOpen(false)}
              />
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  )
}
