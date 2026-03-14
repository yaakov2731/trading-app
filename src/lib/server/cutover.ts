/**
 * lib/server/cutover.ts
 * Cutover execution: approved opening balance candidates → opening_stock movements.
 * Idempotent, audited, dry-run safe. Never touches historical movement fabrication.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/server/auth-guards'
import type { ExecuteCutoverInput } from '@/lib/validations/migration'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CutoverResult {
  dry_run: boolean
  total_candidates: number
  applied: number
  skipped_already_applied: number
  skipped_unresolved: number
  failed: number
  errors: string[]
  movement_ids: string[]
}

export interface CutoverStatus {
  has_run: boolean
  applied_count: number
  last_run_at: string | null
  last_run_by: string | null
  last_run_notes: string | null
  can_rollback: boolean
}

// ── Idempotency key ───────────────────────────────────────────────────────────

function cutoverIdempotencyKey(candidateId: string): string {
  return `cutover-opening-${candidateId}`
}

// ── Execute cutover ───────────────────────────────────────────────────────────

/**
 * Converts all 'approved' opening balance candidates into opening_stock movements.
 * Each candidate creates exactly one stock movement (idempotency enforced via key).
 * Marks candidates as 'applied' on success.
 * Dry-run mode performs all checks without committing any data.
 */
export async function executeCutover(
  input: ExecuteCutoverInput
): Promise<CutoverResult> {
  const session = await requireAdmin()
  const supabase = await createServerSupabaseClient()

  const result: CutoverResult = {
    dry_run: input.dry_run,
    total_candidates: 0,
    applied: 0,
    skipped_already_applied: 0,
    skipped_unresolved: 0,
    failed: 0,
    errors: [],
    movement_ids: [],
  }

  // Fetch all approved candidates with resolved product + location
  const { data: candidates, error: fetchErr } = await supabase
    .from('migration_opening_balance_candidates')
    .select('*')
    .in('status', ['approved'])
    .not('matched_product_id', 'is', null)
    .not('matched_location_id', 'is', null)

  if (fetchErr) throw new Error(fetchErr.message)
  if (!candidates || candidates.length === 0) return result

  result.total_candidates = candidates.length

  for (const candidate of candidates) {
    const productId = candidate.override_product_id ?? candidate.matched_product_id
    const locationId = candidate.override_location_id ?? candidate.matched_location_id
    const quantity = candidate.override_quantity ?? candidate.quantity
    const idempotencyKey = cutoverIdempotencyKey(candidate.id)

    if (!productId || !locationId) {
      result.skipped_unresolved++
      continue
    }

    // Check for already-applied idempotency key
    const { data: existing } = await supabase
      .from('stock_movements')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .single()

    if (existing) {
      result.skipped_already_applied++
      continue
    }

    if (input.dry_run) {
      // In dry-run, just count what would happen
      result.applied++
      continue
    }

    // Create opening_stock movement via RPC
    const { data: movResult, error: movErr } = await supabase.rpc('record_movement', {
      p_product_id: productId,
      p_location_id: locationId,
      p_movement_type: 'opening_stock',
      p_quantity: quantity,
      p_unit_cost: null,
      p_reference_id: candidate.import_run_id,
      p_reference_type: 'migration_cutover',
      p_notes: input.notes
        ? `Cutover: ${input.notes}`
        : `Saldo inicial migración — candidato ${candidate.id}`,
      p_performed_by: session.user.id,
      p_idempotency_key: idempotencyKey,
    })

    if (movErr) {
      result.failed++
      result.errors.push(`Candidate ${candidate.id}: ${movErr.message}`)
      continue
    }

    // Mark candidate as applied
    await supabase
      .from('migration_opening_balance_candidates')
      .update({
        status: 'applied',
        resolved_at: new Date().toISOString(),
        resolved_by: session.user.id,
      })
      .eq('id', candidate.id)

    if (movResult) result.movement_ids.push(movResult as string)
    result.applied++
  }

  // Record cutover audit log
  if (!input.dry_run && result.applied > 0) {
    await supabase.from('migration_cutover_log').insert({
      executed_by: session.user.id,
      executed_at: new Date().toISOString(),
      dry_run: false,
      applied_count: result.applied,
      failed_count: result.failed,
      skipped_count: result.skipped_already_applied + result.skipped_unresolved,
      notes: input.notes ?? null,
      result_summary: result as unknown as Record<string, unknown>,
    })
  }

  return result
}

// ── Cutover status ────────────────────────────────────────────────────────────

