'use client'

import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ShoppingCart, Minus, ArrowLeftRight, Trash2, Zap,
  CheckCircle2, AlertTriangle, ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { FormField, NumberInput, Textarea } from '@/components/ui/input'
import { ProductSearch } from './product-search'
import { quickMovementSchema, type QuickMovementInput } from '@/lib/schemas'
import type { Product, Location, MovementType } from '@/lib/types'
import { MOVEMENT_TYPE_CONFIG } from '@/lib/types'
import { formatQuantity } from '@/lib/utils/format'

// =============================================================================
// Quick Movement Form — the fastest path to register stock changes
// =============================================================================

const QUICK_MOVEMENT_TYPES: {
  type:    MovementType
  label:   string
  icon:    React.ReactNode
  color:   string
  bgColor: string
}[] = [
  { type: 'consumption_out', label: 'Consumo',  icon: <Minus size={20} />,          color: 'text-amber-700',  bgColor: 'bg-amber-50 border-amber-200 hover:bg-amber-100' },
  { type: 'purchase_in',     label: 'Compra',   icon: <ShoppingCart size={20} />,   color: 'text-success-700',bgColor: 'bg-success-50 border-success-200 hover:bg-success-100' },
  { type: 'waste_out',       label: 'Merma',    icon: <Trash2 size={20} />,         color: 'text-danger-700', bgColor: 'bg-danger-50 border-danger-200 hover:bg-danger-100' },
  { type: 'transfer_out',    label: 'Transfer', icon: <ArrowLeftRight size={20} />, color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200 hover:bg-purple-100' },
  { type: 'manual_adjustment',label: 'Ajuste',  icon: <Zap size={20} />,            color: 'text-slate-700',  bgColor: 'bg-slate-50 border-slate-200 hover:bg-slate-100' },
]

interface QuickMovementFormProps {
  products:         Product[]
  location:         Location
  currentStock?:    number
  onSubmit:         (data: QuickMovementInput) => Promise<void>
  onSuccess?:       () => void
  defaultProductId?: string
  className?:       string
}

export function QuickMovementForm({
  products,
  location,
  currentStock,
  onSubmit,
  onSuccess,
  defaultProductId,
  className,
}: QuickMovementFormProps) {
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null)
  const [movementType, setMovementType] = React.useState<MovementType>('consumption_out')
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [recentIds, setRecentIds] = React.useState<string[]>([])

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<QuickMovementInput>({
    resolver: zodResolver(quickMovementSchema),
    defaultValues: {
      product_id:    defaultProductId ?? '',
      location_id:   location.id,
      movement_type: 'consumption_out',
      quantity:      undefined,
      notes:         '',
    },
  })

  const quantity = watch('quantity')
  const isOutflow = ['consumption_out', 'transfer_out', 'waste_out'].includes(movementType)
  const signedQty = isOutflow ? -(quantity || 0) : (quantity || 0)
  const newBalance = (currentStock ?? 0) + signedQty

  async function handleFormSubmit(data: QuickMovementInput) {
    setStatus('loading')
    try {
      await onSubmit({
        ...data,
        product_id:    selectedProduct!.id,
        location_id:   location.id,
        movement_type: movementType,
        quantity:      isOutflow ? -Math.abs(data.quantity) : Math.abs(data.quantity),
        idempotency_key: `${Date.now()}-${location.id}-${selectedProduct!.id}`,
      })
      setStatus('success')
      setRecentIds(prev => [selectedProduct!.id, ...prev.filter(id => id !== selectedProduct!.id)].slice(0, 5))

      // Auto-reset after success
      setTimeout(() => {
        reset()
        setSelectedProduct(null)
        setStatus('idle')
        onSuccess?.()
      }, 1400)
    } catch (err) {
      console.error(err)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <div className={cn('space-y-5', className)}>
      {/* ── Movement type selector ───────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2.5">
          Tipo de Movimiento
        </p>
        <div className="grid grid-cols-5 gap-2">
          {QUICK_MOVEMENT_TYPES.map(mt => (
            <button
              key={mt.type}
              type="button"
              onClick={() => setMovementType(mt.type)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl p-3 border',
                'text-xs font-medium transition-all duration-150',
                'focus:outline-none focus:ring-2 focus:ring-brand-500/30',
                mt.bgColor,
                movementType === mt.type
                  ? `${mt.color} ring-2 ring-offset-1 ring-current`
                  : 'opacity-60 hover:opacity-100'
              )}
            >
              <span className={mt.color}>{mt.icon}</span>
              <span className={mt.color}>{mt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Form ─────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Product search */}
        <FormField
          label="Producto"
          required
          error={errors.product_id?.message}
          htmlFor="product-search"
        >
          <ProductSearch
            products={products}
            value={selectedProduct}
            onSelect={p => {
              setSelectedProduct(p)
            }}
            recentProductIds={recentIds}
          />
        </FormField>

        {/* Quantity + stock preview */}
        <div className="flex gap-3 items-start">
          <FormField
            label="Cantidad"
            required
            error={errors.quantity?.message}
            className="flex-1"
          >
            <Controller
              name="quantity"
              control={control}
              render={({ field }) => (
                <NumberInput
                  {...field}
                  value={field.value ?? ''}
                  onChange={v => field.onChange(v)}
                  min={0.001}
                  step={0.001}
                  placeholder="0"
                  error={!!errors.quantity}
                  className="text-lg font-semibold tabular-nums"
                />
              )}
            />
          </FormField>

          {/* Stock preview */}
          {selectedProduct && currentStock !== undefined && quantity > 0 && (
            <div className={cn(
              'flex flex-col items-center rounded-xl px-4 py-3 mt-6 border',
              newBalance < 0 ? 'bg-danger-50 border-danger-200' : 'bg-slate-50 border-slate-200'
            )}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Nuevo stock
              </p>
              <p className={cn(
                'text-xl font-bold tabular-nums mt-0.5',
                newBalance < 0 ? 'text-danger-600' : 'text-slate-900'
              )}>
                {formatQuantity(newBalance)}
              </p>
              {newBalance < 0 && (
                <div className="flex items-center gap-1 mt-1 text-danger-600">
                  <AlertTriangle size={12} />
                  <span className="text-[10px] font-medium">Stock negativo</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Unit cost (for purchases) */}
        {movementType === 'purchase_in' && (
          <FormField label="Costo unitario" hint="Opcional — para calcular valor de stock">
            <Controller
              name="unit_cost"
              control={control}
              render={({ field }) => (
                <NumberInput
                  {...field}
                  value={field.value ?? ''}
                  onChange={v => field.onChange(v)}
                  min={0}
                  step={0.01}
                  placeholder="$0.00"
                />
              )}
            />
          </FormField>
        )}

        {/* Notes */}
        <FormField label="Observaciones" hint="Opcional">
          <Textarea
            {...register('notes')}
            placeholder="Motivo, referencia, etc."
            rows={2}
          />
        </FormField>

        {/* Submit */}
        <Button
          type="submit"
          variant={status === 'success' ? 'success' : status === 'error' ? 'danger' : 'primary'}
          size="lg"
          fullWidth
          loading={status === 'loading'}
          disabled={!selectedProduct || status === 'loading'}
          state={status === 'success' ? 'success' : 'idle'}
        >
          {status === 'success' ? (
            <>
              <CheckCircle2 size={18} />
              Movimiento registrado
            </>
          ) : status === 'error' ? (
            'Error — reintentar'
          ) : (
            `Registrar ${QUICK_MOVEMENT_TYPES.find(m => m.type === movementType)?.label}`
          )}
        </Button>
      </form>
    </div>
  )
}
