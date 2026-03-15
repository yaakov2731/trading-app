'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ArrowLeftRight,
  ClipboardList,
  History,
  Bell,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Boxes,
  Zap,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Location, User } from '@/lib/types'

// =============================================================================
// Premium Sidebar Navigation
// =============================================================================

interface NavItem {
  href:    string
  label:   string
  icon:    React.ReactNode
  badge?:  number | string
  group?:  string
}

const NAV_ITEMS: NavItem[] = [
  // Main
  { href: '/dashboard',      label: 'Dashboard',      icon: <LayoutDashboard size={18} />, group: 'Principal' },
  { href: '/stock',          label: 'Stock Actual',   icon: <Boxes size={18} />,           group: 'Principal' },
  { href: '/alerts',         label: 'Alertas',        icon: <Bell size={18} />,             group: 'Principal' },

  // Operations
  { href: '/movements',      label: 'Movimientos',    icon: <Zap size={18} />,              group: 'Operaciones' },
  { href: '/purchases',      label: 'Compras',        icon: <ShoppingCart size={18} />,     group: 'Operaciones' },
  { href: '/transfers',      label: 'Transferencias', icon: <ArrowLeftRight size={18} />,   group: 'Operaciones' },
  { href: '/waste',          label: 'Mermas',         icon: <Trash2 size={18} />,           group: 'Operaciones' },

  // Inventory
  { href: '/physical-count', label: 'Conteo Físico',  icon: <ClipboardList size={18} />,    group: 'Inventario' },
  { href: '/history',        label: 'Historial',      icon: <History size={18} />,          group: 'Inventario' },

  // Management
  { href: '/products',       label: 'Productos',      icon: <Package size={18} />,          group: 'Gestión' },
  { href: '/reports',        label: 'Reportes',       icon: <BarChart3 size={18} />,        group: 'Gestión' },
  { href: '/settings',       label: 'Configuración',  icon: <Settings size={18} />,         group: 'Gestión' },
]

interface SidebarProps {
  location?:   Location | null
  user?:       User | null
  collapsed?:  boolean
  onToggle?:   () => void
  onSignOut?:  () => void
}

export function Sidebar({ location, user, collapsed = false, onToggle, onSignOut }: SidebarProps) {
  const pathname = usePathname()

  const groups = NAV_ITEMS.reduce<Record<string, NavItem[]>>((acc, item) => {
    const g = item.group ?? 'Other'
    if (!acc[g]) acc[g] = []
    acc[g].push(item)
    return acc
  }, {})

  return (
    <aside className={cn(
      'fixed left-0 top-0 bottom-0 z-30 flex flex-col',
      'bg-slate-900 text-slate-100',
      'transition-[width] duration-300 ease-in-out',
      collapsed ? 'w-[72px]' : 'w-[280px]',
      // Desktop only — mobile uses bottom nav
      'hidden lg:flex'
    )}>
      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div className={cn(
        'flex items-center gap-3 px-4 h-16 border-b border-slate-800/60 flex-shrink-0',
        collapsed && 'justify-center px-0'
      )}>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex-shrink-0">
          <Boxes size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-tight">GastroStock</p>
            <p className="text-xs text-slate-400 truncate">Control de inventario</p>
          </div>
        )}
      </div>

      {/* ── Location pill ─────────────────────────────────────────────────── */}
      {location && !collapsed && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-slate-800/60 px-3 py-2.5 border border-slate-700/40">
          <div
            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: location.color }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-200 truncate">{location.name}</p>
            <p className="text-xs text-slate-500">{location.code}</p>
          </div>
        </div>
      )}
      {location && collapsed && (
        <div className="flex justify-center mt-3">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: location.color }}
          />
        </div>
      )}

      {/* ── Nav items ─────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-5 px-3">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {group}
              </p>
            )}
            <ul className="space-y-0.5">
              {items.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
                        'transition-all duration-150',
                        collapsed && 'justify-center px-0 w-full',
                        isActive
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className={cn(
                        'flex-shrink-0 transition-transform duration-150',
                        isActive ? 'text-white' : 'text-slate-400'
                      )}>
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <span className="flex-1 truncate">{item.label}</span>
                      )}
                      {!collapsed && item.badge && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-600 px-1 text-[10px] font-bold text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── User + collapse ───────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-slate-800/60 p-3 space-y-1">
        {user && !collapsed && (
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-800/60 transition-colors cursor-pointer group">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">
                {user.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">{user.full_name}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{user.role}</p>
            </div>
            <button
              onClick={onSignOut}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all"
              title="Cerrar sesión"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}

        <button
          onClick={onToggle}
          className={cn(
            'flex items-center gap-2 w-full rounded-xl px-3 py-2.5 text-xs font-medium text-slate-500',
            'hover:bg-slate-800/60 hover:text-slate-200 transition-all duration-150',
            collapsed && 'justify-center px-0'
          )}
        >
          {collapsed ? <ChevronRight size={16} /> : (
            <>
              <ChevronLeft size={16} />
              <span>Colapsar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

// =============================================================================
// Mobile Bottom Navigation
// =============================================================================

const MOBILE_NAV: NavItem[] = [
  { href: '/dashboard',      label: 'Inicio',    icon: <LayoutDashboard size={20} /> },
  { href: '/stock',          label: 'Stock',     icon: <Boxes size={20} /> },
  { href: '/movements',      label: 'Mover',     icon: <Zap size={20} /> },
  { href: '/transfers',      label: 'Transfer',  icon: <ArrowLeftRight size={20} /> },
  { href: '/products',       label: 'Productos', icon: <Package size={20} /> },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-slate-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {MOBILE_NAV.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-1 px-2 rounded-xl',
                'transition-all duration-150',
                isActive ? 'text-brand-600' : 'text-slate-400'
              )}
            >
              <span className={cn(
                'p-1.5 rounded-xl transition-all duration-150',
                isActive ? 'bg-brand-50' : ''
              )}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
