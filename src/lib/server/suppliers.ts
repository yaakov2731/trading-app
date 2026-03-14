/**
 * lib/server/suppliers.ts
 * Supplier CRUD — server-side service layer.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { CreateSupplierInput, UpdateSupplierInput, SupplierFilterInput } from '@/lib/validations/suppliers'

export interface SupplierRow {
  id: string
  code: string | null
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  tax_id: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // computed
  purchase_count?: number
}

export interface SupplierListResult {
  suppliers: SupplierRow[]
  total: number
  hasMore: boolean
}

export async function getSuppliers(
  filter: Partial<SupplierFilterInput> = {}
): Promise<SupplierListResult> {
  const { search, is_active, page = 1, page_size = 50 } = filter
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('suppliers')
    .select('id, code, name, contact_name, phone, email, tax_id, notes, is_active, created_at, updated_at', {
      count: 'exact',
    })

  if (is_active !== undefined) query = query.eq('is_active', is_active)
  if (search?.trim()) {
    const t = search.trim()
    query = query.or(`name.ilike.%${t}%,contact_name.ilike.%${t}%,phone.ilike.%${t}%`)
  }

  const from = (page - 1) * page_size
  const { data, error, count } = await query
    .order('name')
    .range(from, from + page_size - 1)

  if (error) throw new Error(error.message)

  return {
    suppliers: (data ?? []) as SupplierRow[],
    total: count ?? 0,
    hasMore: (count ?? 0) > from + page_size,
  }
}

export async function getSupplierById(id: string): Promise<SupplierRow | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, code, name, contact_name, phone, email, tax_id, notes, is_active, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as SupplierRow
}

export async function createSupplier(input: CreateSupplierInput): Promise<SupplierRow> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('suppliers')
    .insert({
      name: input.name,
      contact_name: input.contact_name ?? null,
      phone: input.phone ?? null,
      email: input.email || null,
      tax_id: input.tax_id ?? null,
      notes: input.notes ?? null,
      is_active: true,
    })
    .select('id, code, name, contact_name, phone, email, tax_id, notes, is_active, created_at, updated_at')
    .single()

  if (error) throw new Error(error.message)
  return data as SupplierRow
}

export async function updateSupplier(id: string, input: UpdateSupplierInput): Promise<SupplierRow> {
  const supabase = await createServerSupabaseClient()

  const patch: Record<string, unknown> = {}
  if (input.name !== undefined) patch.name = input.name
  if (input.contact_name !== undefined) patch.contact_name = input.contact_name ?? null
  if (input.phone !== undefined) patch.phone = input.phone ?? null
  if (input.email !== undefined) patch.email = input.email || null
  if (input.tax_id !== undefined) patch.tax_id = input.tax_id ?? null
  if (input.notes !== undefined) patch.notes = input.notes ?? null
  if (input.is_active !== undefined) patch.is_active = input.is_active

  const { data, error } = await supabase
    .from('suppliers')
    .update(patch)
    .eq('id', id)
    .select('id, code, name, contact_name, phone, email, tax_id, notes, is_active, created_at, updated_at')
    .single()

  if (error) throw new Error(error.message)
  return data as SupplierRow
}

export async function toggleSupplierActive(id: string, is_active: boolean): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('suppliers')
    .update({ is_active })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

/** Lightweight list for form selects — active suppliers only. */
export async function getActiveSupplierOptions(): Promise<Array<{ id: string; name: string; contact_name: string | null }>> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, name, contact_name')
    .eq('is_active', true)
    .order('name')

  if (error) throw new Error(error.message)
  return (data ?? []) as Array<{ id: string; name: string; contact_name: string | null }>
}
