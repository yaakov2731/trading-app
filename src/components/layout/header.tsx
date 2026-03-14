'use client'

import * as React from 'react'
import { Bell, Search, ChevronDown, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Location, User } from '@/lib/types'

interface HeaderProps {
  title?:     string
  subtitle?:  string
  location?:  Location | null
  locations?: Location[]
  user?:      User | null
  onLocationChange?: (location: Location) => void
  actions?:   React.ReactNode
  className?: string
}

export function Header({
  title,
  subtitle,
  location,
  locations,
  user,
  onLocationChange,
  actions,
  className,
}: HeaderProps) {
  const [locationMenuOpen, setLocationMenuOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Close on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setLocationMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className={cn(
      'flex h-16 items-center justify-between gap-4 px-6',
      'bg-white border-b border-slate-200/80',
      'sticky top-0 z-20',
      className
    )}>
      {/* ── Left: title ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 min-w-0">
        {title && (
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-slate-900 leading-tight truncate">{title}</h1>
            {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
          </div>
        )}
      </div>

      {/* ── Right: location selector + actions + profile ─────────────── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Location selector */}
        {location && locations && locations.length > 1 && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setLocationMenuOpen(v => !v)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-3 h-9',
                'bg-slate-50 border border-slate-200',
                'text-sm font-medium text-slate-700',
                'hover:bg-slate-100 hover:border-slate-300',
                'transition-all duration-150',
                'hidden sm:flex'
              )}
            >
              <span
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: location.color }}
              />
              <MapPin size={13} className="text-slate-400" />
              <span>{location.name}</span>
              <ChevronDown size={14} className={cn(
                'text-slate-400 transition-transform duration-150',
                locationMenuOpen && 'rotate-180'
              )} />
            </button>

            {locationMenuOpen && (
              <div className={cn(
                'absolute right-0 top-full mt-1.5 w-56',
                'bg-white rounded-xl border border-slate-200 shadow-xl',
                'py-1.5 z-50',
                'animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150'
              )}>
                <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Locales
                </p>
                {locations.map(loc => (
                  <button
                    key={loc.id}
                    onClick={() => {
                      onLocationChange?.(loc)
                      setLocationMenuOpen(false)
                    }}
                    className={cn(
                      'flex items-center gap-2.5 w-full px-3 py-2 text-sm',
                      'text-slate-700 hover:bg-slate-50',
                      'transition-colors duration-100',
                      loc.id === location.id && 'bg-brand-50 text-brand-700 font-medium'
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: loc.color }}
                    />
                    {loc.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Custom actions (page-level CTAs) */}
        {actions}

        {/* Notification bell */}
        <button className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-xl',
          'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
          'transition-all duration-150'
        )}>
          <Bell size={18} />
          {/* Unread dot */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger-500" />
        </button>

        {/* Avatar */}
        {user && (
          <div className={cn(
            'h-9 w-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600',
            'flex items-center justify-center cursor-pointer',
            'hover:ring-2 hover:ring-brand-300 transition-all duration-150'
          )}>
            <span className="text-xs font-bold text-white">
              {user.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </header>
  )
}
