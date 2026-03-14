import { NextResponse } from 'next/server'
import { runSystemHealthCheck } from '@/lib/server/system-health'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const report = await runSystemHealthCheck()
    const status = report.overall === 'ok' ? 200 : report.overall === 'warning' ? 200 : 503
    return NextResponse.json(report, { status })
  } catch (err) {
    return NextResponse.json(
      { error: 'Health check failed', detail: err instanceof Error ? err.message : 'Unknown' },
      { status: 500 }
    )
  }
}
