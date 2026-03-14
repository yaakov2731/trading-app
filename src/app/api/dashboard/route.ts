export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  getDashboardStats,
  getRecentMovements,
  getLowStockSummary,
  getCategoryStockSummary,
  getDailyMovementSummary,
} from '@/lib/server/dashboard'

// =============================================================================
// GET /api/dashboard
// Query params: location_id, include[] (stats|recent|alerts|categories|chart)
// Returns composed dashboard payload
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const params      = request.nextUrl.searchParams
    const locationId  = params.get('location_id') ?? undefined
    const includeRaw  = params.getAll('include')
    const include     = includeRaw.length > 0
      ? new Set(includeRaw)
      : new Set(['stats', 'recent', 'alerts', 'categories'])

    const [stats, recent, alerts, categories, chart] = await Promise.all([
      include.has('stats')      ? getDashboardStats(supabase, locationId)            : null,
      include.has('recent')     ? getRecentMovements(supabase, locationId, 10)        : null,
      include.has('alerts')     ? getLowStockSummary(supabase, locationId)            : null,
      include.has('categories') ? getCategoryStockSummary(supabase, locationId)       : null,
      include.has('chart') && locationId
                                ? getDailyMovementSummary(supabase, locationId, 14)  : null,
    ])

    return NextResponse.json(
      {
        stats,
        recentMovements: recent,
        alertSummary:    alerts,
        categoryStock:   categories,
        dailyChart:      chart,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=30',
        },
      }
    )
  } catch (err) {
    console.error('[GET /api/dashboard]', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
