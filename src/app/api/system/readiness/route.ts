import { NextResponse } from 'next/server'
import { generateReleaseReadiness } from '@/lib/server/release-readiness'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const report = await generateReleaseReadiness()
    return NextResponse.json(report)
  } catch (err) {
    return NextResponse.json(
      { error: 'Readiness check failed', detail: err instanceof Error ? err.message : 'Unknown' },
      { status: 500 }
    )
  }
}
