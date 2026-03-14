'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Trash2, ShoppingCart, Package, ChevronDown, ArrowLeft } from 'lucide-react'
import { z } from 'zod'
import { Button, SaveButton } from '@/components/ui/button'
import { Input, FormField, NumberInput } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createPurchaseEntry } from '@/server/actions/purchases'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { Location, Product } from '@/lib/types'
import Link from 'next/link'

// ── Inline schema (mirrors createPurchaseEntrySchema) ─────────────────────────
const lineItemSchema = z.object({
  product_id:        z.string().min(1, 'Seleccioná un producto'),
  quantity_expected: z.number().positive().optional(),
  quantity_received: z.number().positive('La cantidad debe ser mayor a 0'),
  unit_cost:         z.number().min(0).optional(),
  notes:             z.string().optional(),
})

const formSchema = z.object({
  location_id:            z.string().min(1, 'Seleccioná un local'),
  supplier_id:            z.string().optional(),
  entry_date:             z.string().min(1, 'La fecha es requerida'),
  expected_delivery_date: z.string().optional(),
  reference_number:       z.string().optional(),
  notes:                  z.string().optional(),
  items:                  z.array(lineItemSchema).min(1, 'Agregá al menos un producto'),
})

type FormValues = z.infer<typeof formSchema>

interface Props {
  locations: Location[]
  suppliers: any[]
  products:  Product[]
}

