/**
 * lib/server/idempotency.ts
 * Idempotency key management for sensitive write operations.
 * Prevents duplicate record creation on retries/double-submits.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'

// ── Key builders ──────────────────────────────────────────────────────────────

export const IdempotencyKeys = {
  purchaseReceive: (entryId: string, itemId: string) =>
    `purchase-receive-${entryId}-${itemId}`,

  transferOut: (transferId: string, itemId: string) =>
    `tr-out-${transferId}-${itemId}`,

  transferIn: (transferId: string, itemId: string) =>
    `tr-in-${transferId}-${itemId}`,

  physicalCount: (countId: string, productId: string) =>
    `pc-${countId}-${productId}`,

  cutoverOpening: (candidateId: string) =>
    `cutover-opening-${candidateId}`,

  openingStock: (runId: string, sku: string, locationId: string) =>
    `opening-${runId}-${sku}-${locationId}`,

  custom: (prefix: string, ...parts: string[]) =>
    `${prefix}-${parts.join('-')}`,
}

// ── Check if movement idempotency key already exists ─────────────────────────

export async function movementKeyExists(key: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('stock_movements')
    .select('id')
    .eq('idempotency_key', key)
    .single()
  return !!data
}

// ── Check if an idempotency key exists in a given table ──────────────────────

export async function keyExistsInTable(
  table: string,
  keyColumn: string,
  key: string
): Promise<{ exists: boolean; id: string | null }> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from(table)
    .select('id')
    .eq(keyColumn, key)
    .single()
  return { exists: !!data, id: data?.id ?? null }
}

// ── Idempotent movement check ─────────────────────────────────────────────────

export async function getExistingMovementId(key: string): Promise<string | null> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('stock_movements')
    .select('id')
    .eq('idempotency_key', key)
    .single()
  return data?.id ?? null
}

// ── Request deduplication helper (in-memory, per-process) ────────────────────
// For production, replace with Redis or DB-backed dedup store.

const inFlightKeys = new Set<string>()

export function acquireInFlightKey(key: string): boolean {
  if (inFlightKeys.has(key)) return false
  inFlightKeys.add(key)
  return true
}

export function releaseInFlightKey(key: string): void {
  inFlightKeys.delete(key)
}

/**
 * Executes a function exactly once for a given key.
 * Prevents concurrent duplicate execution within the same process.
 * For distributed environments, use DB-level idempotency keys instead.
 */
export async function withIdempotency<T>(
  key: string,
  checkExists: () => Promise<{ exists: boolean; result?: T }>,
  execute: () => Promise<T>
): Promise<{ result: T; was_duplicate: boolean }> {
  // Check persisted state first
  const { exists, result: existing } = await checkExists()
  if (exists && existing !== undefined) {
    return { result: existing, was_duplicate: true }
  }

  // Prevent concurrent duplicates
  const acquired = acquireInFlightKey(key)
  if (!acquired) {
    // Wait and retry once
    await new Promise((r) => setTimeout(r, 200))
    const { exists: exists2, result: existing2 } = await checkExists()
    if (exists2 && existing2 !== undefined) {
      return { result: existing2, was_duplicate: true }
    }
  }

  try {
    const result = await execute()
    return { result, was_duplicate: false }
  } finally {
    releaseInFlightKey(key)
  }
}
