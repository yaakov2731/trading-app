export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { getLowStockAlerts, getAlertSummary } from '@/lib/server/alerts'
import { isAdmin } from '@/lib/auth/permissions'

export const revalidate = 60

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession()
    const sp = req.nextUrl.searchParams
    const mode = sp.get('mode') ?? 'list' // 'list' | 'summary'

    // Build accessible location IDs
    let locationIds: string[] | undefined
    const locationParam = sp.get('location_id')

    if (locationParam) {
      locationIds = [locationParam]
    } else if (!isAdmin(session.user)) {
      locationIds = session.user.locations.map((l) => l.locationId)
    }

    if (mode === 'summary') {
      const summary = await getAlertSummary(locationIds)
      return NextResponse.json(summary)
    }

    const alerts = await getLowStockAlerts(locationIds)
    return NextResponse.json({ alerts, total: alerts.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
