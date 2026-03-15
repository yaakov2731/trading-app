/**
 * lib/server/migration-import.ts
 * Creates and manages import runs; stores raw + parsed rows.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/session'
import { parseLegacyRows, detectImportType } from './legacy-parser'
import type { ImportPayloadInput } from '@/lib/validations/migration'

export interface ImportRunRow {
  id: string
  filename: string
  source_type: string
  import_type: string
  status: string
  total_rows: number
  processed: number
  succeeded: number
  failed: number
  needs_review: number
  error_summary: Record<string, unknown> | null
  started_by: string | null
  started_by_name: string | null
  started_at: string
  completed_at: string | null
  notes: string | null
}

export interface ImportRunDetail extends ImportRunRow {
  rows: ImportedRow[]
}

export interface ImportedRow {
  id: string
  import_run_id: string
  row_number: number
  raw_data: Record<string, unknown>
  parsed_data: Record<string, unknown> | null
  status: string
  confidence: string | null
  issues: Array<{ field: string; code: string; message: string; severity: string }>
  matched_product_id: string | null
  matched_location_id: string | null
  error_message: string | null
  source_sheet: string | null
  location_raw: string | null
  snapshot_datetime: string | null
  created_at: string
}

export async function createImportRun(
  input: ImportPayloadInput
): Promise<{ run_id: string; summary: ImportSummary }> {
  const session = await requireSession()
  const supabase = await createServerSupabaseClient()

  const importType = input.import_type === 'mixed'
    ? (input.rows.length > 0 ? detectImportType(input.rows[0] as Record<string, unknown>) : 'snapshot')
    : input.import_type

  // Create run record
  const { data: run, error: runError } = await supabase
    .from('migration_import_runs')
    .insert({
      filename: input.filename,
      source_type: input.source_type,
      status: 'running',
      total_rows: input.rows.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      started_by: session.user.id,
      started_at: new Date().toISOString(),
      error_summary: { import_type: importType, notes: input.notes ?? null },
    } as Record<string, unknown>)
    .select('id')
    .single()

  if (runError) throw new Error(runError.message)

  // Parse all rows
  const parsedRows = parseLegacyRows(input.rows as Record<string, unknown>[], {
    importType: input.import_type,
    sourceSheet: input.source_sheet,
    locationRaw: input.location_id, // location_id is used as context
  })

  // Determine status per row
  const summary: ImportSummary = {
    total: parsedRows.length,
    needs_review: 0,
    approved: 0,
    rejected: 0,
    failed: 0,
  }

  const rowInserts: Record<string, unknown>[] = parsedRows.map((parsed, idx) => {
    const hasErrors = parsed.issues.some((i) => i.severity === 'error')
    const hasWarnings = parsed.issues.some((i) => i.severity === 'warning')

    const status = hasErrors ? 'needs_review' : hasWarnings ? 'needs_review' : 'matched'

    if (status === 'needs_review') summary.needs_review++
    else summary.approved++

    const snapshotData = parsed.type === 'snapshot' ? parsed : null

    return {
      import_run_id: run.id,
      row_number: idx + 1,
      raw_data: parsed.rawData,
      parsed_data: parsed as unknown as Record<string, unknown>,
      status,
      confidence: parsed.confidence,
      issues: parsed.issues,
      matched_product_id: null,
      matched_location_id: input.location_id ?? null,
      error_message: hasErrors ? parsed.issues.filter((i) => i.severity === 'error').map((i) => i.message).join('; ') : null,
      source_sheet: input.source_sheet ?? null,
      location_raw: snapshotData?.locationRaw ?? null,
      snapshot_datetime: snapshotData?.snapshotDatetime ?? null,
    }
  })

  // Batch insert rows (chunked to avoid request size limits)
  const CHUNK_SIZE = 200
  for (let i = 0; i < rowInserts.length; i += CHUNK_SIZE) {
    const chunk = rowInserts.slice(i, i + CHUNK_SIZE)
    const { error: rowsError } = await supabase.from('migration_import_rows').insert(chunk)
    if (rowsError) throw new Error(`Failed to insert rows at chunk ${i}: ${rowsError.message}`)
  }

  // Mark run complete
  await supabase
    .from('migration_import_runs')
    .update({
      status: summary.failed === parsedRows.length ? 'failed' : summary.needs_review > 0 ? 'partial' : 'completed',
      processed: parsedRows.length,
      succeeded: summary.approved,
      failed: summary.failed,
      completed_at: new Date().toISOString(),
      error_summary: {
        import_type: importType,
        needs_review: summary.needs_review,
        notes: input.notes ?? null,
      },
    } as Record<string, unknown>)
    .eq('id', run.id)

  return { run_id: run.id, summary }
}

export interface ImportSummary {
  total: number
  needs_review: number
  approved: number
  rejected: number
  failed: number
}

export async function getImportRuns(): Promise<ImportRunRow[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('migration_import_runs')
    .select(
      `id, filename, source_type, status, total_rows, processed,
       succeeded, failed, error_summary, started_by, started_at, completed_at,
       starter:users!migration_import_runs_started_by_fkey(full_name)`
    )
    .order('started_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((r) => ({
    id: r.id,
    filename: r.filename,
    source_type: r.source_type,
    import_type: (r.error_summary as Record<string, unknown>)?.import_type as string ?? 'snapshot',
    status: r.status,
    total_rows: r.total_rows,
    processed: r.processed,
    succeeded: r.succeeded,
    failed: r.failed,
    needs_review: ((r.error_summary as Record<string, unknown>)?.needs_review as number) ?? 0,
    error_summary: r.error_summary as Record<string, unknown> | null,
    started_by: r.started_by,
    started_by_name: (r.starter as { full_name: string } | null)?.full_name ?? null,
    started_at: r.started_at,
    completed_at: r.completed_at,
    notes: ((r.error_summary as Record<string, unknown>)?.notes as string) ?? null,
  })) as ImportRunRow[]
}

export async function getImportRunById(id: string): Promise<ImportRunRow | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('migration_import_runs')
    .select(`id, filename, source_type, status, total_rows, processed, succeeded, failed,
             error_summary, started_by, started_at, completed_at,
             starter:users!migration_import_runs_started_by_fkey(full_name)`)
    .eq('id', id)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    filename: data.filename,
    source_type: data.source_type,
    import_type: (data.error_summary as Record<string, unknown>)?.import_type as string ?? 'snapshot',
    status: data.status,
    total_rows: data.total_rows,
    processed: data.processed,
    succeeded: data.succeeded,
    failed: data.failed,
    needs_review: ((data.error_summary as Record<string, unknown>)?.needs_review as number) ?? 0,
    error_summary: data.error_summary as Record<string, unknown> | null,
    started_by: data.started_by,
    started_by_name: (data.starter as { full_name: string } | null)?.full_name ?? null,
    started_at: data.started_at,
    completed_at: data.completed_at,
    notes: null,
  }
}

export async function getImportedRows(
  runId: string,
  opts: { status?: string; page?: number; pageSize?: number } = {}
): Promise<{ rows: ImportedRow[]; total: number }> {
  const { status, page = 1, pageSize = 50 } = opts
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('migration_import_rows')
    .select('*', { count: 'exact' })
    .eq('import_run_id', runId)

  if (status) query = query.eq('status', status)

  const from = (page - 1) * pageSize
  const { data, error, count } = await query
    .order('row_number')
    .range(from, from + pageSize - 1)

  if (error) throw new Error(error.message)

  return {
    rows: (data ?? []) as unknown as ImportedRow[],
    total: count ?? 0,
  }
}
