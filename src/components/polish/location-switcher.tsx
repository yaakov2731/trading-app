/**
 * components/polish/location-switcher.tsx
 * Location context switcher for navigation bar.
 */

'use client'

import { useState } from 'react'

interface Location {
  id: string
  name: string
  slug: string
}

interface LocationSwitcherProps {
  locations: Location[]
  currentLocationId?: string | null
  onSelect?: (location: Location | null) => void
}

export default function LocationSwitcher({
  locations,
  currentLocationId,
  onSelect,
}: LocationSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const current = locations.find((l) => l.id === currentLocationId)

  const handleSelect = (loc: Location | null) => {
    setIsOpen(false)
    onSelect?.(loc)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700
          hover:border-slate-600 text-sm text-slate-300 transition-colors"
      >
        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="max-w-[120px] truncate">
          {current?.name ?? 'Todos los locales'}
        </span>
        <svg className={`w-3 h-3 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-1.5 right-0 z-20 w-52 bg-slate-900 border border-slate-700
            rounded-xl shadow-2xl overflow-hidden">
            <button
              onClick={() => handleSelect(null)}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors
                ${!currentLocationId
                  ? 'bg-brand-500/10 text-brand-400'
                  : 'text-slate-300 hover:bg-slate-800'
                }`}
            >
              Todos los locales
            </button>
            <div className="border-t border-slate-800" />
            {locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => handleSelect(loc)}
                className={`w-full text-left px-3 py-2.5 text-sm transition-colors
                  ${currentLocationId === loc.id
                    ? 'bg-brand-500/10 text-brand-400'
                    : 'text-slate-300 hover:bg-slate-800'
                  }`}
              >
                {loc.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
