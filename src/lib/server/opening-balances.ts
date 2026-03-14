/**
 * lib/server/opening-balances.ts
 * Derives opening balance candidates from latest trusted snapshot per SKU/location.
 * Never fabricates historical movements — only the most recent snapshot quantity is used.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/session'
import { resolveProduct, resolveLocation, resolveUnit } from './migration-mappings'
import type {
  ApproveOpeningBalanceInput,
  BulkApproveOpeningBalancesInput,
  OpeningBalanceFilterInput,
  ConfidenceLevel,
} from '@/lib/validations/migration'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OpeningBalanceCandidate {
  id: string
  import_run_id: string
  import_row_id: string | null
  sku: string | null
  product_name: string | null
  matched_product_id: string | null
  matched_product_name: string | null
  matched_product_sku: string | null
  location_raw: string | null
  matched_location_id: string | null
  matched_location_name: string | null
  quantity: number
  unit_raw: string | null
  matched_unit_id: string | null
  snapshot_datetime: string | null
  confidence: ConfidenceLevel
  status: 'pending' | 'approved' | 'excluded' | 'applied'
  override_quantity: number | null
  override_product_id: string | null
  override_location_id: string | null
  notes: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
}

export interface OpeningBalanceListResult {
  candidates: OpeningBalanceCandidate[]
  total: number
  hasMore: boolean
  stats: {
    pending: number
    approved: number
    excluded: number
    applied: number
    unresolved: number
  }
}

// ── Derive candidates from import rows ────────────────────────────────────────

/**
 * Builds opening balance candidates from matched snapshot rows.
 * For each SKU+location pair, picks the latest snapshot datetime.
 * Resolves product/location/unit via the mapping layer.
 */
export async function deriveOpeningBalanceCandidates(
  importRunId: string
): Promise<{ created: number; skipped: number; errors: string[] }> {
  const session = await requireSession()
  const supabase = await createServerSupabaseClient()

  // Fetch all snapshot rows from this run that have been matched/approved
  const { data: rows, error } = await supabase
    .from('migration_import_rows')
    .select('id, parsed_data, matched_product_id, matched_location_id')
    .eq('import_run_id', importRunId)
    .in('status', ['matched', 'approved'])

  if (error) throw new Error(error.message)
  if (!rows || rows.length === 0) return { created: 0, skipped: 0, errors: [] }

  // Group by SKU + location_raw and keep latest snapshot
  const latestByKey = new Map<
    string,
    {
      row_id: string
      parsed: Record<string, unknown>
      matched_product_id: string | null
      matched_location_id: string | null
    }
  >()

  for (const row of rows) {
    const parsed = row.parsed_data as Record<string, unknown>
    if (parsed?.type !== 'snapshot') continue

    const sku = (parsed.sku as string) ?? ''
    const locationRaw = (parsed.locationRaw as string) ?? ''
    const key = `${sku}|${locationRaw}`

    const existing = latestByKey.get(key)
    if (!existing) {
      latestByKey.set(key, {
        row_id: row.id,
        parsed,
        matched_product_id: row.matched_product_id,
        matched_location_id: row.matched_location_id,
      })
    } else {
      // Keep the most recent snapshot
      const existingDt = (existing.parsed.snapshotDatetime as string) ?? ''
      const newDt = (parsed.snapshotDatetime as string) ?? ''
      if (newDt > existingDt) {
        latestByKey.set(key, {
          row_id: row.id,
          parsed,
          matched_product_id: row.matched_product_id,
          matched_location_id: row.matched_location_id,
        })
      }
    }
  }

  let created = 0
  let skipped = 0
  const errors: string[] = []
  const inserts: Record<string, unknown>[] = []

  for (const [, entry] of latestByKey) {
    const { parsed, row_id, matched_product_id, matched_location_id } = entry

    const sku = parsed.sku as string | null
    const productName = parsed.productName as string | null
    const quantity = parsed.quantity as number | null
    const locationRaw = parsed.locationRaw as string | null
    const unitRaw = parsed.unitRaw as string | null
    const snapshotDatetime = parsed.snapshotDatetime as string | null

    if (quantity === null) {
      skipped++
      continue
    }

    // Resolve mappings (use already-resolved IDs when available)
    let productId = matched_product_id
    let locationId = matched_location_id
    let productConfidence: ConfidenceLevel = productId ? 'high' : 'unresolved'
    let locationConfidence: ConfidenceLevel = locationId ? 'high' : 'unresolved'

    if (!productId) {
      const pm = await resolveProduct(sku, productName)
      if (pm) {
        productId = pm.productId
        productConfidence = pm.confidence
      }
    }

    if (!locationId && locationRaw) {
      const lm = await resolveLocation(locationRaw)
      locationId = lm.locationId
      locationConfidence = lm.confidence
    }

    let unitId: string | null = null
    if (unitRaw) {
      const um = await resolveUnit(unitRaw)
      unitId = um.unitId
    }

    // Overall confidence = worst of product + location confidence
    const confOrder: ConfidenceLevel[] = ['high', 'medium', 'low', 'unresolved']
    const confIndex = Math.max(
      confOrder.indexOf(productConfidence),
      confOrder.indexOf(locationConfidence)
    )
    const confidence: ConfidenceLevel = confOrder[confIndex] ?? 'unresolved'

    // Check if candidate already exists for this row
    const { data: existing } = await supabase
      .from('migration_opening_balance_candidates')
      .select('id')
      .eq('import_row_id', row_id)
      .single()

    if (existing) {
      skipped++
      continue
    }

    inserts.push({
      import_run_id: importRunId,
      import_row_id: row_id,
      sku: sku ?? null,
      product_name: productName ?? null,
      matched_product_id: productId ?? null,
      location_raw: locationRaw ?? null,
      matched_location_id: locationId ?? null,
      quantity,
      unit_raw: unitRaw ?? null,
      matched_unit_id: unitId ?? null,
      snapshot_datetime: snapshotDatetime ?? null,
      confidence,
      status: 'pending',
      created_by: session.user.id,
    })

    created++
  }

  // Batch insert
  if (inserts.length > 0) {
    const CHUNK = 200
    for (let i = 0; i < inserts.length; i += CHUNK) {
      const { error: insertErr } = await supabase
        .from('migration_opening_balance_candidates')
        .insert(inserts.slice(i, i + CHUNK))
      if (insertErr) {
        errors.push(`Insert chunk ${i}: ${insertErr.message}`)
        created -= Math.min(CHUNK, inserts.length - i)
      }
    }
  }

  return { created, skipped, errors }
}

