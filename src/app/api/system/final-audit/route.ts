import { NextResponse } from 'next/server'
import { runFinalAudit } from '@/lib/server/final-audit'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const report = await runFinalAudit()
    return NextResponse.json(report)
  } catch (err) {
    return NextResponse.json(
      { error: 'Audit failed', detail: err instanceof Error ? err.message : 'Unknown' },
      { status: 500 }
    )
  }
}
