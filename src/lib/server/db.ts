/**
 * lib/server/db.ts
 * Low-level DB helpers — typed wrappers around Supabase client for server use.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types'

export type DbClient = SupabaseClient<Database>

/**
 * Returns an authenticated server Supabase client.
 * Use this inside server actions and route handlers.
 */
export async function getDb(): Promise<DbClient> {
  return createServerSupabaseClient() as unknown as DbClient
}

/**
 * Generic single-row fetch with typed result.
 * Throws if the row is not found.
 */
export async function fetchOne<T>(
  db: DbClient,
  table: string,
  id: string,
  select = '*'
): Promise<T> {
  const { data, error } = await (db as SupabaseClient)
    .from(table)
    .select(select)
    .eq('id', id)
    .single()

  if (error || !data) {
    throw new Error(`${table}/${id} not found: ${error?.message ?? 'no data'}`)
  }

  return data as T
}

/**
 * Generic paginated fetch.
 * Returns { data, count, hasMore }.
 */
export async function fetchPaginated<T>(
  db: DbClient,
  table: string,
  {
    select = '*',
    filters = [] as Array<{ column: string; op: string; value: unknown }>,
    orderBy = 'created_at',
    ascending = false,
    page = 1,
    pageSize = 50,
  } = {}
): Promise<{ data: T[]; count: number; hasMore: boolean }> {
  let query = (db as SupabaseClient)
    .from(table)
    .select(select, { count: 'exact' })

  for (const f of filters) {
    query = (query as ReturnType<typeof query.eq>)[f.op as 'eq'](f.column, f.value)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .order(orderBy, { ascending })
    .range(from, to)

  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as T[],
    count: count ?? 0,
    hasMore: (count ?? 0) > to + 1,
  }
}

/**
 * Soft-delete helper: sets is_active = false.
 */
export async function softDelete(
  db: DbClient,
  table: string,
  id: string
): Promise<void> {
  const { error } = await (db as SupabaseClient)
    .from(table)
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
