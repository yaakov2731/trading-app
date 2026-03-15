/**
 * lib/server/cache-helpers.ts
 * Next.js caching utilities — revalidation tags, unstable_cache wrappers.
 */

import { unstable_cache } from 'next/cache'

// ── Cache tags ────────────────────────────────────────────────────────────────

export const CACHE_TAGS = {
  products: 'products',
  categories: 'categories',
  units: 'units',
  locations: 'locations',
  suppliers: 'suppliers',
  stock: 'stock',
  movements: 'movements',
  purchases: 'purchases',
  transfers: 'transfers',
  counts: 'counts',
  dashboard: 'dashboard',
  alerts: 'alerts',
  migration: 'migration',
} as const

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS]

// ── Cache durations (seconds) ─────────────────────────────────────────────────

export const CACHE_TTL = {
  realtime: 0,      // no cache
  short: 30,        // 30s — frequently updated (alerts, stock)
  medium: 120,      // 2min — operational data (purchases, transfers)
  long: 600,        // 10min — slow-changing (products, categories)
  static: 3600,     // 1hr — rarely changes (units, roles)
} as const

// ── Cached function wrappers ──────────────────────────────────────────────────

export function cachedDashboardStats<T>(
  fn: () => Promise<T>,
  keyParts: string[]
): () => Promise<T> {
  return unstable_cache(fn, keyParts, {
    revalidate: CACHE_TTL.short,
    tags: [CACHE_TAGS.dashboard, CACHE_TAGS.stock],
  })
}

export function cachedProductList<T>(
  fn: () => Promise<T>,
  keyParts: string[]
): () => Promise<T> {
  return unstable_cache(fn, keyParts, {
    revalidate: CACHE_TTL.long,
    tags: [CACHE_TAGS.products],
  })
}

export function cachedStaticData<T>(
  fn: () => Promise<T>,
  keyParts: string[]
): () => Promise<T> {
  return unstable_cache(fn, keyParts, {
    revalidate: CACHE_TTL.static,
    tags: [CACHE_TAGS.categories, CACHE_TAGS.units, CACHE_TAGS.locations],
  })
}

// ── Revalidation helpers (call from server actions) ───────────────────────────

import { revalidateTag } from 'next/cache'

export function invalidateStock() {
  revalidateTag(CACHE_TAGS.stock)
  revalidateTag(CACHE_TAGS.dashboard)
  revalidateTag(CACHE_TAGS.alerts)
}

export function invalidatePurchases() {
  revalidateTag(CACHE_TAGS.purchases)
  invalidateStock()
}

export function invalidateTransfers() {
  revalidateTag(CACHE_TAGS.transfers)
  invalidateStock()
}

export function invalidateCounts() {
  revalidateTag(CACHE_TAGS.counts)
  invalidateStock()
}

export function invalidateProducts() {
  revalidateTag(CACHE_TAGS.products)
}

export function invalidateMigration() {
  revalidateTag(CACHE_TAGS.migration)
  invalidateStock()
}