// ── List candidates ───────────────────────────────────────────────────────────

export async function getOpeningBalanceCandidates(
  filter: Partial<OpeningBalanceFilterInput> = {}
): Promise<OpeningBalanceListResult> {
  const {
    location_id,
    confidence,
    status,
    unresolved_only,
    page = 1,
    page_size = 100,
  } = filter

  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('migration_opening_balance_candidates')
    .select(
      `*,
       product:products!migration_opening_balance_candidates_matched_product_id_fkey(name, sku),
       location:locations!migration_opening_balance_candidates_matched_location_id_fkey(name)`,
      { count: 'exact' }
    )

  if (location_id) query = query.eq('matched_location_id', location_id)
  if (confidence) query = query.eq('confidence', confidence)
  if (status) query = query.eq('status', status)
  if (unresolved_only) query = query.is('matched_product_id', null)

  const from = (page - 1) * page_size
  const { data, error, count } = await query
    .order('confidence', { ascending: true })
    .order('created_at', { ascending: true })
    .range(from, from + page_size - 1)

  if (error) throw new Error(error.message)

  const candidates = (data ?? []).map((r) => ({
    ...r,
    matched_product_name: (r.product as { name: string } | null)?.name ?? null,
    matched_product_sku: (r.product as { sku: string } | null)?.sku ?? null,
    matched_location_name: (r.location as { name: string } | null)?.name ?? null,
  })) as OpeningBalanceCandidate[]

  // Stats (separate count query)
  const { data: statRows } = await supabase
    .from('migration_opening_balance_candidates')
    .select('status, confidence')
    .limit(5000)

  const stats = { pending: 0, approved: 0, excluded: 0, applied: 0, unresolved: 0 }
  for (const r of statRows ?? []) {
    if (r.status in stats) stats[r.status as keyof typeof stats]++
    if (r.confidence === 'unresolved') stats.unresolved++
  }

  return {
    candidates,
    total: count ?? 0,
    hasMore: (count ?? 0) > from + page_size,
    stats,
  }
}

// ── Single approve ────────────────────────────────────────────────────────────

