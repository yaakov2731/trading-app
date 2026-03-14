/**
 * lib/utils/query-keys.ts
 * Reusable query key factories for client-side data fetching consistency.
 * Compatible with SWR, React Query, or custom fetch hooks.
 */

// ── Key factories ─────────────────────────────────────────────────────────────

export const queryKeys = {
  // Products
  products: (opts?: { search?: string; categoryId?: string; locationId?: string }) =>
    ['products', opts ?? {}] as const,
  product: (id: string) => ['products', id] as const,
  categories: () => ['categories'] as const,
  units: () => ['units'] as const,

  // Stock
  stock: (locationId?: string) => ['stock', locationId ?? 'all'] as const,
  stockBalance: (productId: string, locationId: string) =>
    ['stock', 'balance', productId, locationId] as const,
  alerts: (locationId?: string) => ['alerts', locationId ?? 'all'] as const,

  // Movements
  movements: (opts?: {
    locationId?: string
    productId?: string
    type?: string
    dateFrom?: string
    dateTo?: string
    page?: number
  }) => ['movements', opts ?? {}] as const,
  movement: (id: string) => ['movements', id] as const,

  // Purchases
  purchases: (opts?: { locationId?: string; status?: string; page?: number }) =>
    ['purchases', opts ?? {}] as const,
  purchase: (id: string) => ['purchases', id] as const,
  purchaseItems: (entryId: string) => ['purchases', entryId, 'items'] as const,
  suppliers: (opts?: { active?: boolean; search?: string }) =>
    ['suppliers', opts ?? {}] as const,
  supplier: (id: string) => ['suppliers', id] as const,

  // Transfers
  transfers: (opts?: { locationId?: string; status?: string; page?: number }) =>
    ['transfers', opts ?? {}] as const,
  transfer: (id: string) => ['transfers', id] as const,

  // Physical Counts
  counts: (opts?: { locationId?: string; status?: string; page?: number }) =>
    ['counts', opts ?? {}] as const,
  count: (id: string) => ['counts', id] as const,
  countItems: (countId: string) => ['counts', countId, 'items'] as const,

  // Migration
  importRuns: () => ['migration', 'runs'] as const,
  importRun: (id: string) => ['migration', 'runs', id] as const,
  reviewRows: (opts?: { runId?: string; status?: string }) =>
    ['migration', 'review', opts ?? {}] as const,
  openingBalances: (opts?: { status?: string; confidence?: string }) =>
    ['migration', 'opening-balances', opts ?? {}] as const,
  cutoverStatus: () => ['migration', 'cutover'] as const,

  // Dashboard
  dashboardStats: (locationId?: string) => ['dashboard', 'stats', locationId ?? 'all'] as const,
  dashboardKpis: () => ['dashboard', 'kpis'] as const,

  // Locations
  locations: () => ['locations'] as const,
  location: (id: string) => ['locations', id] as const,
  myLocations: (userId: string) => ['locations', 'my', userId] as const,
}
