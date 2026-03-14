'use client'

import { useState } from 'react'
import {
  useFieldArray,
  type Control,
  type UseFormRegister,
  type FieldErrors,
} from 'react-hook-form'
import { Plus, Trash2, Search, Package } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatCurrency, formatQuantity } from '@/lib/utils/format'
import type { CreatePurchaseInput } from '@/lib/validations/purchases'
import { calcLineTotal } from '@/lib/validations/purchases'

interface Product {
  id: string
  sku: string
  name: string
  unit_symbol: string
  cost_price: number | null
}

interface PurchaseItemsEditorProps {
  control: Control<CreatePurchaseInput>
  register: UseFormRegister<CreatePurchaseInput>
  errors: FieldErrors<CreatePurchaseInput>
  products: Product[]
  watch: (name: string) => unknown
}

export function PurchaseItemsEditor({
  control,
  register,
  errors,
  products,
  watch,
}: PurchaseItemsEditorProps) {
  const [search, setSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const items = watch('items') as CreatePurchaseInput['items']

  const filtered = products.filter(
    (p) =>
      !addedIds.has(p.id) &&
      (search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()))
  )

  function addProduct(product: Product) {
    append({
      product_id: product.id,
      quantity_ordered: 1,
      quantity_received: null,
      unit_cost: product.cost_price ?? null,
      notes: '',
    })
    setAddedIds((prev) => new Set([...prev, product.id]))
    setSearch('')
    setDropdownOpen(false)
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

  // Running total
  const total = (items ?? []).reduce((sum, item) => {
    if (!item.unit_cost) return sum
    return sum + item.quantity_ordered * item.unit_cost
  }, 0)

  return (
    <div className="space-y-3">
      {/* Product search */}
      <div className="relative">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setDropdownOpen(true)
            }}
            onFocus={() => setDropdownOpen(true)}
            placeholder="Buscar y agregar producto…"
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
          />
        </div>

        {dropdownOpen && search && filtered.length > 0 && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
              {filtered.slice(0, 10).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addProduct(p)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-brand-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                    <p className="font-mono text-xs text-slate-400">{p.sku}</p>
                  </div>
                  <div className="ml-4 shrink-0 text-right">
                    {p.cost_price != null && (
                      <p className="text-xs font-semibold text-slate-600">
                        {formatCurrency(p.cost_price)}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400">{p.unit_symbol}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {dropdownOpen && search && filtered.length === 0 && (
          <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white p-4 shadow-xl text-center">
            <p className="text-sm text-slate-400">Sin resultados para "{search}"</p>
          </div>
        )}
      </div>

      {/* Items list */}
      {fields.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
          <Package className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">
            Busca y agrega productos para registrar la compra
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          {/* Header */}
          <div className="hidden grid-cols-[1fr_110px_120px_36px] gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 sm:grid">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Producto</p>
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">Cantidad</p>
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">Costo Unit.</p>
            <span />
          </div>

          <div className="divide-y divide-slate-100">
            {fields.map((field, index) => {
              const product = products.find((p) => p.id === field.product_id)
              const itemQty = (items?.[index]?.quantity_ordered as number) ?? 0
              const itemCost = (items?.[index]?.unit_cost as number | null) ?? null
              const lineTotal = calcLineTotal(itemQty, itemCost)

              return (
                <div
                  key={field.id}
                  className="grid grid-cols-1 items-center gap-2 bg-white px-3 py-3 transition-colors hover:bg-slate-50 sm:grid-cols-[1fr_110px_120px_36px]"
                >
                  {/* Product info */}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {product?.name ?? 'Producto'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs text-slate-400">{product?.sku}</span>
                      {lineTotal != null && (
                        <span className="text-xs font-semibold text-slate-600">
                          = {formatCurrency(lineTotal)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="mb-0.5 block text-[10px] text-slate-400 sm:hidden">Cantidad</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        {...register(`items.${index}.quantity_ordered` as const, {
                          valueAsNumber: true,
                        })}
                        className={cn(
                          'w-full rounded-lg border py-2 pl-3 pr-8 text-sm font-semibold text-right focus:outline-none focus:ring-2 focus:ring-brand-100',
                          errors.items?.[index]?.quantity_ordered
                            ? 'border-red-300 bg-red-50'
                            : 'border-slate-200 bg-white focus:border-brand-500'
                        )}
                      />
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                        {product?.unit_symbol}
                      </span>
                    </div>
                    {errors.items?.[index]?.quantity_ordered && (
                      <p className="mt-0.5 text-[10px] text-red-500">
                        {errors.items[index]?.quantity_ordered?.message}
                      </p>
                    )}
                  </div>

                  {/* Unit cost */}
                  <div>
                    <label className="mb-0.5 block text-[10px] text-slate-400 sm:hidden">Costo unit.</label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="—"
                        {...register(`items.${index}.unit_cost` as const, {
                          setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
                        })}
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-5 pr-3 text-sm text-right focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                      />
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-red-50 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Total row */}
          {total > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total estimado ({fields.length} ítem{fields.length !== 1 ? 's' : ''})
              </p>
              <p className="text-base font-bold text-slate-900">{formatCurrency(total)}</p>
            </div>
          )}
        </div>
      )}

      {errors.items && typeof errors.items.message === 'string' && (
        <p className="text-xs text-red-500">{errors.items.message}</p>
      )}
    </div>
  )
}
