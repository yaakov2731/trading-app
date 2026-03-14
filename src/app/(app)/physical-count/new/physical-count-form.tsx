'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  ClipboardList, ArrowLeft, ArrowRight, CheckCircle2,
  TrendingUp, TrendingDown, Minus, ChevronRight
} from 'lucide-react'
import { z } from 'zod'
import { Button, SaveButton } from '@/components/ui/button'
import { Input, FormField, NumberInput } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createPhysicalCount } from '@/server/actions/physical-counts'
import { getLocationStockSnapshot } from '@/server/actions/physical-counts'
import { formatQuantity } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { Location, Product, CurrentStockRow } from '@/lib/types'
import Link from 'next/link'

// =============================================================================
// Physical Count Form — 3-step flow
// Step 1: Location + date
// Step 2: Enter counted quantities per product
// Step 3: Review discrepancies + confirm
// =============================================================================

const countItemSchema = z.object({
  product_id:       z.string(),
  product_name:     z.string(),
  product_sku:      z.string(),
  category_name:    z.string().optional(),
  unit_symbol:      z.string().optional(),
  system_quantity:  z.number(),
  counted_quantity: z.number().min(0, 'No puede ser negativo'),
  unit_cost:        z.number().optional(),
})

const formSchema = z.object({
  location_id: z.string().min(1, 'Seleccioná un local'),
  count_date:  z.string().min(1, 'La fecha es requerida'),
  notes:       z.string().optional(),
  items:       z.array(countItemSchema),
})

type FormValues = z.infer<typeof formSchema>
type Step = 1 | 2 | 3

interface Props {
  locations: Location[]
  products:  Product[]
}

