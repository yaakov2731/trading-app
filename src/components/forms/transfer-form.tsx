'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Plus, Trash2, Search, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { createTransferSchema, type CreateTransferInput } from '@/lib/validations/transfers'
import { formatQuantity } from '@/lib/utils/format'

interface Location {
  id: string
  name: string
  color: string | null
}

interface StockProduct {
  id: string
  sku: string
  name: string
  unit_symbol: string
  current_stock: number
}

interface TransferFormProps {
  locations: Location[]
  products: StockProduct[]
  onSubmit: (data: CreateTransferInput) => Promise<void>
  submitting?: boolean
  defaultFromLocationId?: string
}

export function TransferForm({
  locations,
  products,
  onSubmit,
  submitting = false,
  defaultFromLocationId,
}: TransferFormProps) {
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTransferInput>({
    resolver: zodResolver(createTransferSchema),
    defaultValues: {
      from_location_id: defaultFromLocationId ?? '',
      to_location_id: '',
      transfer_date: new Date().toISOString().slice(0, 10),
      items: [],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const fromLocationId = watch('from_location_id')
  const toLocationId = watch('to_location_id')

  const filteredProducts = products.filter(
    (p) =>
      !addedIds.has(p.id) &&
      (search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()))
  )

  function addProduct(product: StockProduct) {
    append({
      product_id: product.id,
      quantity_requested: 1,
      unit_cost: null,
      notes: '',
    })
    setAddedIds((prev) => new Set([...prev, product.id]))
    setSearch('')
    setShowDropdown(false)
  }

  function removeItem(index: number) {
    const id = fields[index].product_id
    remove(index)
    setAddedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const fromLocation = locations.find((l) => l.id === fromLocationId)
  const toLocation = locations.find((l) => l.id === toLocationId)
  const fromProducts = products.filter((p) => fromLocationId ? true : true) // all when no filter

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Locations */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Ruta del traslado</h2>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">Origen *</label>
            <select
              {...register('from_location_id')}
              className={cn(
                'w-full rounded-xl border px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-100',
                errors.from_location_id ? 'border-red-300' : 'border-slate-200 focus:border-brand-500'
              )}
            >
              <option value="">Seleccionar origen…</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            {errors.from_location_id && (
              <p className="mt-1 text-xs text-red-500">{errors.from_location_id.message}</p>
            )}
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ArrowRight className="h-5 w-5 text-slate-400" />
          </div>

          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">Destino *</label>
            <select
              {...register('to_location_id')}
              className={cn(
                'w-full rounded-xl border px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-100',
                errors.to_location_id ? 'border-red-300' : 'border-slate-200 focus:border-brand-500'
              )}
            >
              <option value="">Seleccionar destino…</option>
              {locations
                .filter((l) => l.id !== fromLocationId)
                .map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
            </select>
            {errors.to_location_id && (
              <p className="mt-1 text-xs text-red-500">{errors.to_location_id.message}</p>
            )}
          </div>
        </div>

        {fromLocation && toLocation && (
          <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-2 text-sm">
            <span className="font-medium" style={{ color: fromLocation.color ?? undefined }}>
              {fromLocation.name}
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400" />
            <span className="font-medium" style={{ color: toLocation.color ?? undefined }}>
              {toLocation.name}
            </span>
          </div>
        )}
      </div>

      {/* Date and notes */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Fecha *</label>
            <input
              type="date"
              {...register('transfer_date')}
              className={cn(
                'w-full rounded-xl border px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-100',
                errors.transfer_date ? 'border-red-300' : 'border-slate-200 focus:border-brand-500'
              )}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Notas</label>
            <input
              type="text"
              placeholder="Opcional…"
              {...register('notes')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>
      </div>

      {/* Product lines */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Productos a trasladar</h2>
          <span className="text-xs text-slate-400">{fields.length} ítem{fields.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Add product */}
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowDropdown(true) }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Buscar producto para agregar…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          {showDropdown && search && filteredProducts.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden max-h-56 overflow-y-auto">
              {filteredProducts.slice(0, 8).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addProduct(p)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{p.name}</p>
                    <p className="font-mono text-xs text-slate-400">{p.sku}</p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {formatQuantity(p.current_stock)} {p.unit_symbol}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Items list */}
        {fields.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
            <p className="text-sm text-slate-400">Agrega productos al traslado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_120px_120px_36px] gap-3 px-2 text-xs font-medium text-slate-500">
              <span>Producto</span>
              <span className="text-center">Qty a trasladar</span>
              <span className="text-center">Costo unit.</span>
              <span />
            </div>

            {fields.map((field, index) => {
              const product = products.find((p) => p.id === field.product_id)
              return (
                <div
                  key={field.id}
                  className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_120px_120px_36px] sm:items-center"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{product?.name ?? 'Producto'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs text-slate-400">{product?.sku}</span>
                      {product && (
                        <span className="text-xs text-slate-400">
                          stock: {formatQuantity(product.current_stock)} {product.unit_symbol}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="mb-0.5 block text-[10px] text-slate-500 sm:hidden">Cantidad</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        {...register(`items.${index}.quantity_requested` as const, { valueAsNumber: true })}
                        className={cn(
                          'w-full rounded-lg border px-3 py-2 text-sm font-semibold text-right focus:outline-none focus:ring-2 focus:ring-brand-100',
                          errors.items?.[index]?.quantity_requested
                            ? 'border-red-300 bg-red-50'
                            : 'border-slate-200 bg-white focus:border-brand-500'
                        )}
                      />
                      <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                        {product?.unit_symbol}
                      </span>
                    </div>
                    {errors.items?.[index]?.quantity_requested && (
                      <p className="mt-0.5 text-xs text-red-500">{errors.items[index]?.quantity_requested?.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-0.5 block text-[10px] text-slate-500 sm:hidden">Costo unit.</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Opcional"
                      {...register(`items.${index}.unit_cost` as const, { valueAsNumber: true, setValueAs: (v) => v === '' ? null : Number(v) })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-right focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {errors.items && typeof errors.items.message === 'string' && (
          <p className="mt-2 text-xs text-red-500">{errors.items.message}</p>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          variant="primary"
          disabled={submitting || fields.length === 0}
          className="min-w-[160px]"
        >
          {submitting ? 'Creando traslado…' : 'Crear traslado'}
        </Button>
      </div>
    </form>
  )
}
