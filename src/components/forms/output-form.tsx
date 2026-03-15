'use client'

import * as React from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Trash2, Zap, AlertCircle } from 'lucide-react'
import { z } from 'zod'
import { Button, SaveButton } from '@/components/ui/button'
import { Input, FormField, NumberInput } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { recordBulkConsumption } from '@/server/actions/movements'
import { formatQuantity } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { Location, Product } from '@/lib/types'

// =============================================================================
// Output Form — batch recording of consumption, waste, or manual adjustments
// =============================================================================

const OUTPUT_TYPES = [
  { value: 'consumption_out',  label: 'Consumo',           color: 'bg-blue-500',   description: 'Uso en producción o servicio' },
  { value: 'waste_out',        label: 'Merma / Pérdida',   color: 'bg-red-500',    description: 'Producto dañado, vencido, derramado' },
  { value: 'manual_adjustment',label: 'Ajuste manual',     color: 'bg-amber-500',  description: 'Corrección libre con notas' },
] as const

type OutputType = (typeof OUTPUT_TYPES)[number]['value']

const lineItemSchema = z.object({
  product_id: z.string().min(1, 'Seleccioná un producto'),
  quantity:   z.number().positive('Debe ser mayor a 0'),
  notes:      z.string().optional(),
})

const formSchema = z.object({
  location_id:  z.string().min(1, 'Seleccioná un local'),
  movement_type: z.enum(['consumption_out', 'waste_out', 'manual_adjustment']),
  global_notes:  z.string().optional(),
  items:         z.array(lineItemSchema).min(1, 'Agregá al menos un producto'),
})

type FormValues = z.infer<typeof formSchema>

export interface OutputFormProps {
  locations:   Location[]
  products:    Product[]
  /** Pre-selected location */
  defaultLocationId?: string
  /** Pre-selected movement type */
  defaultType?: OutputType
  onSuccess?:  () => void
  onCancel?:   () => void
}

