'use client'

import * as React from 'react'
import { Users, UserPlus, Shield, MapPin, CheckCircle, XCircle, MoreHorizontal } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate, formatTimeAgo } from '@/lib/utils/format'
import { ROLE_LABELS, type UserRole } from '@/lib/auth/permissions'
import { cn } from '@/lib/utils/cn'
import type { AppUser } from '@/lib/auth/session'

// =============================================================================
// Users Management Page — premium table with role/location badges
// (Create/Edit modals are Phase 2 stubs)
// =============================================================================

const ROLE_BADGE_VARIANT: Record<UserRole, any> = {
  admin:      'danger',
  supervisor: 'warning',
  encargado:  'primary',
  read_only:  'default',
}

interface UserRow {
  id:             string
  email:          string
  full_name:      string
  role:           UserRole
  avatar_url:     string | null
  is_active:      boolean
  last_login_at:  string | null
  created_at:     string
  user_locations: Array<{
    location_id: string
    is_primary:  boolean
    role:        string
    location:    { id: string; name: string; color: string } | null
  }>
}

interface Props {
  currentUser: AppUser
  users:       UserRow[]
  locations:   Array<{ id: string; name: string; color: string }>
  roles:       any[]
}

export function UsersPageClient({ currentUser, users, locations, roles }: Props) {
  const [search, setSearch] = React.useState('')

  const filtered = users.filter(u => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      ROLE_LABELS[u.role].toLowerCase().includes(q)
    )
  })

  const activeCount   = users.filter(u => u.is_active).length
  const inactiveCount = users.length - activeCount

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-400">
            {activeCount} activos · {inactiveCount} inactivos
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<UserPlus size={14} />}
          onClick={() => alert('STUB: Invite user modal — Phase 2')}
        >
          Invitar usuario
        </Button>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([role, label]) => {
          const count = users.filter(u => u.role === role).length
          return (
            <Card key={role} padding="sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-2xl font-bold text-slate-900">{count}</p>
                </div>
                <div className={cn(
                  'h-9 w-9 rounded-xl flex items-center justify-center',
                  role === 'admin'      ? 'bg-danger-50' :
                  role === 'supervisor' ? 'bg-amber-50' :
                  role === 'encargado'  ? 'bg-brand-50' :
                  'bg-slate-100'
                )}>
                  <Shield size={16} className={cn(
                    role === 'admin'      ? 'text-danger-500' :
                    role === 'supervisor' ? 'text-amber-500' :
                    role === 'encargado'  ? 'text-brand-500' :
                    'text-slate-400'
                  )} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* ── Search ───────────────────────────────────────────────────────── */}
      <Input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por nombre, email o rol..."
        className="max-w-sm"
      />

      {/* ── User list ────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
        <div className="divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Users size={28} className="text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Sin resultados</p>
            </div>
          ) : (
            filtered.map(user => (
              <UserRow
                key={user.id}
                user={user}
                isCurrentUser={user.id === currentUser.id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── Single user row ───────────────────────────────────────────────────────────

function UserRow({ user, isCurrentUser }: { user: UserRow; isCurrentUser: boolean }) {
  const userLocations = user.user_locations?.filter(ul => ul.location) ?? []

  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
      {/* Avatar */}
      <div className={cn(
        'h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold',
        user.is_active ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-400'
      )}>
        {user.full_name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-900">{user.full_name}</p>
          {isCurrentUser && (
            <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">Tú</span>
          )}
          <Badge variant={ROLE_BADGE_VARIANT[user.role]} size="sm">
            {ROLE_LABELS[user.role]}
          </Badge>
          {!user.is_active && (
            <Badge variant="default" size="sm">Inactivo</Badge>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
        {/* Location pills */}
        {userLocations.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {userLocations.slice(0, 4).map(ul => ul.location && (
              <div key={ul.location_id} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ul.location.color }} />
                <span className="text-xs text-slate-500">{ul.location.name}</span>
              </div>
            ))}
            {userLocations.length > 4 && (
              <span className="text-xs text-slate-400 px-1.5 py-0.5">+{userLocations.length - 4} más</span>
            )}
          </div>
        )}
      </div>

      {/* Last login */}
      <div className="hidden sm:block text-right flex-shrink-0">
        <p className="text-xs text-slate-400">Último acceso</p>
        <p className="text-xs font-medium text-slate-600">
          {user.last_login_at ? formatTimeAgo(user.last_login_at) : 'Nunca'}
        </p>
      </div>

      {/* Status indicator */}
      <div className="flex-shrink-0">
        {user.is_active
          ? <CheckCircle size={16} className="text-success-400" />
          : <XCircle size={16} className="text-slate-300" />
        }
      </div>

      {/* Actions (stub) */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-slate-300 hover:text-slate-600 flex-shrink-0"
        onClick={() => alert('STUB: Edit user modal — Phase 2')}
      >
        <MoreHorizontal size={15} />
      </Button>
    </div>
  )
}
