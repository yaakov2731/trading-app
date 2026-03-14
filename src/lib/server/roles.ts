/**
 * lib/server/roles.ts
 * Server-side role queries — returns role list for admin UIs.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface RoleRow {
  id: string
  name: string
  display_name: string
  description: string | null
}

export async function getRoles(): Promise<RoleRow[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('roles')
    .select('id, name, display_name, description')
    .order('name')

  if (error) throw new Error(error.message)
  return (data ?? []) as RoleRow[]
}

export async function getRoleByName(name: string): Promise<RoleRow | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('roles')
    .select('id, name, display_name, description')
    .eq('name', name)
    .single()

  if (error) return null
  return data as RoleRow
}
