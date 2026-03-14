'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Phone, Mail, CreditCard, StickyNote, Building2, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import {
  createSupplierSchema,
  type CreateSupplierInput,
} from '@/lib/validations/suppliers'
import type { SupplierRow } from '@/lib/server/suppliers'

interface SupplierFormProps {
  defaultValues?: Partial<CreateSupplierInput>
  onSubmit: (data: CreateSupplierInput) => Promise<SupplierRow | void>
  submitLabel?: string
}

export function SupplierForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Guardar proveedor',
}: SupplierFormProps) {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateSupplierInput>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      name: '',
      contact_name: '',
      phone: '',
      email: '',
      tax_id: '',
      notes: '',
      ...defaultValues,
    },
  })

  async function handleFormSubmit(data: CreateSupplierInput) {
    setStatus('submitting')
    setErrorMsg(null)
    try {
      const result = await onSubmit(data)
      setStatus('success')
      if (result && 'id' in result) {
        setTimeout(() => router.push(`/suppliers`), 700)
      }
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Building2 className="h-4 w-4 text-brand-500" />
          Datos del proveedor
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Name */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Nombre del proveedor *
            </label>
            <input
              type="text"
              placeholder="Ej. Frigorífico El Gaucho S.A."
              {...register('name')}
              className={cn(
                'w-full rounded-xl border bg-white px-3 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-100',
                errors.name
                  ? 'border-red-300 bg-red-50'
                  : 'border-slate-200 focus:border-brand-500'
              )}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Contact */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <User className="h-3.5 w-3.5" />
              Nombre de contacto
            </label>
            <input
              type="text"
              placeholder="Ej. Juan Rodríguez"
              {...register('contact_name')}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Phone className="h-3.5 w-3.5" />
              Teléfono
            </label>
            <input
              type="tel"
              placeholder="+54 11 4555-0000"
              {...register('phone')}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Mail className="h-3.5 w-3.5" />
              Email
            </label>
            <input
              type="email"
              placeholder="proveedor@empresa.com"
              {...register('email')}
              className={cn(
                'w-full rounded-xl border bg-white px-3 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-100',
                errors.email
                  ? 'border-red-300 bg-red-50'
                  : 'border-slate-200 focus:border-brand-500'
              )}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Tax ID */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <CreditCard className="h-3.5 w-3.5" />
              CUIT / Tax ID
            </label>
            <input
              type="text"
              placeholder="Ej. 20-12345678-9"
              {...register('tax_id')}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <StickyNote className="h-3.5 w-3.5" />
              Notas internas
            </label>
            <textarea
              rows={3}
              placeholder="Condiciones de pago, días de entrega, observaciones…"
              {...register('notes')}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>
      </div>

      {/* Feedback */}
      {status === 'success' && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Proveedor guardado correctamente.
        </div>
      )}
      {status === 'error' && errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMsg}
        </div>
      )}

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
          {status === 'submitting' ? 'Guardando…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
