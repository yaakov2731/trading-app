/**
 * components/forms/legacy-import-form.tsx
 * Legacy data import form — paste JSON or upload CSV/Excel parsed rows.
 */

'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import ImportSummaryCard from '@/components/migration/import-summary-card'
import type { ImportSummary } from '@/lib/server/migration-import'

const formSchema = z.object({
  import_type: z.enum(['snapshot', 'catalog', 'mixed']),
  source_type: z.enum(['excel', 'sheets', 'csv', 'json', 'manual']),
  filename: z.string().min(1).max(200),
  source_sheet: z.string().max(100).optional(),
  location_id: z.string().uuid().optional(),
  rows_json: z.string().min(2, 'Ingresa datos en formato JSON'),
  notes: z.string().max(500).optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Location {
  id: string
  name: string
  slug: string
}

interface LegacyImportFormProps {
  locations: Location[]
}

const SAMPLE_SNAPSHOT = JSON.stringify([
  { FECHA: '15/01/2025', HORA: '08:00', SKU: 'UMO-001', PRODUCTO: 'Bife de chorizo', STOCK: 12.5, UNIDAD: 'kg', UBICACION: 'Umo Grill', RESPONSABLE: 'Juan' },
  { FECHA: '15/01/2025', SKU: 'UMO-002', PRODUCTO: 'Pollo entero', STOCK: 8, UNIDAD: 'u', UBICACION: 'Umo Grill' },
], null, 2)

const SAMPLE_CATALOG = JSON.stringify([
  { SKU: 'UMO-001', PRODUCTO: 'Bife de chorizo', CATEGORIA: 'Carnes', UNIDAD: 'kg', MINIMO: 5, ACTIVO: 1 },
  { SKU: 'GEL-001', PRODUCTO: 'Base helado vainilla', CATEGORIA: 'Helados', UNIDAD: 'kg', MINIMO: 2, ACTIVO: 1 },
], null, 2)

export default function LegacyImportForm({ locations }: LegacyImportFormProps) {
  const [isPending, startTransition] = useTransition()
  const [submitResult, setSubmitResult] = useState<{
    run_id: string
    filename: string
    summary: ImportSummary
    import_type: string
  } | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [jsonError, setJsonError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      import_type: 'snapshot',
      source_type: 'json',
      filename: '',
      rows_json: '',
    },
  })

  const importType = watch('import_type')

  const loadSample = () => {
    const sample = importType === 'catalog' ? SAMPLE_CATALOG : SAMPLE_SNAPSHOT
    setValue('rows_json', sample)
    setValue('filename', importType === 'catalog' ? 'catalogo-ejemplo.json' : 'snapshot-ejemplo.json')
    setJsonError(null)
  }

  const onSubmit = (values: FormValues) => {
    setServerError(null)
    setJsonError(null)

    let rows: unknown[]
    try {
      rows = JSON.parse(values.rows_json)
      if (!Array.isArray(rows)) throw new Error('Debe ser un array JSON')
    } catch (e) {
      setJsonError('JSON inválido: ' + (e as Error).message)
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/migration/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            import_type: values.import_type,
            source_type: values.source_type,
            filename: values.filename,
            source_sheet: values.source_sheet || undefined,
            location_id: values.location_id || undefined,
            rows,
            notes: values.notes || undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setServerError(data.error ?? 'Error al importar')
          return
        }
        setSubmitResult({
          run_id: data.run_id,
          filename: values.filename,
          summary: data.summary,
          import_type: values.import_type,
        })
      } catch {
        setServerError('Error de conexión')
      }
    })
  }

  if (submitResult) {
    return (
      <ImportSummaryCard
        runId={submitResult.run_id}
        filename={submitResult.filename}
        summary={submitResult.summary}
        importType={submitResult.import_type}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <h2 className="font-semibold text-white text-lg">Datos de importación</h2>

      {/* Type + Source row */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Tipo de importación <span className="text-red-400">*</span>
          </label>
          <select
            {...register('import_type')}
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200
              focus:outline-none focus:border-brand-500 text-sm"
          >
            <option value="snapshot">Snapshot de stock</option>
            <option value="catalog">Catálogo de productos</option>
            <option value="mixed">Mixto (auto-detectar)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Origen</label>
          <select
            {...register('source_type')}
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200
              focus:outline-none focus:border-brand-500 text-sm"
          >
            <option value="excel">Excel (.xlsx)</option>
            <option value="csv">CSV</option>
            <option value="sheets">Google Sheets</option>
            <option value="json">JSON</option>
            <option value="manual">Manual</option>
          </select>
        </div>
      </div>

      {/* Filename */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Nombre del archivo <span className="text-red-400">*</span>
        </label>
        <input
          {...register('filename')}
          type="text"
          placeholder="inventario-enero-2025.xlsx"
          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200
            placeholder:text-slate-500 focus:outline-none focus:border-brand-500 text-sm"
        />
        {errors.filename && <p className="mt-1 text-xs text-red-400">{errors.filename.message}</p>}
      </div>

      {/* Location + Sheet row */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Ubicación (si aplica)
          </label>
          <select
            {...register('location_id')}
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200
              focus:outline-none focus:border-brand-500 text-sm"
          >
            <option value="">Sin ubicación específica</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Hoja / Sheet</label>
          <input
            {...register('source_sheet')}
            type="text"
            placeholder="Hoja1"
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200
              placeholder:text-slate-500 focus:outline-none focus:border-brand-500 text-sm"
          />
        </div>
      </div>

      {/* JSON data */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-slate-300">
            Datos JSON <span className="text-red-400">*</span>
          </label>
          <button
            type="button"
            onClick={loadSample}
            className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors"
          >
            Cargar ejemplo
          </button>
        </div>
        <textarea
          {...register('rows_json')}
          rows={10}
          placeholder={`[\n  { "SKU": "...", "PRODUCTO": "...", "STOCK": 10, ... }\n]`}
          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200
            placeholder:text-slate-500 focus:outline-none focus:border-brand-500 text-sm font-mono resize-y"
        />
        {errors.rows_json && <p className="mt-1 text-xs text-red-400">{errors.rows_json.message}</p>}
        {jsonError && <p className="mt-1 text-xs text-red-400">{jsonError}</p>}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Notas (opcional)</label>
        <input
          {...register('notes')}
          type="text"
          placeholder="Inventario de cierre — 15 enero 2025"
          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200
            placeholder:text-slate-500 focus:outline-none focus:border-brand-500 text-sm"
        />
      </div>

      {serverError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-sm text-red-400">✕ {serverError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 bg-brand-500 hover:bg-brand-400 text-white font-semibold text-sm rounded-xl
          border border-brand-400 shadow-lg shadow-brand-900/40 transition-all active:scale-[0.99]
          disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? 'Importando...' : 'Importar datos'}
      </button>
    </form>
  )
}
