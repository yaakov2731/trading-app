export const dynamic = 'force-dynamic'

/**
 * app/api/migration/cutover/rollback/route.ts
 * POST /api/migration/cutover/rollback — rollback cutover (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { rollbackCutover } from '@/lib/server/cutover'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const result = await rollbackCutover(body.notes)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof Error && err.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'No autorizado — solo administradores' }, { status: 403 })
    }
    console.error('[cutover/rollback] POST error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno' },
      { status: 500 }
    )
  }
}