export function PurchaseForm({ locations, suppliers, products }: Props) {
  const router   = useRouter()
  const [saving, setSaving] = React.useState(false)

  const today = new Date().toISOString().slice(0, 10)

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entry_date: today,
      items: [{ product_id: '', quantity_received: 1 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')

  // ── Derived totals ─────────────────────────────────────────────────────────
  const totalAmount = React.useMemo(
    () => watchedItems?.reduce((sum, item) =>
      sum + (item.quantity_received || 0) * (item.unit_cost || 0), 0) ?? 0,
    [watchedItems]
  )

  const totalUnits = React.useMemo(
    () => watchedItems?.reduce((sum, item) => sum + (item.quantity_received || 0), 0) ?? 0,
    [watchedItems]
  )

  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      const result = await createPurchaseEntry(values)
      if (!result.success) { toast.error(result.error); return }
      toast.success(`Compra registrada — ${fields.length} producto${fields.length !== 1 ? 's' : ''}`)
      router.push('/purchases')
    } finally {
      setSaving(false)
    }
  }

  function getProduct(id: string) {
    return products.find(p => p.id === id)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Nueva Compra</h1>
          <p className="text-sm text-slate-400">Registrá el ingreso de mercadería</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* ── Header fields ────────────────────────────────────────────── */}
        <Card padding="md">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <ShoppingCart size={15} className="text-brand-500" />
            Datos de la compra
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Local de destino" required error={errors.location_id?.message}>
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

            <FormField label="Proveedor" hint="Opcional">
              <Controller
                name="supplier_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={v => field.onChange(v || undefined)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin proveedor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="Fecha de ingreso" required error={errors.entry_date?.message}>
              <Input type="date" {...register('entry_date')} />
            </FormField>

            <FormField label="N° de remito / referencia">
              <Input {...register('reference_number')} placeholder="Ej: REM-0012345" />
            </FormField>

            <FormField label="Notas" className="sm:col-span-2">
              <Input {...register('notes')} placeholder="Notas internas opcionales..." />
            </FormField>
          </div>
        </Card>

        {/* ── Line items ───────────────────────────────────────────────── */}
        <Card padding="none">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Package size={15} className="text-brand-500" />
              Productos
              <span className="text-xs font-normal text-slate-400">({fields.length})</span>
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => append({ product_id: '', quantity_received: 1 })}
            >
              Agregar línea
            </Button>
          </div>

          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span>Producto</span>
            <span>Cant. esperada</span>
            <span>Cant. recibida</span>
            <span>Costo unit.</span>
            <span />
          </div>

          <div className="divide-y divide-slate-50">
            {fields.map((field, index) => {
              const product = getProduct(watchedItems?.[index]?.product_id ?? '')
              const lineTotal = (watchedItems?.[index]?.quantity_received ?? 0) * (watchedItems?.[index]?.unit_cost ?? 0)

              return (
                <div key={field.id} className="px-5 py-4">
                  <div className="grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 items-start">
                    {/* Product selector */}
                    <div>
                      <Controller
                        name={`items.${index}.product_id`}
                        control={control}
                        render={({ field: f }) => (
                          <Select value={f.value} onValueChange={f.onChange}>
                            <SelectTrigger error={!!errors.items?.[index]?.product_id} className="h-9">
                              <SelectValue placeholder="Buscar producto..." />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-mono text-xs text-slate-400 flex-shrink-0">{p.sku}</span>
                                    <span className="truncate">{p.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {product && (
                        <p className="text-xs text-slate-400 mt-1">
                          {product.category?.name} · {product.unit?.symbol}
                        </p>
                      )}
                      {errors.items?.[index]?.product_id && (
                        <p className="text-xs text-danger-600 mt-1">{errors.items[index]!.product_id!.message}</p>
                      )}
                    </div>

                    {/* Qty expected */}
                    <Controller
                      name={`items.${index}.quantity_expected`}
                      control={control}
                      render={({ field: f }) => (
                        <NumberInput
                          value={f.value ?? ''}
                          onChange={v => f.onChange(v === '' ? undefined : Number(v))}
                          min={0}
                          step={0.001}
                          placeholder="—"
                          className="h-9"
                        />
                      )}
                    />

                    {/* Qty received */}
                    <Controller
                      name={`items.${index}.quantity_received`}
                      control={control}
                      render={({ field: f }) => (
                        <NumberInput
                          value={f.value ?? ''}
                          onChange={v => f.onChange(v === '' ? 0 : Number(v))}
                          min={0}
                          step={0.001}
                          placeholder="0"
                          className="h-9"
                          error={!!errors.items?.[index]?.quantity_received}
                        />
                      )}
                    />

                    {/* Unit cost */}
                    <div>
                      <Controller
                        name={`items.${index}.unit_cost`}
                        control={control}
                        render={({ field: f }) => (
                          <NumberInput
                            value={f.value ?? ''}
                            onChange={v => f.onChange(v === '' ? undefined : Number(v))}
                            min={0}
                            step={0.01}
                            placeholder="$0.00"
                            className="h-9"
                          />
                        )}
                      />
                      {lineTotal > 0 && (
                        <p className="text-xs text-slate-400 mt-1 tabular-nums text-right">
                          = {formatCurrency(lineTotal)}
                        </p>
                      )}
                    </div>

                    {/* Remove */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
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

          {/* Add line CTA when empty */}
          {fields.length === 0 && (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-slate-400 mb-3">Sin productos</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => append({ product_id: '', quantity_received: 1 })}
              >
                Agregar primer producto
              </Button>
            </div>
          )}
        </Card>

        {/* ── Totals + submit ──────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <span>
              <span className="font-semibold text-slate-900 tabular-nums">{totalUnits.toLocaleString('es-AR', { maximumFractionDigits: 3 })}</span>
              {' '}unidades
            </span>
            {totalAmount > 0 && (
              <span>
                Total:{' '}
                <span className="font-bold text-slate-900 tabular-nums">{formatCurrency(totalAmount)}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button type="button" variant="secondary" size="md">Cancelar</Button>
            </Link>
            <SaveButton type="submit" size="md" loading={saving}>
              Registrar compra
            </SaveButton>
          </div>
        </div>

        {errors.items?.root && (
          <p className="text-sm text-danger-600">{errors.items.root.message}</p>
        )}
      </form>
    </div>
  )
}
