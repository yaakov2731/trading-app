/**
 * lib/server/migration-review.ts
 * Review queue: fetch, approve, reject, skip imported rows.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/session'
import type { ReviewRowActionInput, BulkReviewActionInput, ReviewFilterInput } from '@/lib/validations/migration'
import type { ImportedRow } from './migration-import'

export interface ReviewRow extends ImportedRow {
  import_filename: string | null
}

export interface ReviewListResult {
  rows: ReviewRow[]
  total: number
  hasMore: boolean
}

export async function getReviewRows(filter: Partial<ReviewFilterInput> = {}): Promise<ReviewListResult> {
  const { import_run_id, location_id, status, issue_type, page = 1, page_size = 50 } = filter
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('migration_import_rows')
    .select(
      `*, run:migration_import_runs(filename)`,
      { count: 'exact' }
    )

  if (import_run_id) query = query.eq('import_run_id', import_run_id)
  if (location_id) query = query.eq('matched_location_id', location_id)
  if (status) query = query.eq('status', status)
  else query = query.in('status', ['needs_review', 'pending'])

  if (issue_type) {
    // Filter rows where issues array contains given code
    query = query.contains('issues' as never, [{ code: issue_type }] as never)
  }

  const from = (page - 1) * page_size
  const { data, error, count } = await query
    .order('row_number')
    .range(from, from + page_size - 1)

  if (error) throw new Error(error.message)

  const rows = (data ?? []).map((r) => ({
    ...r,
    import_filename: (r.run as { filename: string } | null)?.filename ?? null,
  })) as ReviewRow[]

  return { rows, total: count ?? 0, hasMore: (count ?? 0) > from + page_size }
}

export async function applyRowAction(input: ReviewRowActionInput): Promise<void> {
  const session = await requireSession()
  const supabase = await createServerSupabaseClient()

  const statusMap: Record<string, string> = {
    approve: 'matched',
    reject: 'failed',
    skip: 'skipped',
  }

  const patch: Record<string, unknown> = {
    status: statusMap[input.action] ?? 'skipped',
  }

  if (input.override_product_id) patch.matched_product_id = input.override_product_id
  if (input.override_location_id) patch.matched_location_id = input.override_location_id
  if (input.notes) {
    patch.error_message = input.action === 'reject' ? input.notes : null
  }

  const { error } = await supabase
    .from('migration_import_rows')
    .update(patch)
    .eq('id', input.row_id)

  if (error) throw new Error(error.message)
}

export async function applyBulkRowAction(input: BulkReviewActionInput): Promise<{ updated: number }> {
  await requireSession()
  const supabase = await createServerSupabaseClient()

  const statusMap: Record<string, string> = {
    approve: 'matched',
    reject: 'failed',
    skip: 'skipped',
  }

  const { error, count } = await supabase
    .from('migration_import_rows')
    .update({ status: statusMap[input.action] })
    .in('id', input.row_ids)

  if (error) throw new Error(error.message)
  return { updated: count ?? input.row_ids.length }
}

export async function getReviewIssueCodes(importRunId?: string): Promise<string[]> {
  const supabase = await createServerSupabaseClient()
  // Fetch distinct issue codes from rows
  let query = supabase
    .from('migration_import_rows')
    .select('issues')
    .in('status', ['needs_review', 'pending'])

  if (importRunId) query = query.eq('import_run_id', importRunId)

  const { data } = await query.limit(500)
  const codes = new Set<string>()

  for (const row of data ?? []) {
    for (const issue of (row.issues as Array<{ code: string }>) ?? []) {
      if (issue.code) codes.add(issue.code)
    }
  }

  return Array.from(codes).sort()
}
