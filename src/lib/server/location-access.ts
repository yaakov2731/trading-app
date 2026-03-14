/**
 * lib/server/location-access.ts
 * Server-side location access helpers.
 * Used in server actions and route handlers to verify location permissions.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/session'
import { isAdmin } from '@/lib/auth/permissions'

export interface LocationRow {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  is_active: boolean
}

/**
 * Returns all locations accessible to the current user.
 * Admins get all active locations; others get their assigned ones.
 */
export async function getAccessibleLocations(): Promise<LocationRow[]> {
  const session = await getSession()
  if (!session) return []

  const supabase = await createServerSupabaseClient()

  if (isAdmin(session.user)) {
    const { data } = await supabase
      .from('locations')
      .select('id, name, slug, description, color, is_active')
      .eq('is_active', true)
      .order('name')
    return (data ?? []) as LocationRow[]
  }

  // Non-admin: fetch only assigned locations
  const { data } = await supabase
    .from('user_locations')
    .select('location:locations(id, name, slug, description, color, is_active)')
    .eq('user_id', session.user.id)

  return ((data ?? [])
    .map((r: { location: LocationRow | LocationRow[] | null }) =>
      Array.isArray(r.location) ? r.location[0] : r.location
    )
    .filter(Boolean) as LocationRow[])
    .filter((l) => l.is_active)
}

/**
 * Returns true if the current user can access the given location.
 */
export async function assertLocationAccess(locationId: string): Promise<void> {
  const session = await getSession()
  if (!session) throw new Error('Unauthenticated')

  if (isAdmin(session.user)) return

  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('user_locations')
    .select('location_id')
    .eq('user_id', session.user.id)
    .eq('location_id', locationId)
    .single()

  if (!data) {
    throw new Error(`Access denied to location ${locationId}`)
  }
}

/**
 * Returns a single location by ID, or throws if inaccessible.
 */
export async function getLocation(locationId: string): Promise<LocationRow> {
  await assertLocationAccess(locationId)

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, slug, description, color, is_active')
    .eq('id', locationId)
    .single()

  if (error || !data) throw new Error(`Location not found: ${locationId}`)
  return data as LocationRow
}
