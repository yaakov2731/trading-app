/**
 * app/(app)/settings/roles/page.tsx
 * Role permissions matrix — informational for MVP, editable later.
 */

import Link from 'next/link'
import RolePermissionsMatrix from '@/components/settings/role-permissions-matrix'
import { PERMISSION_GROUPS, ROLE_PERMISSIONS, type RoleName } from '@/lib/constants/permissions'

export default function RolesSettingsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Roles y permisos</h1>
              <p className="text-sm text-slate-400">
                Matriz de permisos por rol. Edición disponible en versiones futuras.
              </p>
            </div>
          </div>
        </div>

        {/* Role summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            { role: 'admin', label: 'Administrador', color: 'text-red-400 bg-red-500/10 border-red-500/20', desc: 'Acceso completo al sistema' },
            { role: 'supervisor', label: 'Supervisor', color: 'text-brand-400 bg-brand-500/10 border-brand-500/20', desc: 'Gestión operativa completa' },
            { role: 'encargado', label: 'Encargado', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', desc: 'Operaciones de local' },
            { role: 'read_only', label: 'Solo lectura', color: 'text-slate-400 bg-slate-700/50 border-slate-600/50', desc: 'Consulta sin modificaciones' },
          ] as const).map((r) => (
            <div key={r.role} className={`p-4 rounded-xl border ${r.color}`}>
              <p className="font-semibold text-sm">{r.label}</p>
              <p className="text-xs opacity-70 mt-1">{r.desc}</p>
              <p className="text-xs mt-2 opacity-80">
                {(ROLE_PERMISSIONS[r.role as RoleName] as readonly string[]).length} permisos
              </p>
            </div>
          ))}
        </div>

        {/* Permissions matrix */}
        <RolePermissionsMatrix groups={PERMISSION_GROUPS} rolePermissions={ROLE_PERMISSIONS} />

        {/* Note */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <p className="text-xs text-slate-500">
            📌 Esta página muestra la configuración actual de permisos por rol.
            La asignación de permisos individuales a usuarios estará disponible en una versión futura.
            Actualmente los permisos son fijos por tipo de rol.
          </p>
        </div>
      </div>
    </div>
  )
}
