/**
 * tests/unit/permissions.test.ts
 * Tests for permission and role logic.
 */

import { describe, it, expect } from 'vitest'
import {
  ROLE_PERMISSIONS,
  ROLE_LEVELS,
  roleHasPermission,
  roleLevelAtLeast,
  minimumRoleForPermission,
  type RoleName,
  type Permission,
} from '@/lib/constants/permissions'

describe('ROLE_LEVELS', () => {
  it('admin is highest', () => {
    expect(ROLE_LEVELS.admin).toBeGreaterThan(ROLE_LEVELS.supervisor)
    expect(ROLE_LEVELS.supervisor).toBeGreaterThan(ROLE_LEVELS.encargado)
    expect(ROLE_LEVELS.encargado).toBeGreaterThan(ROLE_LEVELS.read_only)
  })
})

describe('roleHasPermission', () => {
  it('admin has all permissions', () => {
    expect(roleHasPermission('admin', 'execute_cutover')).toBe(true)
    expect(roleHasPermission('admin', 'manage_roles')).toBe(true)
    expect(roleHasPermission('admin', 'view_dashboard')).toBe(true)
  })

  it('read_only cannot execute cutover', () => {
    expect(roleHasPermission('read_only', 'execute_cutover')).toBe(false)
  })

  it('read_only can view dashboard', () => {
    expect(roleHasPermission('read_only', 'view_dashboard')).toBe(true)
  })

  it('encargado can create purchases', () => {
    expect(roleHasPermission('encargado', 'create_purchases')).toBe(true)
  })

  it('encargado cannot manage roles', () => {
    expect(roleHasPermission('encargado', 'manage_roles')).toBe(false)
  })

  it('supervisor can approve opening balances', () => {
    expect(roleHasPermission('supervisor', 'approve_opening_balances')).toBe(true)
  })

  it('supervisor cannot execute cutover', () => {
    expect(roleHasPermission('supervisor', 'execute_cutover')).toBe(false)
  })
})

describe('roleLevelAtLeast', () => {
  it('admin is at least supervisor', () => {
    expect(roleLevelAtLeast('admin', 'supervisor')).toBe(true)
  })

  it('supervisor is not at least admin', () => {
    expect(roleLevelAtLeast('supervisor', 'admin')).toBe(false)
  })

  it('encargado is at least read_only', () => {
    expect(roleLevelAtLeast('encargado', 'read_only')).toBe(true)
  })
})

describe('minimumRoleForPermission', () => {
  it('view_dashboard is available to read_only', () => {
    expect(minimumRoleForPermission('view_dashboard')).toBe('read_only')
  })

  it('execute_cutover requires admin', () => {
    expect(minimumRoleForPermission('execute_cutover')).toBe('admin')
  })

  it('create_purchases requires encargado', () => {
    expect(minimumRoleForPermission('create_purchases')).toBe('encargado')
  })

  it('approve_opening_balances requires supervisor', () => {
    expect(minimumRoleForPermission('approve_opening_balances')).toBe('supervisor')
  })
})

describe('ROLE_PERMISSIONS consistency', () => {
  it('higher roles always include lower role permissions', () => {
    const roles: RoleName[] = ['read_only', 'encargado', 'supervisor', 'admin']
    for (let i = 0; i < roles.length - 1; i++) {
      const lowerRole = roles[i]
      const higherRole = roles[i + 1]
      const lowerPerms = ROLE_PERMISSIONS[lowerRole] as Permission[]
      for (const perm of lowerPerms) {
        if (!roleHasPermission(higherRole, perm)) {
          throw new Error(`${higherRole} missing permission ${perm} that ${lowerRole} has`)
        }
      }
    }
  })
})
