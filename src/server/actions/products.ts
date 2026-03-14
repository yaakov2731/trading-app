'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createProductSchema, updateProductSchema } from '@/lib/schemas'
import type { ApiResponse, Product } from '@/lib/types'

// =============================================================================
// Product Server Actions
// =============================================================================

export async function getProducts(filters?: {
  categoryId?: string
  search?:     string
  active?:     boolean
}): Promise<ApiResponse<Product[]>> {
  try {
    const supabase = await createServerSupabaseClient()

    let query = supabase
      .from('products')
      .select('*, category:categories(*), unit:units(*)')
      .order('name')

    if (filters?.categoryId) query = query.eq('category_id', filters.categoryId)
    if (filters?.active !== undefined) query = query.eq('is_active', filters.active)
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`
      )
    }

    const { data, error } = await query

    if (error) return { data: null, error: error.message, success: false }
    return { data: data as unknown as Product[], error: null, success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error inesperado'
    return { data: null, error: msg, success: false }
  }
}

export async function createProduct(
  input: unknown
): Promise<ApiResponse<Product>> {
  try {
    const parsed = createProductSchema.parse(input)
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'No autorizado', success: false }

    // Use the DB function that atomically generates SKU + creates product
    const { data, error } = await supabase.rpc('create_product_with_sku', {
      p_name:        parsed.name,
      p_category_id: parsed.category_id,
      p_unit_id:     parsed.unit_id,
      p_description: parsed.description ?? null,
      p_cost_price:  parsed.cost_price  ?? null,
      p_sale_price:  parsed.sale_price  ?? null,
      p_min_stock:   parsed.min_stock   ?? 0,
      p_notes:       parsed.notes       ?? null,
      p_metadata:    {},
      p_created_by:  user.id,
    })

    if (error) {
      console.error('Create product error:', error)
      return { data: null, error: error.message, success: false }
    }

    revalidatePath('/products')
    revalidatePath('/stock')

    return { data: data as Product, error: null, success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error inesperado'
    return { data: null, error: msg, success: false }
  }
}

export async function updateProduct(
  id: string,
  input: unknown
): Promise<ApiResponse<Product>> {
  try {
    const parsed = updateProductSchema.parse(input)
    const supabase = await createServerSupabaseClient()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ...updateData } = parsed

    const { data, error } = await supabase
      .from('products')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, category:categories(*), unit:units(*)')
      .single()

    if (error) return { data: null, error: error.message, success: false }

    revalidatePath('/products')
    revalidatePath('/stock')

    return { data: data as unknown as Product, error: null, success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error inesperado'
    return { data: null, error: msg, success: false }
  }
}

export async function deactivateProduct(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return { data: null, error: error.message, success: false }

    revalidatePath('/products')
    revalidatePath('/stock')

    return { data: undefined, error: null, success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error inesperado'
    return { data: null, error: msg, success: false }
  }
}

export async function getCurrentStock(
  locationId: string
): Promise<ApiResponse<unknown[]>> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('v_current_stock')
      .select('*')
      .eq('location_id', locationId)
      .order('category_name')
      .order('product_name')

    if (error) return { data: null, error: error.message, success: false }
    return { data: data ?? [], error: null, success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error inesperado'
    return { data: null, error: msg, success: false }
  }
}
