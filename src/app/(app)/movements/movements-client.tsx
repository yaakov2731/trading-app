'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { Filter, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty } from '@/components/ui/table'
import { MovementTypeBadge } from '@/components/ui/badge'
import { QuickMovementForm } from '@/components/features/quick-movement-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog'
import { getMovementHistory } from '@/server/actions/movements'
import { recordMovement } from '@/server/actions/movements'
import { formatDateTime, formatQuantity, formatSignedQuantity } from '@/lib/utils/format'
import type { MovementHistoryRow, Location, Product } from '@/lib/types'
import { cn } from '@/lib/utils/cn'

const PAGE_SIZE = 50

interface MovementsPageClientProps {
  locations: Location[]
  products:  Product[]
}

export function MovementsPageClient({ locations, products }: MovementsPageClientProps) {
  const searchParams   = useSearchParams()
  const defaultType    = searchParams.get('type') as any

  const [locationId,    setLocationId]    = React.useState(locations[0]?.id ?? '')
  const [movements,     setMovements]     = React.useState<MovementHistoryRow[]>([])
  const [total,         setTotal]         = React.useState(0)
  const [page,          setPage]          = React.useState(0)
  const [isLoading,     setIsLoading]     = React.useState(false)
  const [formOpen,      setFormOpen]      = React.useState(false)
  const [typeFilter,    setTypeFilter]    = React.useState(defaultType ?? '')
  const [dateFrom,      setDateFrom]      = React.useState('')
  const [dateTo,        setDateTo]        = React.useState('')

  const location = locations.find(l => l.id === locationId) ?? locations[0]

  async function fetchMovements(reset = false) {
    if (!locationId) return
    setIsLoading(true)
    try {
      const offset = reset ? 0 : page * PAGE_SIZE
      const result = await getMovementHistory(locationId, {
        movementType: typeFilter || undefined,
        dateFrom:     dateFrom || undefined,
        dateTo:       dateTo   || undefined,
        limit:        PAGE_SIZE,
        offset,
      })
      if (result.success && result.data) {
        if (reset) {
          setMovements(result.data.movements)
          setPage(0)
        } else {
          setMovements(prev => [...prev, ...result.data!.movements])
        }
        setTotal(result.data.total)
      }
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => { fetchMovements(true) }, [locationId, typeFilter, dateFrom, dateTo])

  async function handleMovementSubmit(data: any) {
    const result = await recordMovement(data)
    if (!result.success) throw new Error(result.error ?? 'Error')
    toast.success('Movimiento registrado')
    fetchMovements(true)
  }

  return (
    <div className="space-y-5">
      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={locationId} onValueChange={setLocationId}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Seleccionar local" />
          </SelectTrigger>
          <SelectContent>
            {locations.map(l => (
              <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los tipos</SelectItem>
            <SelectItem value="consumption_out">Consumo</SelectItem>
            <SelectItem value="purchase_in">Compra</SelectItem>
            <SelectItem value="waste_out">Merma</SelectItem>
            <SelectItem value="transfer_in">Transfer. Entrada</SelectItem>
            <SelectItem value="transfer_out">Transfer. Salida</SelectItem>
            <SelectItem value="manual_adjustment">Ajuste Manual</SelectItem>
            <SelectItem value="reconciliation_adjustment">Reconciliación</SelectItem>
          </SelectContent>
        </Select>

        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          placeholder="Desde"
        />
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          placeholder="Hasta"
        />

        <div className="flex-1" />

        <Button
          variant="primary"
          size="sm"
          onClick={() => setFormOpen(true)}
        >
          + Nuevo movimiento
        </Button>
      </div>

      {/* ── Total counter ─────────────────────────────────────────────────── */}
      <p className="text-sm text-slate-500">
        {total.toLocaleString('es-AR')} movimientos
        {typeFilter && ` de tipo "${typeFilter}"`}
      </p>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha / Hora</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right hidden md:table-cell">Saldo</TableHead>
              <TableHead className="hidden lg:table-cell">Referencia</TableHead>
              <TableHead className="hidden lg:table-cell">Usuario</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && movements.length === 0 ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><div className="h-4 rounded bg-slate-100 animate-pulse w-24" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : movements.length === 0 ? (
              <TableEmpty
                title="Sin movimientos"
                description="No hay movimientos con los filtros seleccionados"
                colSpan={7}
              />
            ) : (
              movements.map(mv => (
                <TableRow key={mv.id}>
                  <TableCell>
                    <span className="text-xs text-slate-500 font-mono">
                      {formatDateTime(mv.performed_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{mv.product_name}</p>
                      <p className="text-xs font-mono text-slate-400">{mv.sku}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <MovementTypeBadge type={mv.movement_type as any} />
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      'font-semibold tabular-nums text-sm',
                      mv.quantity > 0 ? 'text-success-600' : 'text-danger-600'
                    )}>
                      {formatSignedQuantity(mv.quantity)} {mv.unit_symbol}
                    </span>
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    {mv.running_balance != null ? (
                      <span className="text-sm tabular-nums text-slate-600">
                        {formatQuantity(mv.running_balance)} {mv.unit_symbol}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-xs text-slate-400 font-mono">
                      {mv.reference_code ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-xs text-slate-500">{mv.performed_by_name}</span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Load more */}
      {movements.length < total && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            size="sm"
            loading={isLoading}
            onClick={() => { setPage(p => p + 1); fetchMovements() }}
          >
            Cargar más ({total - movements.length} restantes)
          </Button>
        </div>
      )}

      {/* Quick movement form */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Registrar Movimiento</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {location && (
              <QuickMovementForm
                products={products}
                location={location}
                onSubmit={handleMovementSubmit}
                onSuccess={() => setFormOpen(false)}
              />
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  )
}
