/**
 * lib/server/performance.ts
 * Server-side performance helpers — query timing, batch detection, slow query warnings.
 */

// ── Query timing ──────────────────────────────────────────────────────────────

const SLOW_QUERY_THRESHOLD_MS = 1000

export async function timed<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  try {
    return await fn()
  } finally {
    const ms = performance.now() - start
    if (ms > SLOW_QUERY_THRESHOLD_MS) {
      console.warn(`[perf] Slow query: ${label} took ${ms.toFixed(0)}ms`)
    } else if (process.env.NODE_ENV === 'development') {
      console.debug(`[perf] ${label}: ${ms.toFixed(0)}ms`)
    }
  }
}

// ── Batch size guidance ───────────────────────────────────────────────────────

/**
 * Returns an array of chunks for batch processing.
 * Use this to avoid inserting/selecting too many rows at once.
 */
export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

// ── Parallel query runner ─────────────────────────────────────────────────────

/**
 * Runs multiple async queries in parallel and collects results.
 * Prefer this over sequential awaits for independent queries.
 */
export async function parallel<T extends readonly unknown[]>(
  ...fns: { [K in keyof T]: () => Promise<T[K]> }
): Promise<T> {
  return Promise.all(fns.map((fn) => fn())) as Promise<T>
}

// ── Deferred execution ────────────────────────────────────────────────────────

/**
 * Defers a non-critical side effect to after the main response.
 * Use for audit logging, notifications, stats updates.
 */
export function defer(fn: () => Promise<void>): void {
  fn().catch((err) => console.error('[defer] Deferred task failed:', err))
}

// ── Select field optimisation notes ──────────────────────────────────────────

/**
 * Minimal select sets for common join patterns.
 * These reduce payload size for list queries.
 */
export const MINIMAL_SELECTS = {
  product: 'id, sku, name, unit_id',
  location: 'id, name, slug',
  category: 'id, name, prefix',
  unit: 'id, symbol, name',
  supplier: 'id, name',
  user: 'id, full_name',
} as const
