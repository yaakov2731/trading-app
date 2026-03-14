/**
 * lib/server/location-permission-checks.ts
 * Location-aware permission enforcement.
 * Admins can access all locations; other roles are scoped to assigned ones.
 */

import { requireSession } from '@/lib/auth/session'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUserRole } from './permission-checks'

// ── User's accessible location IDs ───────────────────────────────────────────

export async function getMyLocationIds(): Promise<string[] | 'all'> {
  const role = await getCurrentUserRole()
  if (role === 'admin') return 'all'

  const session = await requireSession()
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('user_locations')
    .select('location_id')
    .eq('user_id', session.user.id)

  return (data ?? []).map((r) => r.location_id)
}

// ── Check if current user can access a specific location ─────────────────────

export async function canAccessLocation(locationId: string): Promise<boolean> {
  const role = await getCurrentUserRole()
  if (role === 'admin') return true

  const session = await requireSession()
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('user_locations')
    .select('location_id')
    .eq('user_id', session.user.id)
    .eq('location_id', locationId)
    .single()

  return !!data
}

// ── Require access to a location (throws if not) ──────────────────────────────

export async function requireLocationAccess(locationId: string): Promise<void> {
  const ok = await canAccessLocation(locationId)
  if (!ok) {
    throw new Error(`Unauthorized: no access to location "${locationId}"`)
  }
}

// ── Apply location filter to a query based on user access ─────────────────────

export async function applyLocationFilter<Q extends {
  in: (col: string, vals: string[]) => Q
}>(
  query: Q,
  locationColumn = 'location_id'
): Promise<Q> {
  const locationIds = await getMyLocationIds()
  if (locationIds === 'all') return query
  if (locationIds.length === 0) {
    // No locations assigned — apply impossible filter
    return query.in(locationColumn, ['__no_access__'])
  }
  return query.in(locationColumn, locationIds)
}

// ── Get accessible locations as full objects ──────────────────────────────────

export async function getAccessibleLocationObjects() {
  const supabase = await createServerSupabaseClient()
  const locationIds = await getMyLocationIds()

  let query = supabase.from('locations').select('id, name, slug, is_active')

  if (locationIds !== 'all') {
    if (locationIds.length === 0) return []
    query = query.in('id', locationIds)
  }

  const { data } = await query.order('name')
  return data ?? []
}

// ── Supervisor-specific: can they manage a given location? ────────────────────

export async function canManageLocation(locationId: string): Promise<boolean> {
  const role = await getCurrentUserRole()
  if (role === 'admin' || role === 'supervisor') {
    return canAccessLocation(locationId)
  }
  return false
}

// ── Read-only gate: can user write to this location? ─────────────────────────

export async function canWriteToLocation(locationId: string): Promise<boolean> {
  const role = await getCurrentUserRole()
  if (role === 'read_only') return false
  return canAccessLocation(locationId)
}
