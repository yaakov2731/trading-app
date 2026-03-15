'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Search, CheckCircle2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { formatQuantity } from '@/lib/utils/format'
import { discrepancySeverity } from '@/lib/validations/counts'

interface StockProduct {
  id: string
  sku: string
  name: string
  unit_symbol: string
  current_stock: number
}

interface PhysicalCountFormProps {
  products: StockProduct[]
  onSave: (items: CountFormItem[]) => Promise<void>
  saving?: boolean
  onConfirm?: (items: CountFormItem[]) => Promise<void>
  confirming?: boolean
  mode?: 'count' | 'review'
}

const countItemSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string(),
  sku: z.string(),
  unit_symbol: z.string(),
  system_quantity: z.number(),
  counted_quantity: z.coerce.number().min(0, 'No puede ser negativo'),
  notes: z.string().optional(),
})

type CountFormItem = z.infer<typeof countItemSchema>

const formSchema = z.object({
  items: z.array(countItemSchema).min(1, 'Agrega al menos un producto'),
})

type FormValues = z.infer<typeof formSchema>

export function PhysicalCountForm({
  products,
  onSave,
  saving = false,
  onConfirm,
  confirming = false,
  mode = 'count',
}: PhysicalCountFormProps) {
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  const { control, register, watch, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { items: [] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items')

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
      product_name: product.name,
      sku: product.sku,
      unit_symbol: product.unit_symbol,
      system_quantity: product.current_stock,
      counted_quantity: product.current_stock, // default to system qty
      notes: '',
    })
    setAddedIds((prev) => new Set([...prev, product.id]))
    setSearch('')
    setShowDropdown(false)
  }

  function removeProduct(index: number) {
    const id = fields[index].product_id
    remove(index)
    setAddedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const addAll = useCallback(() => {
    for (const p of products) {
      if (!addedIds.has(p.id)) {
        append({
          product_id: p.id,
          product_name: p.name,
          sku: p.sku,
          unit_symbol: p.unit_symbol,
          system_quantity: p.current_stock,
          counted_quantity: p.current_stock,
          notes: '',
        })
      }
    }
    setAddedIds(new Set(products.map((p) => p.id)))
  }, [products, addedIds, append])

  const discrepancies = items.filter(
    (item) => item.counted_quantity != null && item.counted_quantity !== item.system_quantity
  )

  return (
    <div className="space-y-4">
      {/* Product search & add */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Buscar y agregar productos al conteo…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <button
            type="button"
            onClick={addAll}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap shadow-sm"
          >
            + Todos
          </button>
        </div>

        {showDropdown && search && filteredProducts.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden max-h-60 overflow-y-auto">
            {filteredProducts.slice(0, 10).map((p) => (
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

      {/* Items */}
      {fields.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
          <p className="text-sm text-slate-400">Agrega productos para comenzar el conteo</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>{fields.length} productos en conteo</span>
            {discrepancies.length > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                {discrepancies.length} diferencia{discrepancies.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {fields.map((field, index) => {
            const item = items[index]
            const discrepancy = (item?.counted_quantity ?? 0) - item?.system_quantity
            const severity = item ? discrepancySeverity(discrepancy, item.system_quantity) : 'none'

            return (
              <div
                key={field.id}
                className={cn(
                  'rounded-xl border p-3 transition-all',
                  severity === 'critical' ? 'border-red-200 bg-red-50' :
                  severity === 'moderate' ? 'border-orange-200 bg-orange-50' :
                  severity === 'minor' ? 'border-amber-100 bg-amber-50' :
                  'border-slate-200 bg-white'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-slate-800">{field.product_name}</p>
                      <span className="shrink-0 rounded font-mono text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5">{field.sku}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Sistema: <span className="font-medium">{formatQuantity(field.system_quantity)} {field.unit_symbol}</span>
                      {discrepancy !== 0 && (
                        <span className={cn('ml-2 font-semibold', discrepancy > 0 ? 'text-emerald-600' : 'text-red-600')}>
                          ({discrepancy > 0 ? '+' : ''}{formatQuantity(discrepancy)})
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        {...register(`items.${index}.counted_quantity` as const, { valueAsNumber: true })}
                        className={cn(
                          'w-24 rounded-lg border px-3 py-2 text-right text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-100',
                          errors.items?.[index]?.counted_quantity
                            ? 'border-red-300 bg-red-50'
                            : 'border-slate-200 bg-white focus:border-brand-500'
                        )}
                      />
                      <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                        {field.unit_symbol}
                      </span>
                    </div>

                    {discrepancy === 0 && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    )}

                    <button
                      type="button"
                      onClick={() => removeProduct(index)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Actions */}
      {fields.length > 0 && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleSubmit((data) => onSave(data.items))}
            disabled={saving}
            className="flex-1"
          >
            {saving ? 'Guardando…' : 'Guardar conteo'}
          </Button>

          {onConfirm && mode === 'review' && (
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit((data) => onConfirm(data.items))}
              disabled={confirming}
              className="flex-1"
            >
              {confirming ? 'Confirmando…' : `Confirmar y aplicar (${discrepancies.length} ajuste${discrepancies.length !== 1 ? 's' : ''})`}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