export async function approveOpeningBalance(
  input: ApproveOpeningBalanceInput
): Promise<void> {
  const session = await requireSession()
  const supabase = await createServerSupabaseClient()

  const patch: Record<string, unknown> = {
    status: 'approved',
    resolved_by: session.user.id,
    resolved_at: new Date().toISOString(),
  }

  if (input.override_quantity !== undefined) patch.override_quantity = input.override_quantity
  if (input.override_product_id) patch.override_product_id = input.override_product_id
  if (input.override_location_id) patch.override_location_id = input.override_location_id
  if (input.notes) patch.notes = input.notes

  const { error } = await supabase
    .from('migration_opening_balance_candidates')
    .update(patch)
    .eq('id', input.candidate_id)
    .in('status', ['pending', 'excluded']) // only allow from pending/excluded

  if (error) throw new Error(error.message)
}

// ── Exclude candidate ─────────────────────────────────────────────────────────

export async function excludeOpeningBalance(
  candidateId: string,
  notes?: string
): Promise<void> {
  const session = await requireSession()
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('migration_opening_balance_candidates')
    .update({
      status: 'excluded',
      resolved_by: session.user.id,
      resolved_at: new Date().toISOString(),
      notes: notes ?? null,
    })
    .eq('id', candidateId)
    .eq('status', 'pending')

  if (error) throw new Error(error.message)
}

// ── Bulk approve ──────────────────────────────────────────────────────────────

export async function bulkApproveOpeningBalances(
  input: BulkApproveOpeningBalancesInput
): Promise<{ approved: number; skipped: number }> {
  const session = await requireSession()
  const supabase = await createServerSupabaseClient()

  const confOrder: ConfidenceLevel[] = ['high', 'medium', 'low', 'unresolved']
  const minIdx = confOrder.indexOf(input.min_confidence)

  // Fetch candidates at or above min_confidence
  const { data: candidates } = await supabase
    .from('migration_opening_balance_candidates')
    .select('id, confidence, matched_product_id, matched_location_id')
    .in('id', input.candidate_ids)
    .eq('status', 'pending')

  if (!candidates || candidates.length === 0) return { approved: 0, skipped: 0 }

  const eligibleIds = candidates
    .filter((c) => {
      const idx = confOrder.indexOf(c.confidence as ConfidenceLevel)
      return idx <= minIdx && c.matched_product_id && c.matched_location_id
    })
    .map((c) => c.id)

  if (eligibleIds.length === 0) return { approved: 0, skipped: candidates.length }

  const { error, count } = await supabase
    .from('migration_opening_balance_candidates')
    .update({
      status: 'approved',
      resolved_by: session.user.id,
      resolved_at: new Date().toISOString(),
    })
    .in('id', eligibleIds)

  if (error) throw new Error(error.message)

  return {
    approved: count ?? eligibleIds.length,
    skipped: candidates.length - eligibleIds.length,
  }
}

// ── Get single candidate ──────────────────────────────────────────────────────

export async function getOpeningBalanceCandidate(
  id: string
): Promise<OpeningBalanceCandidate | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('migration_opening_balance_candidates')
    .select(
      `*,
       product:products!migration_opening_balance_candidates_matched_product_id_fkey(name, sku),
       location:locations!migration_opening_balance_candidates_matched_location_id_fkey(name)`
    )
    .eq('id', id)
    .single()

  if (error || !data) return null

  return {
    ...data,
    matched_product_name: (data.product as { name: string } | null)?.name ?? null,
    matched_product_sku: (data.product as { sku: string } | null)?.sku ?? null,
    matched_location_name: (data.location as { name: string } | null)?.name ?? null,
  } as OpeningBalanceCandidate
}

// ── Stats summary ─────────────────────────────────────────────────────────────

export async function getOpeningBalanceStats(importRunId?: string): Promise<{
  total: number
  pending: number
  approved: number
  excluded: number
  applied: number
  unresolved: number
  readyToApply: number
}> {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('migration_opening_balance_candidates')
    .select('status, confidence, matched_product_id, matched_location_id')
    .limit(10000)

  if (importRunId) query = query.eq('import_run_id', importRunId)

  const { data } = await query

  const stats = {
    total: 0,
    pending: 0,
    approved: 0,
    excluded: 0,
    applied: 0,
    unresolved: 0,
    readyToApply: 0,
  }

  for (const r of data ?? []) {
    stats.total++
    if (r.status in stats) stats[r.status as keyof typeof stats]++
    if (r.confidence === 'unresolved' || !r.matched_product_id || !r.matched_location_id) {
      stats.unresolved++
    }
    if (r.status === 'approved' && r.matched_product_id && r.matched_location_id) {
      stats.readyToApply++
    }
  }

  return stats
}
