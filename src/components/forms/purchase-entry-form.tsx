'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MapPin, Truck, Calendar, FileText, StickyNote,
  CheckCircle2, AlertCircle, ShoppingCart,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { PurchaseItemsEditor } from '@/components/purchases/purchase-items-editor'
import {
  createPurchaseSchema,
  type CreatePurchaseInput,
} from '@/lib/validations/purchases'

interface Location  { id: string; name: string; color: string | null }
interface Supplier  { id: string; name: string; contact_name: string | null }
interface Product   {
  id: string; sku: string; name: string;
  unit_symbol: string; cost_price: number | null
}

interface PurchaseEntryFormProps {
  locations: Location[]
  suppliers: Supplier[]
  products: Product[]
  onSubmit: (data: CreatePurchaseInput) => Promise<{ id: string } | void>
  defaultLocationId?: string
}

export function PurchaseEntryForm({
  locations,
  suppliers,
  products,
  onSubmit,
  defaultLocationId,
}: PurchaseEntryFormProps) {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreatePurchaseInput>({
    resolver: zodResolver(createPurchaseSchema),
    defaultValues: {
      location_id: defaultLocationId ?? '',
      supplier_id: null,
      entry_date: new Date().toISOString().slice(0, 10),
      invoice_number: '',
      notes: '',
      items: [],
    },
  })

  async function handleFormSubmit(data: CreatePurchaseInput) {
    setStatus('submitting')
    setErrorMsg(null)
    try {
      const result = await onSubmit(data)
      setStatus('success')
      if (result && 'id' in result) {
        setTimeout(() => router.push(`/purchases/${result.id}`), 600)
      }
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar la compra')
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* ── Section: Header ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <ShoppingCart className="h-4 w-4 text-brand-500" />
          Información de la compra
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Location */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <MapPin className="h-3.5 w-3.5" />
              Ubicación *
            </label>
            <select
              {...register('location_id')}
              className={cn(
                'w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-100',
                errors.location_id
                  ? 'border-red-300 bg-red-50'
                  : 'border-slate-200 focus:border-brand-500'
              )}
            >
              <option value="">Seleccionar ubicación…</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            {errors.location_id && (
              <p className="mt-1 text-xs text-red-500">{errors.location_id.message}</p>
            )}
          </div>

          {/* Supplier */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Truck className="h-3.5 w-3.5" />
              Proveedor
            </label>
            <select
              {...register('supplier_id')}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Sin proveedor especificado</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.contact_name ? ` — ${s.contact_name}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Entry date */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Calendar className="h-3.5 w-3.5" />
              Fecha *
            </label>
            <input
              type="date"
              {...register('entry_date')}
              className={cn(
                'w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100',
                errors.entry_date
                  ? 'border-red-300 bg-red-50'
                  : 'border-slate-200 focus:border-brand-500'
              )}
            />
            {errors.entry_date && (
              <p className="mt-1 text-xs text-red-500">{errors.entry_date.message}</p>
            )}
          </div>

          {/* Invoice number */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <FileText className="h-3.5 w-3.5" />
              N° Remito / Factura
            </label>
            <input
              type="text"
              placeholder="Opcional — ej. 0001-00012345"
              {...register('invoice_number')}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Notes — full width */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <StickyNote className="h-3.5 w-3.5" />
              Notas
            </label>
            <textarea
              rows={2}
              placeholder="Observaciones opcionales…"
              {...register('notes')}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>
      </div>

      {/* ── Section: Items ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Productos de la compra *</h2>
        <PurchaseItemsEditor
          control={control}
          register={register}
          errors={errors}
          products={products}
          watch={watch as (name: string) => unknown}
        />
      </div>

      {/* ── Feedback ─────────────────────────────────────────────────────────── */}
      {status === 'success' && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Compra guardada. Redirigiendo…
        </div>
      )}

      {status === 'error' && errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* ── Actions ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pb-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={status === 'submitting'}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={status === 'submitting' || status === 'success'}
          className="min-w-[160px]"
        >
          {status === 'submitting' ? 'Guardando…' : 'Guardar compra'}
        </Button>
      </div>
    </form>
  )
}