export function OutputForm({
  locations,
  products,
  defaultLocationId,
  defaultType = 'consumption_out',
  onSuccess,
  onCancel,
}: OutputFormProps) {
  const [saving,    setSaving]    = React.useState(false)
  const [stockMap,  setStockMap]  = React.useState<Record<string, number>>({})
  const [loadingStock, setLoadingStock] = React.useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location_id:   defaultLocationId ?? '',
      movement_type: defaultType,
      items:         [{ product_id: '', quantity: 1 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems    = watch('items')
  const locationId      = watch('location_id')
  const movementType    = watch('movement_type')

  const selectedType = OUTPUT_TYPES.find(t => t.value === movementType) ?? OUTPUT_TYPES[0]

  // ── Load current stock when location changes ───────────────────────────────
  React.useEffect(() => {
    if (!locationId) return
    setLoadingStock(true)
    // Minimal stock fetch — just product_id + current_stock for warnings
    fetch(`/api/stock?location_id=${locationId}`)
      .then(r => r.ok ? r.json() : [])
      .then((rows: any[]) => {
        const map: Record<string, number> = {}
        for (const r of rows) map[r.product_id] = r.current_stock ?? 0
        setStockMap(map)
      })
      .catch(() => {})
      .finally(() => setLoadingStock(false))
  }, [locationId])

  function getProduct(id: string) {
    return products.find(p => p.id === id)
  }

  function getStock(productId: string) {
    return stockMap[productId] ?? null
  }

  function wouldGoNegative(productId: string, qty: number) {
    const stock = getStock(productId)
    return stock !== null && qty > stock
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      const result = await recordBulkConsumption({
        location_id:   values.location_id,
        movement_type: values.movement_type,
        items:         values.items.map(item => ({
          product_id: item.product_id,
          quantity:   item.quantity,
          notes:      item.notes || values.global_notes,
        })),
      })

      if (!result.success) {
        toast.error(result.error ?? 'Error al registrar salida')
        return
      }

      const itemCount = values.items.length
      toast.success(
        `${selectedType.label} registrado — ${itemCount} producto${itemCount !== 1 ? 's' : ''}`
      )
      onSuccess?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* ── Movement type selector ───────────────────────────────────────── */}
      <Card padding="md">
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Zap size={14} className="text-brand-500" />
          Tipo de salida
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {OUTPUT_TYPES.map(type => {
            const isSelected = movementType === type.value
            return (
              <Controller
                key={type.value}
                name="movement_type"
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(type.value)}
                    className={cn(
                      'flex flex-col items-start p-3 rounded-xl border text-left transition-all',
                      isSelected
                        ? 'border-brand-300 bg-brand-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <div className={cn('h-2 w-2 rounded-full mb-2', type.color)} />
                    <p className={cn(
                      'text-xs font-semibold',
                      isSelected ? 'text-brand-700' : 'text-slate-700'
                    )}>
                      {type.label}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-snug hidden sm:block">
                      {type.description}
                    </p>
                  </button>
                )}
              />
            )
          })}
        </div>
      </Card>

      {/* ── Location + notes ─────────────────────────────────────────────── */}
      <Card padding="md">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Local" required error={errors.location_id?.message}>
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
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: loc.color }} />
                          {loc.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField label="Notas globales" hint="Aplica a todos los productos">
            <Input {...register('global_notes')} placeholder="Ej: Servicio del turno noche..." />
          </FormField>
        </div>
      </Card>

      {/* ── Product line items ────────────────────────────────────────────── */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            Productos a descontar
            <span className="ml-2 text-xs font-normal text-slate-400">({fields.length})</span>
          </h2>
          <Button
            type="button" variant="ghost" size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => append({ product_id: '', quantity: 1 })}
          >
            Agregar
          </Button>
        </div>

        {/* Column headers */}
        <div className="hidden sm:grid grid-cols-[2fr_1fr_2fr_auto] gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span>Producto</span>
          <span>Cantidad a descontar</span>
          <span>Notas del ítem</span>
          <span />
        </div>

        <div className="divide-y divide-slate-50">
          {fields.map((field, index) => {
            const productId = watchedItems?.[index]?.product_id ?? ''
            const qty       = watchedItems?.[index]?.quantity ?? 0
            const product   = getProduct(productId)
            const stock     = getStock(productId)
            const negative  = productId && qty > 0 && wouldGoNegative(productId, qty)

            return (
              <div key={field.id} className={cn(
                'px-5 py-4',
                negative && 'bg-danger-50/30'
              )}>
                <div className="grid sm:grid-cols-[2fr_1fr_2fr_auto] gap-3 items-start">
                  {/* Product */}
                  <div>
                    <Controller
                      name={`items.${index}.product_id`}
                      control={control}
                      render={({ field: f }) => (
                        <Select value={f.value} onValueChange={f.onChange}>
                          <SelectTrigger error={!!errors.items?.[index]?.product_id} className="h-9">
                            <SelectValue placeholder="Seleccionar producto..." />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs text-slate-400">{p.sku}</span>
                                  <span className="truncate">{p.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {product && stock !== null && (
                      <p className={cn(
                        'text-xs mt-1',
                        negative ? 'text-danger-600 font-semibold' : 'text-slate-400'
                      )}>
                        Stock: {formatQuantity(stock)} {product.unit?.symbol}
                        {negative && ' — insuficiente'}
                      </p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div>
                    <Controller
                      name={`items.${index}.quantity`}
                      control={control}
                      render={({ field: f }) => (
                        <NumberInput
                          value={f.value ?? ''}
                          onChange={v => f.onChange(v === '' ? 0 : Number(v))}
                          min={0.001} step={0.001} placeholder="0"
                          className={cn('h-9', negative && 'border-danger-300 focus:border-danger-400')}
                          error={!!errors.items?.[index]?.quantity}
                        />
                      )}
                    />
                    {negative && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertCircle size={11} className="text-danger-500 flex-shrink-0" />
                        <p className="text-xs text-danger-600">Stock insuficiente</p>
                      </div>
                    )}
                  </div>

                  {/* Notes per item */}
                  <Input
                    {...register(`items.${index}.notes`)}
                    placeholder="Nota del ítem (opcional)..."
                    className="h-9"
                  />

                  {/* Remove */}
                  <Button
                    type="button" variant="ghost" size="icon-sm"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="text-slate-300 hover:text-danger-500 mt-0.5"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* ── Submit bar ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-900">{fields.length}</span> producto{fields.length !== 1 ? 's' : ''}
          {' '}· Tipo: <span className="font-semibold">{selectedType.label}</span>
        </p>
        <div className="flex items-center gap-3">
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
          )}
          <SaveButton type="submit" loading={saving}>
            Confirmar salida
          </SaveButton>
        </div>
      </div>
    </form>
  )
}