export function PhysicalCountForm({ locations, products }: Props) {
  const router  = useRouter()
  const [step, setStep]       = React.useState<Step>(1)
  const [saving, setSaving]   = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const today = new Date().toISOString().slice(0, 10)

  const { register, control, handleSubmit, watch, setValue, getValues, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: { count_date: today, items: [] },
    })

  const { fields, replace } = useFieldArray({ control, name: 'items' })

  const locationId = watch('location_id')
  const watchItems = watch('items')
  const location   = locations.find(l => l.id === locationId)

  // ── Step 1 → Step 2: load stock snapshot for the location ─────────────────
  async function handleLoadStock() {
    if (!locationId) { toast.error('Seleccioná un local'); return }
    setLoading(true)
    try {
      const snapshot = await getLocationStockSnapshot(locationId) as CurrentStockRow[]
      if (!snapshot.length) {
        toast.info('Este local no tiene stock registrado. Se mostrará lista vacía.')
      }
      const items = snapshot.map(s => ({
        product_id:       s.product_id,
        product_name:     s.product_name,
        product_sku:      s.sku ?? '',
        category_name:    s.category_name ?? undefined,
        unit_symbol:      s.unit_symbol ?? undefined,
        system_quantity:  s.current_stock,
        counted_quantity: s.current_stock,  // pre-fill with system stock
        unit_cost:        s.unit_cost ?? undefined,
      }))
      replace(items)
      setStep(2)
    } catch (e) {
      toast.error('Error al cargar el stock')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2 → Step 3: review discrepancies ─────────────────────────────────
  function handleReview() {
    setStep(3)
  }

  // ── Computed discrepancies ─────────────────────────────────────────────────
  const discrepancies = React.useMemo(() => {
    if (!watchItems?.length) return { gainCount: 0, lossCount: 0, matchCount: 0, biggestLoss: null, biggestGain: null }
    let gainCount = 0, lossCount = 0, matchCount = 0
    let biggestLoss = null as any, biggestGain = null as any

    for (const item of watchItems) {
      const diff = item.counted_quantity - item.system_quantity
      if (Math.abs(diff) < 0.001) { matchCount++; continue }
      if (diff > 0) {
        gainCount++
        if (!biggestGain || diff > biggestGain.diff) biggestGain = { ...item, diff }
      } else {
        lossCount++
        if (!biggestLoss || diff < biggestLoss.diff) biggestLoss = { ...item, diff }
      }
    }
    return { gainCount, lossCount, matchCount, biggestLoss, biggestGain }
  }, [watchItems])

  // ── Final submit ───────────────────────────────────────────────────────────
  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      const result = await createPhysicalCount(values)
      if (!result.success) { toast.error(result.error); return }
      toast.success('Conteo físico guardado y stock reconciliado')
      router.push('/stock')
    } finally {
      setSaving(false)
    }
  }

  // ── Group items by category for display ───────────────────────────────────
  const groupedItems = React.useMemo(() => {
    const groups = new Map<string, typeof fields>()
    fields.forEach((field, idx) => {
      const cat = (watchItems?.[idx]?.category_name) ?? 'Sin categoría'
      if (!groups.has(cat)) groups.set(cat, [])
      groups.get(cat)!.push({ ...field, _idx: idx } as any)
    })
    return groups
  }, [fields, watchItems])

  // ==========================================================================
  // STEP 1 — Setup
  // ==========================================================================
  if (step === 1) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Conteo Físico</h1>
            <p className="text-sm text-slate-400">Reconciliación de stock por local</p>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2">
          {(['Configurar', 'Contar', 'Confirmar'] as const).map((label, i) => (
            <React.Fragment key={label}>
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold',
                  i === 0 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'
                )}>
                  {i + 1}
                </div>
                <span className={cn('text-xs font-medium', i === 0 ? 'text-brand-700' : 'text-slate-400')}>
                  {label}
                </span>
              </div>
              {i < 2 && <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>

        <Card padding="md" className="space-y-4">
          <FormField label="Local a contar" required error={errors.location_id?.message}>
            <Controller
              name="location_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger error={!!errors.location_id}>
                    <SelectValue placeholder="Seleccioná un local..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: loc.color }} />
                          {loc.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField label="Fecha del conteo" required error={errors.count_date?.message}>
            <Input type="date" {...register('count_date')} />
          </FormField>

          <FormField label="Notas">
            <Input {...register('notes')} placeholder="Ej: Conteo mensual de cierre..." />
          </FormField>

          {location && (
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ backgroundColor: location.color + '15' }}
            >
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: location.color }} />
              <p className="text-sm font-medium" style={{ color: location.color }}>
                Se cargarán todos los productos con stock en {location.name}
              </p>
            </div>
          )}

          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onClick={handleLoadStock}
            rightIcon={<ArrowRight size={16} />}
          >
            Cargar lista de productos
          </Button>
        </Card>
      </div>
    )
  }

  // ==========================================================================
  // STEP 2 — Enter counted quantities
  // ==========================================================================
  if (step === 2) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">
              Conteo — {location?.name}
            </h1>
            <p className="text-sm text-slate-400">{fields.length} productos · Ingresá las cantidades contadas</p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleReview}
            rightIcon={<ArrowRight size={15} />}
          >
            Revisar
          </Button>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2">
          {(['Configurar', 'Contar', 'Confirmar'] as const).map((label, i) => (
            <React.Fragment key={label}>
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold',
                  i < 1 ? 'bg-brand-600 text-white' : i === 1 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'
                )}>
                  {i < 1 ? <CheckCircle2 size={12} /> : i + 1}
                </div>
                <span className={cn('text-xs font-medium', i <= 1 ? 'text-brand-700' : 'text-slate-400')}>
                  {label}
                </span>
              </div>
              {i < 2 && <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>

        {/* Hint */}
        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
          <span className="text-amber-500 flex-shrink-0 mt-0.5">ℹ</span>
          <p className="text-xs text-amber-700">
            Los campos vienen pre-llenados con el stock del sistema. Modificá solo los que realmente
            contaste. Las diferencias generarán ajustes de reconciliación.
          </p>
        </div>

        {/* Products grouped by category */}
        {Array.from(groupedItems.entries()).map(([categoryName, items]) => (
          <Card key={categoryName} padding="none">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{categoryName}</p>
            </div>

            <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-5 py-2 border-b border-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              <span>Producto</span>
              <span className="text-right">Sistema</span>
              <span className="text-right">Contado</span>
              <span className="text-right">Diferencia</span>
            </div>

            <div className="divide-y divide-slate-50">
              {items.map((item: any) => {
                const idx     = item._idx as number
                const sys     = watchItems?.[idx]?.system_quantity ?? 0
                const counted = watchItems?.[idx]?.counted_quantity ?? 0
                const diff    = counted - sys

                return (
                  <div key={item.id} className="px-5 py-3">
                    <div className="grid sm:grid-cols-[2fr_1fr_1fr_1fr] gap-3 items-center">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.product_name}</p>
                        <p className="text-xs text-slate-400 font-mono">{item.product_sku}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-slate-600 tabular-nums">
                          {formatQuantity(sys)} {item.unit_symbol}
                        </span>
                      </div>
                      <div>
                        <Controller
                          name={`items.${idx}.counted_quantity`}
                          control={control}
                          render={({ field: f }) => (
                            <NumberInput
                              value={f.value ?? ''}
                              onChange={v => f.onChange(v === '' ? 0 : Number(v))}
                              min={0}
                              step={0.001}
                              className="h-9 text-right"
                            />
                          )}
                        />
                      </div>
                      <div className="text-right">
                        {Math.abs(diff) < 0.001 ? (
                          <span className="text-xs text-slate-300 font-medium">—</span>
                        ) : (
                          <span className={cn(
                            'text-sm font-bold tabular-nums flex items-center justify-end gap-1',
                            diff > 0 ? 'text-success-600' : 'text-danger-600'
                          )}>
                            {diff > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                            {diff > 0 ? '+' : ''}{formatQuantity(diff)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        ))}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => setStep(1)}>Volver</Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleReview}
            rightIcon={<ArrowRight size={15} />}
          >
            Revisar discrepancias
          </Button>
        </div>
      </div>
    )
  }

  // ==========================================================================
  // STEP 3 — Review + confirm
  // ==========================================================================
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Confirmar conteo</h1>
          <p className="text-sm text-slate-400">Revisá las diferencias antes de guardar</p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {(['Configurar', 'Contar', 'Confirmar'] as const).map((label, i) => (
          <React.Fragment key={label}>
            <div className="flex items-center gap-1.5">
              <div className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold',
                i < 2 ? 'bg-brand-600 text-white' : 'bg-brand-600 text-white'
              )}>
                {i < 2 ? <CheckCircle2 size={12} /> : 3}
              </div>
              <span className="text-xs font-medium text-brand-700">{label}</span>
            </div>
            {i < 2 && <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />}
          </React.Fragment>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-surface p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{discrepancies.matchCount}</p>
          <p className="text-xs text-slate-400 mt-1">Sin diferencia</p>
        </div>
        <div className={cn(
          'p-4 text-center rounded-xl border',
          discrepancies.gainCount > 0 ? 'bg-success-50 border-success-200' : 'bg-white border-slate-200'
        )}>
          <p className={cn('text-2xl font-bold', discrepancies.gainCount > 0 ? 'text-success-700' : 'text-slate-400')}>
            +{discrepancies.gainCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">Sobrante</p>
        </div>
        <div className={cn(
          'p-4 text-center rounded-xl border',
          discrepancies.lossCount > 0 ? 'bg-danger-50 border-danger-200' : 'bg-white border-slate-200'
        )}>
          <p className={cn('text-2xl font-bold', discrepancies.lossCount > 0 ? 'text-danger-700' : 'text-slate-400')}>
            -{discrepancies.lossCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">Faltante</p>
        </div>
      </div>

      {/* Discrepancy list */}
      {(discrepancies.gainCount + discrepancies.lossCount) > 0 ? (
        <Card padding="none">
          <div className="px-5 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Diferencias a ajustar</p>
          </div>
          <div className="divide-y divide-slate-50">
            {watchItems
              .map((item, idx) => ({ ...item, idx }))
              .filter(item => Math.abs(item.counted_quantity - item.system_quantity) >= 0.001)
              .map(item => {
                const diff = item.counted_quantity - item.system_quantity
                return (
                  <div key={item.product_id} className="px-5 py-3 flex items-center gap-3">
                    <div className={cn(
                      'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      diff > 0 ? 'bg-success-50' : 'bg-danger-50'
                    )}>
                      {diff > 0
                        ? <TrendingUp size={14} className="text-success-600" />
                        : <TrendingDown size={14} className="text-danger-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{item.product_name}</p>
                      <p className="text-xs text-slate-400 font-mono">{item.product_sku}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-400 tabular-nums">
                        {formatQuantity(item.system_quantity)} → {formatQuantity(item.counted_quantity)} {item.unit_symbol}
                      </p>
                      <p className={cn(
                        'text-sm font-bold tabular-nums',
                        diff > 0 ? 'text-success-600' : 'text-danger-600'
                      )}>
                        {diff > 0 ? '+' : ''}{formatQuantity(diff)}
                      </p>
                    </div>
                  </div>
                )
              })}
          </div>
        </Card>
      ) : (
        <Card padding="md" className="text-center">
          <CheckCircle2 size={32} className="text-success-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-900">Sin diferencias</p>
          <p className="text-xs text-slate-400 mt-0.5">El stock físico coincide con el sistema</p>
        </Card>
      )}

      {/* Confirm disclaimer */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Al confirmar:</span> se guardarán{' '}
          {discrepancies.gainCount + discrepancies.lossCount} ajuste{(discrepancies.gainCount + discrepancies.lossCount) !== 1 ? 's' : ''} de
          reconciliación en el ledger de movimientos. Esta acción no se puede deshacer.
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={() => setStep(2)}>
          Volver a editar
        </Button>
        <SaveButton type="submit" size="md" loading={saving}>
          Confirmar y guardar conteo
        </SaveButton>
      </div>
    </form>
  )
}
