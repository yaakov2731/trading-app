'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/lib/types'

// =============================================================================
// Export Server Actions
// Fetches data for Excel/Sheets export — never writes to live database
// =============================================================================

export interface ExportDataPayload {
  locations:      unknown[]
  categories:     unknown[]
  units:          unknown[]
  products:       unknown[]
  currentStock:   unknown[]
  movements:      unknown[]
  purchases:      unknown[]
  transfers:      unknown[]
  physicalCounts: unknown[]
  exportedAt:     string
}

export async function getExportData(
  locationId?: string
): Promise<ApiResponse<ExportDataPayload>> {
  try {
    const supabase = await createServerSupabaseClient()

    const [
      locationsRes,
      categoriesRes,
      unitsRes,
      productsRes,
      stockRes,
      movementsRes,
      purchasesRes,
      transfersRes,
      countsRes,
    ] = await Promise.all([
      supabase.from('locations').select('*').order('sort_order'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('units').select('*').order('name'),
      supabase.from('products').select('*, category:categories(name), unit:units(symbol)').eq('is_active', true).order('name'),
      supabase.from('v_current_stock').select('*').then(r => locationId
        ? { ...r, data: r.data?.filter(i => (i as any).location_id === locationId) }
        : r
      ),
      supabase.from('v_movement_history').select('*').order('performed_at', { ascending: false }).limit(5000),
      supabase.from('purchase_entries').select('*, supplier:suppliers(name), location:locations(name), items:purchase_entry_items(*, product:products(sku, name))').order('entry_date', { ascending: false }).limit(500),
      supabase.from('transfers').select('*, from_location:locations!from_location_id(name), to_location:locations!to_location_id(name), items:transfer_items(*, product:products(sku, name))').order('transfer_date', { ascending: false }).limit(500),
      supabase.from('physical_counts').select('*, location:locations(name), items:physical_count_items(*, product:products(sku, name))').order('count_date', { ascending: false }).limit(200),
    ])

    const errors = [locationsRes, categoriesRes, unitsRes, productsRes, stockRes, movementsRes, purchasesRes, transfersRes, countsRes]
      .filter(r => r.error)
      .map(r => r.error!.message)

    if (errors.length > 0) {
      return { data: null, error: errors.join('; '), success: false }
    }

    return {
      data: {
        locations:      locationsRes.data  ?? [],
        categories:     categoriesRes.data ?? [],
        units:          unitsRes.data      ?? [],
        products:       productsRes.data   ?? [],
        currentStock:   stockRes.data      ?? [],
        movements:      movementsRes.data  ?? [],
        purchases:      purchasesRes.data  ?? [],
        transfers:      transfersRes.data  ?? [],
        physicalCounts: countsRes.data     ?? [],
        exportedAt:     new Date().toISOString(),
      },
      error:   null,
      success: true,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error inesperado'
    return { data: null, error: msg, success: false }
  }
}
