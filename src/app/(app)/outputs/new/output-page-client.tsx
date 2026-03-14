'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { OutputForm } from '@/components/forms/output-form'
import type { Location, Product } from '@/lib/types'

interface Props {
  locations: Location[]
  products:  Product[]
}

export function OutputPageClient({ locations, products }: Props) {
  const router      = useRouter()
  const searchParams = useSearchParams()

  const defaultType  = (searchParams.get('type') ?? 'consumption_out') as any
  const defaultLoc   = searchParams.get('location') ?? undefined

  function handleSuccess() {
    router.push('/stock')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Registrar Salida</h1>
          <p className="text-sm text-slate-400">
            Consumo, merma o ajuste de inventario — podés seleccionar múltiples productos
          </p>
        </div>
      </div>

      <OutputForm
        locations={locations}
        products={products}
        defaultLocationId={defaultLoc}
        defaultType={defaultType}
        onSuccess={handleSuccess}
        onCancel={() => router.push('/dashboard')}
      />
    </div>
  )
}
