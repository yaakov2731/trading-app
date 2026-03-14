import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  recordMovement,
  getMovements,
} from '@/lib/server/stock-movements'

// =============================================================================
// GET /api/movements
// Query params: location_id, product_id, movement_type, date_from, date_to, limit, offset
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const params = Object.fromEntries(request.nextUrl.searchParams)

    const filter = {
      location_id:   params.location_id   || undefined,
      product_id:    params.product_id    || undefined,
      movement_type: params.movement_type || undefined,
      date_from:     params.date_from     || undefined,
      date_to:       params.date_to       || undefined,
      limit:         params.limit  ? parseInt(params.limit,  10) : 50,
      offset:        params.offset ? parseInt(params.offset, 10) : 0,
    }

    const result = await getMovements(filter, supabase)

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    console.error('[GET /api/movements]', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST /api/movements
// Body: { product_id, location_id, movement_type, quantity, unit_cost?, notes?, idempotency_key? }
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const options = {
      blockNegativeStock: request.headers.get('x-block-negative-stock') === 'true',
    }

    const result = await recordMovement(body, user.id, supabase, options)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 422 })
    }

    return NextResponse.json(
      {
        data:                result.data,
        negativeStockWarning: result.negativeStockWarning,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[POST /api/movements]', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
