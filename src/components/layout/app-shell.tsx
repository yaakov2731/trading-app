'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'
import { Sidebar, MobileBottomNav } from './sidebar'
import { Header } from './header'
import type { Location, User } from '@/lib/types'

interface AppShellProps {
  children:     React.ReactNode
  user?:        User | null
  location?:    Location | null
  locations?:   Location[]
  pageTitle?:   string
  pageSubtitle?: string
  pageActions?: React.ReactNode
  onLocationChange?: (location: Location) => void
  onSignOut?:   () => void
}

export function AppShell({
  children,
  user,
  location,
  locations,
  pageTitle,
  pageSubtitle,
  pageActions,
  onLocationChange,
  onSignOut,
}: AppShellProps) {
  const [collapsed, setCollapsed] = React.useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <Sidebar
        location={location}
        user={user}
        collapsed={collapsed}
        onToggle={() => setCollapsed(v => !v)}
        onSignOut={onSignOut}
      />

      {/* Main content area — offset by sidebar width */}
      <div className={cn(
        'flex flex-col min-h-screen transition-[padding] duration-300',
        collapsed ? 'lg:pl-[72px]' : 'lg:pl-[280px]',
        // Mobile: no left padding, bottom padding for bottom nav
        'pb-16 lg:pb-0'
      )}>
        {/* Sticky header */}
        <Header
          title={pageTitle}
          subtitle={pageSubtitle}
          location={location}
          locations={locations}
          user={user}
          onLocationChange={onLocationChange}
          actions={pageActions}
        />

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  )
}

// =============================================================================
// Page-level layout helpers
// =============================================================================

export function PageHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between gap-4 mb-6', className)}>
      {children}
    </div>
  )
}

export function PageTitle({
  children,
  description,
}: {
  children: React.ReactNode
  description?: string
}) {
  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">{children}</h1>
      {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
    </div>
  )
}

export function PageSection({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('mb-6', className)}>
      {children}
    </section>
  )
}
