// =============================================================================
// Role definitions and permission helpers
// =============================================================================

export type UserRole = 'admin' | 'supervisor' | 'encargado' | 'read_only'

/** Numeric hierarchy — higher = more access */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin:     100,
  supervisor: 75,
  encargado:  50,
  read_only:  10,
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin:      'Administrador',
  supervisor: 'Supervisor',
  encargado:  'Encargado',
  read_only:  'Solo Lectura',
}

// =============================================================================
// Core role checks
// =============================================================================

export function hasRole(userRole: UserRole, required: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required]
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin'
}

export function isSupervisorOrAbove(role: UserRole): boolean {
  return hasRole(role, 'supervisor')
}

export function isEncargadoOrAbove(role: UserRole): boolean {
  return hasRole(role, 'encargado')
}

// =============================================================================
// Feature-level permission helpers
// =============================================================================

/** Can create, edit, deactivate products and manage categories */
export function canManageProducts(role: UserRole): boolean {
  return hasRole(role, 'supervisor')
}

/** Can record stock movements (purchases, outputs, adjustments) */
export function canCreateMovements(role: UserRole): boolean {
  return hasRole(role, 'encargado')
}

/** Can create and confirm transfers between locations */
export function canManageTransfers(role: UserRole): boolean {
  return hasRole(role, 'encargado')
}

/** Can record and approve physical counts / reconciliation */
export function canApprovePhysicalCount(role: UserRole): boolean {
  return hasRole(role, 'supervisor')
}

/** Can create purchase entries */
export function canCreatePurchases(role: UserRole): boolean {
  return hasRole(role, 'encargado')
}

/** Can manage users and role assignments */
export function canManageUsers(role: UserRole): boolean {
  return isAdmin(role)
}

/** Can manage locations (create, edit, deactivate) */
export function canManageLocations(role: UserRole): boolean {
  return isAdmin(role)
}

/** Can view alert rules and configure thresholds */
export function canManageAlerts(role: UserRole): boolean {
  return hasRole(role, 'supervisor')
}

/** Can export data to Excel/CSV */
export function canExportData(role: UserRole): boolean {
  return hasRole(role, 'encargado')
}

/** Can view reports and analytics */
export function canViewReports(role: UserRole): boolean {
  return hasRole(role, 'encargado')
}

// =============================================================================
// Location access check
// Admin bypasses all location checks.
// Others are limited to their assigned location IDs.
// =============================================================================

export function canViewLocation(
  role:           UserRole,
  locationId:     string,
  accessibleIds:  string[]
): boolean {
  if (isAdmin(role)) return true
  return accessibleIds.includes(locationId)
}

export function canOperateLocation(
  role:          UserRole,
  locationId:    string,
  accessibleIds: string[]
): boolean {
  if (!canCreateMovements(role)) return false
  return canViewLocation(role, locationId, accessibleIds)
}

// =============================================================================
// Permission matrix (useful for UI gating)
// =============================================================================

export interface PermissionSet {
  manageProducts:     boolean
  createMovements:    boolean
  createPurchases:    boolean
  manageTransfers:    boolean
  approveCount:       boolean
  manageUsers:        boolean
  manageLocations:    boolean
  manageAlerts:       boolean
  exportData:         boolean
  viewReports:        boolean
}

export function buildPermissions(role: UserRole): PermissionSet {
  return {
    manageProducts:  canManageProducts(role),
    createMovements: canCreateMovements(role),
    createPurchases: canCreatePurchases(role),
    manageTransfers: canManageTransfers(role),
    approveCount:    canApprovePhysicalCount(role),
    manageUsers:     canManageUsers(role),
    manageLocations: canManageLocations(role),
    manageAlerts:    canManageAlerts(role),
    exportData:      canExportData(role),
    viewReports:     canViewReports(role),
  }
}
