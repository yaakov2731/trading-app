/**
 * components/settings/role-permissions-matrix.tsx
 * Visual permissions matrix — roles as columns, grouped permissions as rows.
 */

import { PERMISSION_LABELS, type Permission, type RoleName } from '@/lib/constants/permissions'

interface RolePermissionsMatrixProps {
  groups: Record<string, Permission[]>
  rolePermissions: Record<RoleName, readonly Permission[]>
}

const ROLE_DISPLAY: Record<RoleName, { label: string; color: string }> = {
  admin:      { label: 'Admin', color: 'text-red-400' },
  supervisor: { label: 'Supervisor', color: 'text-brand-400' },
  encargado:  { label: 'Encargado', color: 'text-emerald-400' },
  read_only:  { label: 'Lectura', color: 'text-slate-400' },
}

const ROLES: RoleName[] = ['admin', 'supervisor', 'encargado', 'read_only']

function Check({ has }: { has: boolean }) {
  if (has) {
    return (
      <div className="flex justify-center">
        <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center">
          <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
    )
  }
  return (
    <div className="flex justify-center">
      <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center">
        <span className="text-slate-600 text-xs">—</span>
      </div>
    </div>
  )
}

export default function RolePermissionsMatrix({
  groups,
  rolePermissions,
}: RolePermissionsMatrixProps) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-64">
                Permiso
              </th>
              {ROLES.map((role) => (
                <th key={role} className="px-4 py-3 text-center">
                  <span className={`text-sm font-semibold ${ROLE_DISPLAY[role].color}`}>
                    {ROLE_DISPLAY[role].label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(groups).map(([groupName, permissions]) => (
              <>
                <tr key={`group-${groupName}`}>
                  <td colSpan={5} className="px-4 py-2 bg-slate-800/50">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {groupName}
                    </span>
                  </td>
                </tr>
                {permissions.map((perm) => (
                  <tr key={perm} className="border-t border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-2.5 text-slate-300 text-sm">
                      {PERMISSION_LABELS[perm]}
                    </td>
                    {ROLES.map((role) => (
                      <td key={role} className="px-4 py-2.5">
                        <Check has={(rolePermissions[role] as readonly Permission[]).includes(perm)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: accordion by role */}
      <div className="sm:hidden divide-y divide-slate-800">
        {ROLES.map((role) => (
          <details key={role} className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
              <span className={`font-semibold ${ROLE_DISPLAY[role].color}`}>
                {ROLE_DISPLAY[role].label}
              </span>
              <span className="text-xs text-slate-500">
                {(rolePermissions[role] as readonly Permission[]).length} permisos
              </span>
            </summary>
            <div className="pb-4 px-4 space-y-1">
              {Object.entries(groups).map(([groupName, perms]) => (
                <div key={groupName}>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-3 mb-1">
                    {groupName}
                  </p>
                  {perms.map((perm) => {
                    const has = (rolePermissions[role] as readonly Permission[]).includes(perm)
                    return (
                      <div key={perm} className="flex items-center gap-2 py-0.5">
                        {has ? (
                          <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 text-center text-xs">—</span>
                        )}
                        <span className={`text-sm ${has ? 'text-slate-300' : 'text-slate-600'}`}>
                          {PERMISSION_LABELS[perm]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
