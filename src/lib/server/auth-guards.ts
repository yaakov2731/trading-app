/**
 * lib/server/auth-guards.ts
 * Server action guards — call at the top of any server action or route handler.
 * All guards throw on failure so Next.js error boundaries catch them.
 */

import { redirect } from 'next/navigation'
import { getSession, requireSession, type AppSession } from '@/lib/auth/session'
import {
  isAdmin,
  isSupervisorOrAbove,
  canManageProducts,
  canCreateMovements,
  buildPermissions,
} from '@/lib/auth/permissions'

// ── Basic guards ──────────────────────────────────────────────────────────────

/**
 * Returns the current session or redirects to /login.
 * Use in server components that require auth.
 */
export async function requireAuth(): Promise<AppSession> {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

/**
 * Requires the user to be an admin. Throws otherwise.
 */
export async function requireAdmin(): Promise<AppSession> {
  const session = await requireSession()
  if (!isAdmin(session.user)) {
    throw new Error('Forbidden: admin required')
  }
  return session
}

/**
 * Requires supervisor or above. Throws otherwise.
 */
export async function requireSupervisor(): Promise<AppSession> {
  const session = await requireSession()
  if (!isSupervisorOrAbove(session.user)) {
    throw new Error('Forbidden: supervisor or above required')
  }
  return session
}

/**
 * Requires encargado or above (can create movements).
 */
export async function requireMovementAccess(): Promise<AppSession> {
  const session = await requireSession()
  if (!canCreateMovements(session.user)) {
    throw new Error('Forbidden: encargado or above required')
  }
  return session
}

/**
 * Requires product management access (supervisor+).
 */
export async function requireProductAccess(): Promise<AppSession> {
  const session = await requireSession()
  if (!canManageProducts(session.user)) {
    throw new Error('Forbidden: supervisor or above required')
  }
  return session
}

// ── Composite permission helper ───────────────────────────────────────────────

/**
 * Returns a permission map for the current user.
 * Use in server components to conditionally render UI.
 */
export async function getPermissions() {
  const session = await getSession()
  if (!session) {
    return {
      canAdmin: false,
      canManageProducts: false,
      canCreateMovements: false,
      canManageUsers: false,
      isLoggedIn: false,
    }
  }

  const perms = buildPermissions(session.user)
  return {
    ...perms,
    isLoggedIn: true,
  }
}

// ── Server action wrapper ─────────────────────────────────────────────────────

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Wraps a server action with auth + error boundary.
 * Returns a typed result object so client components can handle errors gracefully.
 */
export async function withAuth<T>(
  fn: (session: AppSession) => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const session = await requireSession()
    const data = await fn(session)
    return { success: true, data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}
