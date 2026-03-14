/**
 * components/guards/permission-guard.tsx
 * Client-side permission guard — hides UI elements for unauthorized users.
 * Server-side checks must still exist independently.
 */

'use client'

import type { Permission } from '@/lib/constants/permissions'

interface PermissionGuardProps {
  permission: Permission
  userPermissions: Partial<Record<Permission, boolean>>
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Usage:
 * Pass userPermissions from a server component prop.
 * Never rely solely on this for security — server checks are required.
 */
export function PermissionGuard({
  permission,
  userPermissions,
  children,
  fallback = null,
}: PermissionGuardProps) {
  if (!userPermissions[permission]) return <>{fallback}</>
  return <>{children}</>
}

// ── Role-level guard ──────────────────────────────────────────────────────────

interface RoleGuardProps {
  allowedRoles: string[]
  currentRole: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ allowedRoles, currentRole, children, fallback = null }: RoleGuardProps) {
  if (!allowedRoles.includes(currentRole)) return <>{fallback}</>
  return <>{children}</>
}

// ── Admin-only guard ──────────────────────────────────────────────────────────

interface AdminOnlyProps {
  isAdmin: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AdminOnly({ isAdmin, children, fallback = null }: AdminOnlyProps) {
  if (!isAdmin) return <>{fallback}</>
  return <>{children}</>
}

// ── Read-only display guard ───────────────────────────────────────────────────

interface ReadOnlyFallbackProps {
  isReadOnly: boolean
  children: React.ReactNode
  readOnlyMessage?: string
}

export function ReadOnlyFallback({ isReadOnly, children, readOnlyMessage }: ReadOnlyFallbackProps) {
  if (isReadOnly && readOnlyMessage) {
    return (
      <span className="text-xs text-slate-500 italic">
        {readOnlyMessage}
      </span>
    )
  }
  if (isReadOnly) return null
  return <>{children}</>
}
