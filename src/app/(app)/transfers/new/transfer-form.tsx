'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Trash2, ArrowLeftRight, ArrowLeft, ArrowRight } from 'lucide-react'
import { z } from 'zod'
import { Button, SaveButton } from '@/components/ui/button'
import { Input, FormField, NumberInput } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createTransfer } from '@/server/actions/transfers'
import { cn } from '@/lib/utils/cn'
import type { Location, Product } from '@/lib/types'
import Link from 'next/link'

const lineItemSchema = z.object({
  product_id: z.string().min(1, 'Seleccioná un producto'),
  quantity:   z.number().positive('La cantidad debe ser mayor a 0'),
  unit_cost:  z.number().min(0).optional(),
  notes:      z.string().optional(),
})

const formSchema = z.object({
  from_location_id: z.string().min(1, 'Seleccioná el local de origen'),
  to_location_id:   z.string().min(1, 'Seleccioná el local de destino'),
  transfer_date:    z.string().min(1, 'La fecha es requerida'),
  notes:            z.string().optional(),
  items:            z.array(lineItemSchema).min(1, 'Agregá al menos un producto'),
}).refine(d => d.from_location_id !== d.to_location_id, {
  message: 'El origen y destino no pueden ser el mismo local',
  path: ['to_location_id'],
})

type FormValues = z.infer<typeof formSchema>

interface Props {
  locations: Location[]
  products:  Product[]
}

export function TransferForm({ locations, products }: Props) {
  const router  = useRouter()
  const [saving, setSaving] = React.useState(false)

  const today = new Date().toISOString().slice(0, 10)

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transfer_date: today,
      items: [{ product_id: '', quantity: 1 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems     = watch('items')
  const fromLocationId   = watch('from_location_id')
  const toLocationId     = watch('to_location_id')

  const fromLocation = locations.find(l => l.id === fromLocationId)
  const toLocation   = locations.find(l => l.id === toLocationId)

  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      const result = await createTransfer(values)
      if (!result.success) { toast.error(result.error); return }
      toast.success(`Transferencia registrada — ${fields.length} producto${fields.length !== 1 ? 's' : ''}`)
      router.push('/transfers')
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
          <h1 className="text-xl font-bold text-slate-900">Nueva Transferencia</h1>
          <p className="text-sm text-slate-400">Mover mercadería entre locales</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* ── Route card ───────────────────────────────────────────────── */}
        <Card padding="md">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <ArrowLeftRight size={15} className="text-purple-500" />
            Ruta de transferencia
          </h2>

          {/* Visual route display */}
          {(fromLocation || toLocation) && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {fromLocation && (
                  <>
                    <span
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: fromLocation.color }}
                    />
                    <span className="text-sm font-semibold text-slate-900 truncate">{fromLocation.name}</span>
                  </>
                )}
                {!fromLocation && <span className="text-sm text-slate-400">Origen...</span>}
              </div>
              <ArrowRight size={16} className="text-slate-400 flex-shrink-0" />
              <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                {toLocation && (
                  <>
                    <span className="text-sm font-semibold text-slate-900 truncate">{toLocation.name}</span>
                    <span
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: toLocation.color }}
                    />
                  </>
                )}
                {!toLocation && <span className="text-sm text-slate-400">Destino...</span>}
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Local origen" required error={errors.from_location_id?.message}>
              <Controller
                name="from_location_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger error={!!errors.from_location_id}>
                      <SelectValue placeholder="Desde..." />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id} disabled={loc.id === toLocationId}>
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

            <FormField label="Local destino" required error={errors.to_location_id?.message}>
              <Controller
                name="to_location_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger error={!!errors.to_location_id}>
                      <SelectValue placeholder="Hacia..." />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id} disabled={loc.id === fromLocationId}>
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

            <FormField label="Fecha" required error={errors.transfer_date?.message}>
              <Input type="date" {...register('transfer_date')} />
            </FormField>

            <FormField label="Notas">
              <Input {...register('notes')} placeholder="Motivo de la transferencia..." />
            </FormField>
          </div>
        </Card>

        {/* ── Line items ───────────────────────────────────────────────── */}
        <Card padding="none">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">
              Productos a transferir
              <span className="ml-2 text-xs font-normal text-slate-400">({fields.length})</span>
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => append({ product_id: '', quantity: 1 })}
            >
              Agregar
            </Button>
          </div>

          <div className="hidden sm:grid grid-cols-[2fr_1fr_auto] gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span>Producto</span>
            <span>Cantidad</span>
            <span />
          </div>

          <div className="divide-y divide-slate-50">
            {fields.map((field, index) => {
              const product = getProduct(watchedItems?.[index]?.product_id ?? '')

              return (
                <div key={field.id} className="px-5 py-4">
                  <div className="grid sm:grid-cols-[2fr_1fr_auto] gap-3 items-start">
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
                      {product && (
                        <p className="text-xs text-slate-400 mt-1">{product.category?.name} · {product.unit?.symbol}</p>
                      )}
                    </div>

                    <Controller
                      name={`items.${index}.quantity`}
                      control={control}
                      render={({ field: f }) => (
                        <NumberInput
                          value={f.value ?? ''}
                          onChange={v => f.onChange(v === '' ? 0 : Number(v))}
                          min={0.001}
                          step={0.001}
                          placeholder="0"
                          className="h-9"
                          error={!!errors.items?.[index]?.quantity}
                        />
                      )}
                    />

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

          {fields.length === 0 && (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-slate-400 mb-3">Sin productos</p>
              <Button type="button" variant="secondary" size="sm" leftIcon={<Plus size={14} />}
                onClick={() => append({ product_id: '', quantity: 1 })}>
                Agregar producto
              </Button>
            </div>
          )}
        </Card>

        {/* ── Submit ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/dashboard">
            <Button type="button" variant="secondary">Cancelar</Button>
          </Link>
          <SaveButton type="submit" loading={saving}>
            Confirmar transferencia
          </SaveButton>
        </div>
      </form>
    </div>
  )
}
