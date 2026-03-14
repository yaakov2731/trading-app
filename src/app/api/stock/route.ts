export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// =============================================================================
// GET /api/stock
// Query params: location_id, product_id
// Used by client-side forms (OutputForm) for stock level warnings
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const params     = request.nextUrl.searchParams
    const locationId = params.get('location_id')
    const productId  = params.get('product_id')

    let query = supabase
      .from('v_current_stock')
      .select('product_id, product_name, sku, current_stock, unit_symbol, stock_status')

    if (locationId) query = query.eq('location_id', locationId)
    if (productId)  query = query.eq('product_id',  productId)

    const { data, error } = await query.limit(500)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data ?? [], {
      headers: { 'Cache-Control': 'private, max-age=10' },
    })
  } catch (err) {
    console.error('[GET /api/stock]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