export async function getCutoverStatus(): Promise<CutoverStatus> {
  const supabase = await createServerSupabaseClient()

  const { data: log } = await supabase
    .from('migration_cutover_log')
    .select('*')
    .eq('dry_run', false)
    .order('executed_at', { ascending: false })
    .limit(1)
    .single()

  const { count: appliedCount } = await supabase
    .from('migration_opening_balance_candidates')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'applied')

  const hasRun = !!log

  return {
    has_run: hasRun,
    applied_count: appliedCount ?? 0,
    last_run_at: log?.executed_at ?? null,
    last_run_by: log?.executed_by ?? null,
    last_run_notes: log?.notes ?? null,
    can_rollback: hasRun && (appliedCount ?? 0) > 0,
  }
}

// ── Rollback ──────────────────────────────────────────────────────────────────

/**
 * Rolls back a cutover by deleting the opening_stock movements and
 * resetting candidates back to 'approved'.
 * Only available to admins. Only works if cutover has run.
 */
export async function rollbackCutover(notes?: string): Promise<{
  deleted_movements: number
  reset_candidates: number
  errors: string[]
}> {
  const session = await requireAdmin()
  const supabase = await createServerSupabaseClient()

  const errors: string[] = []

  // Find all movements with cutover idempotency keys
  const { data: movements, error: movFetchErr } = await supabase
    .from('stock_movements')
    .select('id, idempotency_key')
    .like('idempotency_key', 'cutover-opening-%')
    .eq('movement_type', 'opening_stock')

  if (movFetchErr) throw new Error(movFetchErr.message)
  if (!movements || movements.length === 0) {
    return { deleted_movements: 0, reset_candidates: 0, errors: [] }
  }

  // Extract candidate IDs from idempotency keys
  const candidateIds = movements
    .map((m) => m.idempotency_key?.replace('cutover-opening-', ''))
    .filter(Boolean) as string[]

  // Delete movements
  const movementIds = movements.map((m) => m.id)
  const { error: delMovErr } = await supabase
    .from('stock_movements')
    .delete()
    .in('id', movementIds)

  if (delMovErr) {
    errors.push(`Delete movements: ${delMovErr.message}`)
    return { deleted_movements: 0, reset_candidates: 0, errors }
  }

  // Reset candidates to 'approved'
  const { error: resetErr, count: resetCount } = await supabase
    .from('migration_opening_balance_candidates')
    .update({ status: 'approved' })
    .in('id', candidateIds)

  if (resetErr) {
    errors.push(`Reset candidates: ${resetErr.message}`)
  }

  // Log rollback
  await supabase.from('migration_cutover_log').insert({
    executed_by: session.user.id,
    executed_at: new Date().toISOString(),
    dry_run: false,
    applied_count: -(movementIds.length),
    failed_count: 0,
    skipped_count: 0,
    notes: notes ? `ROLLBACK: ${notes}` : 'ROLLBACK',
    result_summary: {
      action: 'rollback',
      deleted_movements: movementIds.length,
      reset_candidates: resetCount ?? candidateIds.length,
    } as Record<string, unknown>,
  })

  return {
    deleted_movements: movementIds.length,
    reset_candidates: resetCount ?? candidateIds.length,
    errors,
  }
}

// ── Pre-flight checks ─────────────────────────────────────────────────────────

export interface CutoverPreflight {
  ok: boolean
  approved_ready: number
  unresolved_product: number
  unresolved_location: number
  warnings: string[]
  blocking_errors: string[]
}

export async function runCutoverPreflight(): Promise<CutoverPreflight> {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('migration_opening_balance_candidates')
    .select('matched_product_id, matched_location_id, status, confidence')
    .in('status', ['approved', 'pending'])
    .limit(5000)

  const approved = (data ?? []).filter((r) => r.status === 'approved')
  const unresolvedProduct = approved.filter((r) => !r.matched_product_id).length
  const unresolvedLocation = approved.filter((r) => !r.matched_location_id).length
  const pendingCount = (data ?? []).filter((r) => r.status === 'pending').length

  const warnings: string[] = []
  const blockingErrors: string[] = []

  if (pendingCount > 0) {
    warnings.push(`${pendingCount} candidatos aún están en estado "pendiente"`)
  }
  if (unresolvedProduct > 0) {
    blockingErrors.push(`${unresolvedProduct} candidatos aprobados sin producto vinculado`)
  }
  if (unresolvedLocation > 0) {
    blockingErrors.push(`${unresolvedLocation} candidatos aprobados sin ubicación vinculada`)
  }

  const readyToApply = approved.filter(
    (r) => r.matched_product_id && r.matched_location_id
  ).length

  if (readyToApply === 0) {
    blockingErrors.push('No hay candidatos listos para aplicar')
  }

  return {
    ok: blockingErrors.length === 0,
    approved_ready: readyToApply,
    unresolved_product: unresolvedProduct,
    unresolved_location: unresolvedLocation,
    warnings,
    blocking_errors: blockingErrors,
  }
}
