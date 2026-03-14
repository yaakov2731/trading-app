/**
 * app/(app)/migration/import/page.tsx
 * Legacy data import page — file upload, column mapping, import submission.
 */

import { Suspense } from 'react'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import LegacyImportForm from '@/components/forms/legacy-import-form'

async function getLocations() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('locations')
    .select('id, name, slug')
    .order('name')
  return data ?? []
}

export default async function MigrationImportPage() {
  const locations = await getLocations()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/migration"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Importar datos legados</h1>
            <p className="text-sm text-slate-400">Carga un archivo Excel/CSV exportado del sistema anterior.</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
          <h3 className="text-sm font-semibold text-blue-300 mb-2">Formato esperado</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-xs text-slate-400">
            <div>
              <p className="font-medium text-slate-300 mb-1">Snapshot de stock (columnas):</p>
              <ul className="space-y-0.5">
                <li><code className="text-brand-400">FECHA</code> — fecha del inventario (DD/MM/AAAA)</li>
                <li><code className="text-brand-400">HORA</code> — hora opcional (HH:MM)</li>
                <li><code className="text-brand-400">SKU</code> — código del producto</li>
                <li><code className="text-brand-400">PRODUCTO</code> — nombre del producto</li>
                <li><code className="text-brand-400">STOCK</code> — cantidad en existencia</li>
                <li><code className="text-brand-400">UNIDAD</code> — unidad de medida</li>
                <li><code className="text-brand-400">UBICACION</code> — local/depósito</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-slate-300 mb-1">Catálogo de productos (columnas):</p>
              <ul className="space-y-0.5">
                <li><code className="text-brand-400">SKU</code> — código único</li>
                <li><code className="text-brand-400">PRODUCTO</code> — nombre</li>
                <li><code className="text-brand-400">CATEGORIA</code> — categoría</li>
                <li><code className="text-brand-400">UNIDAD</code> — unidad base</li>
                <li><code className="text-brand-400">MINIMO</code> — stock mínimo</li>
                <li><code className="text-brand-400">ACTIVO</code> — 1/0 o SI/NO</li>
              </ul>
            </div>
          </div>
          <p className="mt-3 text-xs text-amber-400">
            ⚠ No se fabrican movimientos históricos — solo se extrae el saldo más reciente por producto/local.
          </p>
        </div>

        {/* Form */}
        <Suspense fallback={
          <div className="h-64 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
        }>
          <LegacyImportForm locations={locations} />
        </Suspense>
      </div>
    </div>
  )
}
