'use client'

import * as React from 'react'
import { Plus, Download, RefreshCw, Zap } from 'lucide-react'
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
import type { CurrentStockRow, Location, Product } from '@/lib/types'

interface StockPageClientProps {
  allStock:         CurrentStockRow[]
  locations:        Location[]
  products:         Product[]
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

  async function handleMovementSubmit(data: any) {
    const result = await recordMovement(data)
    if (!result.success) {
      throw new Error(result.error ?? 'Error al registrar movimiento')
    }
    toast.success('Movimiento registrado correctamente')
  }

  async function handleExport() {
    setIsExporting(true)
    try {
      const result = await getExportData(activeLocationId)
      if (!result.success || !result.data) {
        toast.error('Error al exportar datos')
        return
      }
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
    <div className="space-y-5">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Location tabs */}
        <div className="flex items-center gap-2 overflow-x-auto flex-1">
          {locations.map(loc => (
            <button
              key={loc.id}
              onClick={() => setActiveLocationId(loc.id)}
              className={[
                'flex-shrink-0 flex items-center gap-2 px-3.5 h-9 rounded-xl text-sm font-medium border transition-all duration-150',
                activeLocationId === loc.id
                  ? 'text-white border-transparent shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
              ].join(' ')}
              style={activeLocationId === loc.id ? { backgroundColor: loc.color, borderColor: loc.color } : {}}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: activeLocationId === loc.id ? 'rgba(255,255,255,0.7)' : loc.color }}
              />
              {loc.name}
            </button>
          ))}
        </div>

        {/* Actions */}
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

      {/* ── Stock table ───────────────────────────────────────────────────── */}
      <StockTable
        items={locationStock}
        onRowClick={handleRowClick}
      />

      {/* ── Quick movement dialog ─────────────────────────────────────────── */}
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
