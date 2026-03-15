/**
 * lib/server/permission-checks.ts
 * Server-side permission enforcement helpers.
 * Use these in server components, server actions, and API routes.
 */

import { requireSession } from '@/lib/auth/session'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  ROLE_PERMISSIONS,
  ROLE_LEVELS,
  roleHasPermission,
  type Permission,
  type RoleName,
} from '@/lib/constants/permissions'

// ── Cached role fetch ─────────────────────────────────────────────────────────

export async function getCurrentUserRole(): Promise<RoleName> {
  const session = await requireSession()
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  return (data?.role as RoleName) ?? 'read_only'
}

// ── Core permission check ─────────────────────────────────────────────────────

export async function checkPermission(permission: Permission): Promise<boolean> {
  const role = await getCurrentUserRole()
  return roleHasPermission(role, permission)
}

export async function requirePermission(permission: Permission): Promise<void> {
  const has = await checkPermission(permission)
  if (!has) {
    throw new Error(`Unauthorized: missing permission "${permission}"`)
  }
}

// ── Convenience role checks ───────────────────────────────────────────────────

export async function checkMinRole(minRole: RoleName): Promise<boolean> {
  const role = await getCurrentUserRole()
  return ROLE_LEVELS[role] >= ROLE_LEVELS[minRole]
}

export async function requireMinRole(minRole: RoleName): Promise<void> {
  const ok = await checkMinRole(minRole)
  if (!ok) {
    throw new Error(`Unauthorized: requires role "${minRole}" or higher`)
  }
}

// ── Batch permission check ────────────────────────────────────────────────────

export async function checkPermissions(
  permissions: Permission[]
): Promise<Record<Permission, boolean>> {
  const role = await getCurrentUserRole()
  return Object.fromEntries(
    permissions.map((p) => [p, roleHasPermission(role, p)])
  ) as Record<Permission, boolean>
}

// ── Full permission map for current user ──────────────────────────────────────

export async function getMyPermissions(): Promise<Record<Permission, boolean>> {
  const role = await getCurrentUserRole()
  const allPerms = ROLE_PERMISSIONS[role] as readonly Permission[]

  return Object.fromEntries(
    (Object.keys(ROLE_PERMISSIONS.admin) as Permission[]).map((p) => [
      p,
      allPerms.includes(p),
    ])
  ) as Record<Permission, boolean>
}

// ── Action-level guard helpers ────────────────────────────────────────────────

export async function canManageProducts() { return checkPermission('manage_products') }
export async function canCreateMovements() { return checkPermission('create_movements') }
export async function canCreatePurchases() { return checkPermission('create_purchases') }
export async function canReceivePurchases() { return checkPermission('receive_purchases') }
export async function canCreateTransfers() { return checkPermission('create_transfers') }
export async function canPerformCounts() { return checkPermission('perform_counts') }
export async function canConfirmCounts() { return checkPermission('confirm_counts') }
export async function canApproveMigration() { return checkPermission('approve_opening_balances') }
export async function canExecuteCutover() { return checkPermission('execute_cutover') }
export async function canManageUsers() { return checkPermission('manage_users') }
export async function canViewAudit() { return checkPermission('view_audit') }

// ── Server action wrapper ─────────────────────────────────────────────────────

export async function withPermission<T>(
  permission: Permission,
  fn: () => Promise<T>
): Promise<T> {
  await requirePermission(permission)
  return fn()
}
