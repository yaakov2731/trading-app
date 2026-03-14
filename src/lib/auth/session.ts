import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cache } from 'react'
import type { UserRole } from '@/lib/auth/permissions'

// =============================================================================
// Session types
// =============================================================================

export interface AppUser {
  id:           string
  email:        string
  fullName:     string
  role:         UserRole
  avatarUrl:    string | null
  isActive:     boolean
  locationIds:  string[]          // All location IDs this user can access
  primaryLocationId: string | null
}

export interface AppSession {
  user: AppUser
}

// =============================================================================
// getSession — cached per-request (React cache)
// Use in server components and server actions.
// =============================================================================

export const getSession = cache(async (): Promise<AppSession | null> => {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  // Fetch profile + location assignments in one query
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select(`
      id, email, full_name, role, avatar_url, is_active,
      user_locations(location_id, is_primary)
    `)
    .eq('id', user.id)
    .single()

  if (profileError || !profile || !profile.is_active) return null

  const locationAssignments = (profile.user_locations as any[]) ?? []
  const locationIds = locationAssignments.map((ul: any) => ul.location_id)

  const primary = locationAssignments.find((ul: any) => ul.is_primary)
  const primaryLocationId = primary?.location_id ?? locationIds[0] ?? null

  return {
    user: {
      id:               profile.id,
      email:            profile.email,
      fullName:         profile.full_name,
      role:             profile.role as UserRole,
      avatarUrl:        profile.avatar_url,
      isActive:         profile.is_active,
      locationIds,
      primaryLocationId,
    },
  }
})

// =============================================================================
// requireSession — throws if unauthenticated (for server actions)
// =============================================================================

export async function requireSession(): Promise<AppSession> {
  const session = await getSession()
  if (!session) throw new Error('UNAUTHENTICATED')
  return session
}

// =============================================================================
// requireActiveUser — convenience shorthand
// =============================================================================

export async function requireActiveUser(): Promise<AppUser> {
  const { user } = await requireSession()
  return user
}
