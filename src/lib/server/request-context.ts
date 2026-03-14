/**
 * lib/server/request-context.ts
 * Per-request context: current user, role, accessible locations.
 * Memoized within a single server request using React cache().
 */

import { cache } from 'react'
import { requireSession } from '@/lib/auth/session'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ROLE_PERMISSIONS, ROLE_LEVELS, type RoleName, type Permission } from '@/lib/constants/permissions'

export interface RequestContext {
  userId: string
  email: string | undefined
  role: RoleName
  roleLevel: number
  permissions: Set<Permission>
  locationIds: string[] | 'all'
  isAdmin: boolean
  isSupervisor: boolean
}

export const getRequestContext = cache(async (): Promise<RequestContext> => {
  const session = await requireSession()
  const supabase = await createServerSupabaseClient()

  // Fetch user record
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  const role = (user?.role as RoleName) ?? 'read_only'
  const roleLevel = ROLE_LEVELS[role]
  const isAdmin = role === 'admin'
  const isSupervisor = roleLevel >= ROLE_LEVELS.supervisor

  // Fetch location access
  let locationIds: string[] | 'all' = 'all'
  if (!isAdmin) {
    const { data: locs } = await supabase
      .from('user_locations')
      .select('location_id')
      .eq('user_id', session.user.id)
    locationIds = (locs ?? []).map((l) => l.location_id)
  }

  const permissions = new Set<Permission>(
    ROLE_PERMISSIONS[role] as Permission[]
  )

  return {
    userId: session.user.id,
    email: session.user.email,
    role,
    roleLevel,
    permissions,
    locationIds,
    isAdmin,
    isSupervisor,
  }
})

// ── Context-aware helpers ─────────────────────────────────────────────────────

export async function ctxHasPermission(permission: Permission): Promise<boolean> {
  const ctx = await getRequestContext()
  return ctx.permissions.has(permission)
}

export async function ctxRequirePermission(permission: Permission): Promise<void> {
  const has = await ctxHasPermission(permission)
  if (!has) throw new Error(`Unauthorized: missing permission "${permission}"`)
}

export async function ctxCanAccessLocation(locationId: string): Promise<boolean> {
  const ctx = await getRequestContext()
  if (ctx.locationIds === 'all') return true
  return ctx.locationIds.includes(locationId)
}

export async function ctxRequireLocationAccess(locationId: string): Promise<void> {
  const ok = await ctxCanAccessLocation(locationId)
  if (!ok) throw new Error(`Unauthorized: no access to location "${locationId}"`)
}
