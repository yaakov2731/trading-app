'use client'

import * as React from 'react'
import { Tag, Ruler, MapPin, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SettingsPageClientProps {
  categories: any[]
  units:      any[]
  locations:  any[]
}

export function SettingsPageClient({ categories, units, locations }: SettingsPageClientProps) {
  const [activeTab, setActiveTab] = React.useState<'categories' | 'units' | 'locations'>('categories')

  const TABS = [
    { id: 'categories' as const, label: 'Categorías y SKU', icon: <Tag size={16} /> },
    { id: 'units'      as const, label: 'Unidades',          icon: <Ruler size={16} /> },
    { id: 'locations'  as const, label: 'Locales',           icon: <MapPin size={16} /> },
  ]

  return (
    <div className="space-y-5">
      {/* Tab navigation */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            ].join(' ')}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Categories */}
      {activeTab === 'categories' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            Los prefijos de SKU son inmutables una vez que hay productos creados.
            Modificar un prefijo solo afecta a futuros productos.
          </p>
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Prefijo SKU</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Último seq.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-medium text-slate-900">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="font-mono text-sm font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                        {cat.prefix}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-500">
                      {cat.sku_sequences?.[0]?.last_sequence ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={cat.is_active ? 'success' : 'default'} size="sm">
                        {cat.is_active ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Units */}
      {activeTab === 'units' && (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Código</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Símbolo</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Factor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {units.map(unit => (
                <tr key={unit.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <code className="font-mono text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{unit.code}</code>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{unit.name}</td>
                  <td className="px-4 py-3 text-slate-600">{unit.symbol}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-500">{unit.conversion_factor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Locations */}
      {activeTab === 'locations' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map(loc => (
            <Card key={loc.id} variant="default" padding="md">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: loc.color + '20' }}
                >
                  <div className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: loc.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{loc.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="text-xs font-mono text-slate-400">{loc.code}</code>
                    <span className="text-xs text-slate-400">{loc.type}</span>
                  </div>
                </div>
                <Badge variant={loc.is_active ? 'success' : 'default'} size="sm">
                  {loc.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
