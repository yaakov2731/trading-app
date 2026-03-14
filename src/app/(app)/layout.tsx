import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/client'
import { AppShellProvider } from './app-shell-provider'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch app user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch all accessible locations
  const { data: userLocations } = await supabase
    .from('user_locations')
    .select('*, location:locations(*)')
    .eq('user_id', user.id)
    .order('is_primary', { ascending: false })

  // Admin sees all locations
  let locations: any[] = []
  if (profile?.role === 'admin' || profile?.role === 'manager') {
    const { data } = await supabase
      .from('locations')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
    locations = data ?? []
  } else {
    locations = userLocations?.map(ul => ul.location).filter(Boolean) ?? []
  }

  return (
    <AppShellProvider
      user={profile}
      locations={locations}
      primaryLocationId={userLocations?.[0]?.location_id ?? locations?.[0]?.id}
    >
      {children}
    </AppShellProvider>
  )
}
