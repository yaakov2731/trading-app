/**
 * lib/constants/permissions.ts
 * Canonical permission definitions and role-level defaults.
 */

// ── Role levels ───────────────────────────────────────────────────────────────

export const ROLE_LEVELS = {
  admin:      100,
  supervisor: 75,
  encargado:  50,
  read_only:  10,
} as const

export type RoleName = keyof typeof ROLE_LEVELS

// ── Permission keys ───────────────────────────────────────────────────────────

export const PERMISSIONS = [
  // Dashboard & Reports
  'view_dashboard',
  'view_reports',
  'view_audit',

  // Products & Catalog
  'view_products',
  'manage_products',
  'manage_categories',
  'manage_units',

  // Stock
  'view_stock',
  'create_movements',

  // Purchases
  'view_purchases',
  'create_purchases',
  'receive_purchases',
  'manage_suppliers',

  // Transfers
  'view_transfers',
  'create_transfers',
  'receive_transfers',

  // Physical Counts
  'view_counts',
  'perform_counts',
  'confirm_counts',

  // Migration
  'view_migration',
  'run_migration_import',
  'approve_opening_balances',
  'execute_cutover',

  // Exports
  'create_exports',

  // Users & Roles
  'manage_users',
  'manage_roles',

  // Settings
  'manage_settings',
] as const

export type Permission = (typeof PERMISSIONS)[number]

// ── Role → permission defaults ────────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<RoleName, readonly Permission[]> = {
  admin: PERMISSIONS, // all

  supervisor: [
    'view_dashboard', 'view_reports',
    'view_products', 'manage_products', 'manage_categories', 'manage_units',
    'view_stock', 'create_movements',
    'view_purchases', 'create_purchases', 'receive_purchases', 'manage_suppliers',
    'view_transfers', 'create_transfers', 'receive_transfers',
    'view_counts', 'perform_counts', 'confirm_counts',
    'view_migration', 'run_migration_import', 'approve_opening_balances',
    'create_exports',
    'manage_users',
  ],

  encargado: [
    'view_dashboard',
    'view_products',
    'view_stock', 'create_movements',
    'view_purchases', 'create_purchases', 'receive_purchases',
    'view_transfers', 'create_transfers', 'receive_transfers',
    'view_counts', 'perform_counts',
    'create_exports',
  ],

  read_only: [
    'view_dashboard',
    'view_products',
    'view_stock',
    'view_purchases',
    'view_transfers',
    'view_counts',
  ],
}

// ── Helper: minimum role for a permission ─────────────────────────────────────

export function minimumRoleForPermission(permission: Permission): RoleName | null {
  for (const role of ['read_only', 'encargado', 'supervisor', 'admin'] as RoleName[]) {
    if ((ROLE_PERMISSIONS[role] as readonly Permission[]).includes(permission)) {
      return role
    }
  }
  return null
}

export function roleHasPermission(role: RoleName, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] as readonly Permission[]).includes(permission)
}

export function roleLevelAtLeast(role: RoleName, minRole: RoleName): boolean {
  return ROLE_LEVELS[role] >= ROLE_LEVELS[minRole]
}

// ── Permission display labels ─────────────────────────────────────────────────

export const PERMISSION_LABELS: Record<Permission, string> = {
  view_dashboard:         'Ver dashboard',
  view_reports:           'Ver reportes',
  view_audit:             'Ver auditoría',
  view_products:          'Ver productos',
  manage_products:        'Gestionar productos',
  manage_categories:      'Gestionar categorías',
  manage_units:           'Gestionar unidades',
  view_stock:             'Ver stock',
  create_movements:       'Crear movimientos',
  view_purchases:         'Ver compras',
  create_purchases:       'Crear compras',
  receive_purchases:      'Recibir compras',
  manage_suppliers:       'Gestionar proveedores',
  view_transfers:         'Ver transferencias',
  create_transfers:       'Crear transferencias',
  receive_transfers:      'Recibir transferencias',
  view_counts:            'Ver conteos',
  perform_counts:         'Realizar conteos',
  confirm_counts:         'Confirmar conteos',
  view_migration:         'Ver migración',
  run_migration_import:   'Importar datos legados',
  approve_opening_balances: 'Aprobar saldos iniciales',
  execute_cutover:        'Ejecutar corte',
  create_exports:         'Exportar datos',
  manage_users:           'Gestionar usuarios',
  manage_roles:           'Gestionar roles',
  manage_settings:        'Configuración general',
}

export const PERMISSION_GROUPS: Record<string, Permission[]> = {
  'Dashboard y Reportes': ['view_dashboard', 'view_reports', 'view_audit'],
  'Productos': ['view_products', 'manage_products', 'manage_categories', 'manage_units'],
  'Inventario': ['view_stock', 'create_movements'],
  'Compras': ['view_purchases', 'create_purchases', 'receive_purchases', 'manage_suppliers'],
  'Transferencias': ['view_transfers', 'create_transfers', 'receive_transfers'],
  'Conteos físicos': ['view_counts', 'perform_counts', 'confirm_counts'],
  'Migración': ['view_migration', 'run_migration_import', 'approve_opening_balances', 'execute_cutover'],
  'Exportaciones': ['create_exports'],
  'Usuarios y roles': ['manage_users', 'manage_roles', 'manage_settings'],
}
