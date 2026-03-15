'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { createClient } from '@/lib/db/client'
import type { Location, User } from '@/lib/types'

interface AppShellProviderProps {
  user?:               User | null
  locations?:          Location[]
  primaryLocationId?:  string
  children:            React.ReactNode
}

export function AppShellProvider({
  user,
  locations = [],
  primaryLocationId,
  children,
}: AppShellProviderProps) {
  const router = useRouter()
  const [activeLocation, setActiveLocation] = React.useState<Location | null>(
    locations.find(l => l.id === primaryLocationId) ?? locations[0] ?? null
  )

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <AppShell
      user={user}
      location={activeLocation}
      locations={locations}
      onLocationChange={setActiveLocation}
      onSignOut={handleSignOut}
    >
      {children}
    </AppShell>
  )
}
