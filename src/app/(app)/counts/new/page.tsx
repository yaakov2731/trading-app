'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Calendar, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { PhysicalCountForm } from '@/components/forms/physical-count-form'
import { Button } from '@/components/ui/button'

// In a real page this data would come from a server component parent
// or a fetch call. Keeping the shell simple so the logic is clear.

export default function NewCountPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [locationId, setLocationId] = useState('')
  const [countDate, setCountDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [countId, setCountId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function createCount() {
    if (!locationId) { setError('Selecciona una ubicación'); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location_id: locationId, count_date: countDate, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al crear el conteo')
      setCountId(data.id)
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  if (step === 2 && countId) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep(1)} className="rounded-xl p-2 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Registrar conteo</h1>
            <p className="text-sm text-slate-500">Ingresa las cantidades contadas</p>
          </div>
        </div>

        <PhysicalCountForm
          products={[]} // populated by parent in full implementation
          onSave={async (items) => {
            const res = await fetch(`/api/counts/${countId}/items`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ physical_count_id: countId, items }),
            })
            if (!res.ok) throw new Error('Error al guardar')
            router.push(`/counts/${countId}`)
          }}
          saving={saving}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Link href="/counts" className="rounded-xl p-2 hover:bg-slate-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Nuevo conteo físico</h1>
          <p className="text-sm text-slate-500">Configura el conteo antes de comenzar</p>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-700">
            <ClipboardList className="h-5 w-5 text-brand-500" />
            <h2 className="font-semibold">Configuración del conteo</h2>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              <MapPin className="mr-1.5 inline h-4 w-4" />
              Ubicación *
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Seleccionar ubicación…</option>
              {/* locations injected at runtime */}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              <Calendar className="mr-1.5 inline h-4 w-4" />
              Fecha del conteo *
            </label>
            <input
              type="date"
              value={countDate}
              onChange={(e) => setCountDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Observaciones opcionales…"
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={createCount}
          disabled={saving || !locationId}
          className="w-full"
        >
          {saving ? 'Creando conteo…' : 'Iniciar conteo →'}
        </Button>
      </div>
    </div>
  )
}
