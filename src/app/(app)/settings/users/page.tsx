import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/session'
import { canManageUsers } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import { UsersPageClient } from './users-client'

export const metadata: Metadata = { title: 'Usuarios' }

export default async function UsersPage() {
  const session = await requireSession()

  // Only admins can manage users
  if (!canManageUsers(session.user.role)) {
    redirect('/settings')
  }

  const supabase = await createServerSupabaseClient()

  const [usersRes, locationsRes, rolesRes] = await Promise.all([
    supabase
      .from('users')
      .select(`
        id, email, full_name, role, avatar_url, is_active, last_login_at, created_at,
        user_locations(location_id, is_primary, role,
          location:locations(id, name, color)
        )
      `)
      .order('full_name'),

    supabase
      .from('locations')
      .select('id, name, color')
      .eq('is_active', true)
      .order('sort_order'),

    supabase
      .from('roles')
      .select('*')
      .order('name'),
  ])

  return (
    <UsersPageClient
      currentUser={session.user}
      users={usersRes.data as any ?? []}
      locations={locationsRes.data ?? []}
      roles={rolesRes.data ?? []}
    />
  )
}
