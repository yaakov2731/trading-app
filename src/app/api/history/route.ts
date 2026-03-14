export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { getMovementHistory } from '@/lib/server/history'

export async function GET(req: NextRequest) {
  try {
    await requireSession()
    const sp = req.nextUrl.searchParams

    const result = await getMovementHistory({
      location_id: sp.get('location_id') ?? undefined,
      product_id: sp.get('product_id') ?? undefined,
      movement_type: sp.get('movement_type') ?? undefined,
      from_date: sp.get('from_date') ?? undefined,
      to_date: sp.get('to_date') ?? undefined,
      performed_by: sp.get('performed_by') ?? undefined,
      search: sp.get('search') ?? undefined,
      page: sp.get('page') ? Number(sp.get('page')) : 1,
      page_size: sp.get('page_size') ? Number(sp.get('page_size')) : 50,
    })

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
