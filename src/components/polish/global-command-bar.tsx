/**
 * components/polish/global-command-bar.tsx
 * Global command/search bar — keyboard shortcut scaffold (Cmd+K).
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface CommandItem {
  id: string
  label: string
  description?: string
  href: string
  icon?: string
  shortcut?: string
}

const QUICK_COMMANDS: CommandItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: '📊', description: 'Ver resumen general' },
  { id: 'products', label: 'Productos', href: '/products', icon: '📦', description: 'Lista de productos' },
  { id: 'new-purchase', label: 'Nueva compra', href: '/purchases/new', icon: '🛒', description: 'Registrar compra' },
  { id: 'new-transfer', label: 'Nueva transferencia', href: '/transfers/new', icon: '↔️', description: 'Transferir stock' },
  { id: 'new-count', label: 'Nuevo conteo', href: '/counts/new', icon: '📋', description: 'Conteo físico' },
  { id: 'history', label: 'Historial', href: '/history', icon: '📜', description: 'Movimientos' },
  { id: 'reports', label: 'Reportes', href: '/reports', icon: '📈', description: 'Análisis y KPIs' },
  { id: 'migration', label: 'Migración', href: '/migration', icon: '🔄', description: 'Datos legados' },
  { id: 'exports', label: 'Exportar', href: '/exports', icon: '📥', description: 'Descargar datos' },
]

interface GlobalCommandBarProps {
  open?: boolean
  onClose?: () => void
}

export default function GlobalCommandBar({ open = false, onClose }: GlobalCommandBarProps) {
  const [isOpen, setIsOpen] = useState(open)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
        onClose?.()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setSearch('')
    }
  }, [isOpen])

  const filtered = search
    ? QUICK_COMMANDS.filter(
        (c) =>
          c.label.toLowerCase().includes(search.toLowerCase()) ||
          c.description?.toLowerCase().includes(search.toLowerCase())
      )
    : QUICK_COMMANDS

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => { setIsOpen(false); onClose?.() }}
      />

      {/* Command panel */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl
        shadow-2xl overflow-hidden">

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar páginas o acciones..."
            className="flex-1 bg-transparent text-slate-200 placeholder:text-slate-500 text-sm
              focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 bg-slate-800 border border-slate-700
            rounded text-xs text-slate-500 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">Sin resultados</p>
          ) : (
            filtered.map((cmd) => (
              <Link
                key={cmd.id}
                href={cmd.href}
                onClick={() => { setIsOpen(false); onClose?.() }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 transition-colors"
              >
                <span className="text-lg w-7 text-center flex-shrink-0">{cmd.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-200">{cmd.label}</p>
                  {cmd.description && (
                    <p className="text-xs text-slate-500">{cmd.description}</p>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2.5 border-t border-slate-800 flex items-center gap-3">
          <span className="text-xs text-slate-600">
            <kbd className="font-mono">↑↓</kbd> navegar ·{' '}
            <kbd className="font-mono">↵</kbd> abrir ·{' '}
            <kbd className="font-mono">Esc</kbd> cerrar
          </span>
        </div>
      </div>
    </div>
  )
}
