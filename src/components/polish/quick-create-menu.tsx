/**
 * components/polish/quick-create-menu.tsx
 * Floating quick-create menu for fast access to common create actions.
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'

interface QuickCreateItem {
  label: string
  href: string
  icon: React.ReactNode
  description?: string
}

const ITEMS: QuickCreateItem[] = [
  {
    label: 'Compra',
    href: '/purchases/new',
    description: 'Registrar compra',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: 'Transferencia',
    href: '/transfers/new',
    description: 'Mover stock entre locales',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    label: 'Conteo físico',
    href: '/counts/new',
    description: 'Iniciar inventario',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: 'Producto',
    href: '/products/new',
    description: 'Agregar al catálogo',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
]

export default function QuickCreateMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Crear rápido"
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all
          border font-bold text-lg
          ${isOpen
            ? 'bg-brand-500 border-brand-400 text-white rotate-45 shadow-lg shadow-brand-900/50'
            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white'
          }`}
      >
        +
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 right-0 z-20 w-56 bg-slate-900 border border-slate-700
            rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-800">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Crear rápido</p>
            </div>
            {ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center
                  text-brand-400 flex-shrink-0 border border-slate-700">
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-200">{item.label}</p>
                  {item.description && (
                    <p className="text-xs text-slate-500">{item.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
