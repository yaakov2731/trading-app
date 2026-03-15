/**
 * lib/server/supabase-products.ts
 * Product queries using the canonical Supabase server client.
 * Replaces any direct DB calls for product lookups.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface ProductRow {
  id: string
  sku: string
  name: string
  description: string | null
  barcode: string | null
  category_id: string
  unit_id: string
  cost_price: number | null
  sale_price: number | null
  min_stock: number
  max_stock: number | null
  is_active: boolean
  is_legacy: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ProductWithRelations extends ProductRow {
  category: { id: string; name: string; color: string | null; prefix: string }
  unit: { id: string; name: string; symbol: string }
}

export interface ProductListOptions {
  search?: string
  categoryId?: string
  isActive?: boolean
  page?: number
  pageSize?: number
  includeInactive?: boolean
}

export interface ProductListResult {
  products: ProductWithRelations[]
  total: number
  hasMore: boolean
}

export async function getProducts(
  opts: ProductListOptions = {}
): Promise<ProductListResult> {
  const {
    search,
    categoryId,
    isActive,
    page = 1,
    pageSize = 50,
    includeInactive = false,
  } = opts

  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('products')
    .select(
      `id, sku, name, description, barcode, category_id, unit_id,
       cost_price, sale_price, min_stock, max_stock, is_active, is_legacy,
       notes, created_at, updated_at,
       category:categories(id, name, color, prefix),
       unit:units(id, name, symbol)`,
      { count: 'exact' }
    )

  if (!includeInactive) {
    query = query.eq('is_active', true)
  } else if (isActive !== undefined) {
    query = query.eq('is_active', isActive)
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  if (search && search.trim()) {
    const term = search.trim()
    query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%,barcode.eq.${term}`)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .order('name', { ascending: true })
    .range(from, to)

  if (error) throw new Error(error.message)

  return {
    products: (data ?? []) as unknown as ProductWithRelations[],
    total: count ?? 0,
    hasMore: (count ?? 0) > to + 1,
  }
}

export async function getProductById(id: string): Promise<ProductWithRelations | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('products')
    .select(
      `id, sku, name, description, barcode, category_id, unit_id,
       cost_price, sale_price, min_stock, max_stock, is_active, is_legacy,
       notes, created_at, updated_at,
       category:categories(id, name, color, prefix),
       unit:units(id, name, symbol)`
    )
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as unknown as ProductWithRelations
}

export async function getProductBySku(sku: string): Promise<ProductWithRelations | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('products')
    .select(
      `id, sku, name, description, barcode, category_id, unit_id,
       cost_price, sale_price, min_stock, max_stock, is_active, is_legacy,
       notes, created_at, updated_at,
       category:categories(id, name, color, prefix),
       unit:units(id, name, symbol)`
    )
    .eq('sku', sku.toUpperCase())
    .single()

  if (error || !data) return null
  return data as unknown as ProductWithRelations
}

export async function getProductsByBarcode(barcode: string): Promise<ProductWithRelations[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('products')
    .select(
      `id, sku, name, description, barcode, category_id, unit_id,
       cost_price, sale_price, min_stock, max_stock, is_active, is_legacy,
       notes, created_at, updated_at,
       category:categories(id, name, color, prefix),
       unit:units(id, name, symbol)`
    )
    .eq('barcode', barcode)
    .eq('is_active', true)

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as ProductWithRelations[]
}

export async function getCategories() {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('categories')
    .select('id, name, prefix, color, description, is_active')
    .eq('is_active', true)
    .order('name')

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getUnits() {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('units')
    .select('id, name, symbol, unit_type')
    .order('name')

  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Search products by name/SKU for form autocomplete.
 * Returns lightweight results only.
 */
export async function searchProducts(
  term: string,
  locationId?: string,
  limit = 20
): Promise<Array<{ id: string; sku: string; name: string; unit_symbol: string; current_stock?: number }>> {
  const supabase = await createServerSupabaseClient()

  if (locationId) {
    // With stock level for the given location
    const { data, error } = await supabase
      .from('v_current_stock')
      .select('product_id, sku, product_name, unit_symbol, current_stock')
      .eq('location_id', locationId)
      .or(`product_name.ilike.%${term}%,sku.ilike.%${term}%`)
      .limit(limit)

    if (error) throw new Error(error.message)
    return (data ?? []).map((r) => ({
      id: r.product_id as string,
      sku: r.sku as string,
      name: r.product_name as string,
      unit_symbol: r.unit_symbol as string,
      current_stock: r.current_stock as number,
    }))
  }

  const { data, error } = await supabase
    .from('products')
    .select('id, sku, name, unit:units(symbol)')
    .eq('is_active', true)
    .or(`name.ilike.%${term}%,sku.ilike.%${term}%`)
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => ({
    id: r.id as string,
    sku: r.sku as string,
    name: r.name as string,
    unit_symbol: (r.unit as { symbol: string } | null)?.symbol ?? '',
  }))
}
