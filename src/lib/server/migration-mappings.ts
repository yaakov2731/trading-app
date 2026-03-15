/**
 * lib/server/migration-mappings.ts
 * Mapping layer: legacy → canonical entities.
 * All mappings are explicit and auditable.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { normalizeUnit } from './legacy-parser'

// ── Location mapping ──────────────────────────────────────────────────────────

/** Normalises a raw location string into a canonical location_id. */
const LOCATION_ALIASES: Record<string, string[]> = {
  // Keys are canonical slugs; values are alias strings (lowercased)
  'umo-grill':    ['umo', 'umo grill', 'grill', 'parrilla'],
  'puerto-gelato':['gelato', 'puerto gelato', 'helados', 'heladeria'],
  'brooklyn':     ['brooklyn', 'burger', 'hamburgueseria'],
  'trento-cafe':  ['trento', 'cafe', 'cafeteria', 'trento cafe'],
  'eventos':      ['eventos', 'evento', 'deposito', 'depósito'],
  'shopping':     ['shopping', 'mall'],
}

export async function resolveLocation(
  raw: string | null | undefined
): Promise<{ locationId: string | null; confidence: 'high' | 'medium' | 'low' | 'unresolved' }> {
  if (!raw) return { locationId: null, confidence: 'unresolved' }

  const supabase = await createServerSupabaseClient()
  const normalized = raw.toLowerCase().trim()

  // Try exact slug match
  const { data: bySlug } = await supabase
    .from('locations')
    .select('id')
    .eq('slug', normalized)
    .single()

  if (bySlug) return { locationId: bySlug.id, confidence: 'high' }

  // Try alias match
  for (const [slug, aliases] of Object.entries(LOCATION_ALIASES)) {
    if (aliases.includes(normalized)) {
      const { data } = await supabase
        .from('locations')
        .select('id')
        .eq('slug', slug)
        .single()
      if (data) return { locationId: data.id, confidence: 'medium' }
    }
  }

  // Try partial name match
  const { data: byName } = await supabase
    .from('locations')
    .select('id, name')
    .ilike('name', `%${normalized}%`)
    .limit(1)

  if (byName?.[0]) return { locationId: byName[0].id, confidence: 'low' }

  return { locationId: null, confidence: 'unresolved' }
}

// ── Category mapping ──────────────────────────────────────────────────────────

const CATEGORY_ALIASES: Record<string, string[]> = {
  'Carnes':       ['carne', 'carnes', 'cárnica', 'frigorífico', 'frigorifico', 'res', 'embutidos'],
  'Verduras':     ['verdura', 'verduras', 'vegetales', 'vegetal', 'frescos'],
  'Bebidas':      ['bebida', 'bebidas', 'tragos', 'liquidos', 'líquidos', 'alcohol'],
  'Lácteos':      ['lacteo', 'lacteos', 'lácteo', 'lácteos', 'queso', 'leche', 'manteca'],
  'Panificados':  ['pan', 'panificado', 'panificados', 'bollos', 'panes'],
  'Salsas':       ['salsa', 'salsas', 'condimento', 'condimentos', 'aderezo'],
  'Frutas':       ['fruta', 'frutas'],
  'Abarrotes':    ['abarrote', 'abarrotes', 'secos', 'seco', 'enlatados'],
  'Limpieza':     ['limpieza', 'higiene', 'detergente'],
  'Descartables': ['descartable', 'descartables', 'desechable'],
  'Helados':      ['helado', 'helados', 'sorbete', 'base helado'],
  'Cafetería':    ['cafe', 'café', 'cafeteria', 'cafetería', 'infusion', 'infusión', 'te', 'té'],
}

export async function resolveCategory(
  raw: string | null | undefined
): Promise<{ categoryId: string | null; confidence: 'high' | 'medium' | 'low' | 'unresolved' }> {
  if (!raw) return { categoryId: null, confidence: 'unresolved' }
  const supabase = await createServerSupabaseClient()
  const norm = raw.toLowerCase().trim()

  // Exact prefix match (e.g. CAR, VER)
  const { data: byPrefix } = await supabase
    .from('categories')
    .select('id')
    .ilike('prefix', norm)
    .single()
  if (byPrefix) return { categoryId: byPrefix.id, confidence: 'high' }

  // Alias match
  for (const [name, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if (aliases.includes(norm)) {
      const { data } = await supabase.from('categories').select('id').ilike('name', name).single()
      if (data) return { categoryId: data.id, confidence: 'medium' }
    }
  }

  // Partial name
  const { data: byName } = await supabase
    .from('categories')
    .select('id')
    .ilike('name', `%${norm}%`)
    .limit(1)
  if (byName?.[0]) return { categoryId: byName[0].id, confidence: 'low' }

  return { categoryId: null, confidence: 'unresolved' }
}

// ── Unit mapping ──────────────────────────────────────────────────────────────

export async function resolveUnit(
  raw: string | null | undefined
): Promise<{ unitId: string | null; confidence: 'high' | 'medium' | 'low' | 'unresolved' }> {
  if (!raw) return { unitId: null, confidence: 'unresolved' }
  const { normalized, isKnown } = normalizeUnit(raw)
  if (!normalized) return { unitId: null, confidence: 'unresolved' }

  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('units')
    .select('id')
    .ilike('symbol', normalized)
    .single()

  if (data) return { unitId: data.id, confidence: isKnown ? 'high' : 'medium' }
  return { unitId: null, confidence: 'low' }
}

// ── Product mapping ───────────────────────────────────────────────────────────

export interface ProductMatch {
  productId: string
  sku: string
  name: string
  confidence: 'high' | 'medium' | 'low' | 'unresolved'
  matchMethod: 'sku_exact' | 'sku_prefix' | 'name_exact' | 'name_partial' | 'none'
}

export async function resolveProduct(
  rawSku: string | null | undefined,
  rawName: string | null | undefined
): Promise<ProductMatch | null> {
  const supabase = await createServerSupabaseClient()

  // Exact SKU match (highest confidence)
  if (rawSku) {
    const { data } = await supabase
      .from('products')
      .select('id, sku, name')
      .eq('sku', rawSku.trim().toUpperCase())
      .single()
    if (data) {
      return {
        productId: data.id,
        sku: data.sku,
        name: data.name,
        confidence: 'high',
        matchMethod: 'sku_exact',
      }
    }

    // Partial SKU (prefix)
    const { data: partial } = await supabase
      .from('products')
      .select('id, sku, name')
      .ilike('sku', `%${rawSku.trim()}%`)
      .limit(1)
    if (partial?.[0]) {
      return {
        productId: partial[0].id,
        sku: partial[0].sku,
        name: partial[0].name,
        confidence: 'medium',
        matchMethod: 'sku_prefix',
      }
    }
  }

  // Exact name match
  if (rawName) {
    const { data: byName } = await supabase
      .from('products')
      .select('id, sku, name')
      .ilike('name', rawName.trim())
      .limit(1)
    if (byName?.[0]) {
      return {
        productId: byName[0].id,
        sku: byName[0].sku,
        name: byName[0].name,
        confidence: 'medium',
        matchMethod: 'name_exact',
      }
    }

    // Partial name
    const { data: partialName } = await supabase
      .from('products')
      .select('id, sku, name')
      .ilike('name', `%${rawName.trim()}%`)
      .limit(1)
    if (partialName?.[0]) {
      return {
        productId: partialName[0].id,
        sku: partialName[0].sku,
        name: partialName[0].name,
        confidence: 'low',
        matchMethod: 'name_partial',
      }
    }
  }

  return null
}
