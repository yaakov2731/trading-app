export const dynamic = 'force-dynamic'

/**
 * app/api/migration/cutover/route.ts
 * GET  /api/migration/cutover — get cutover status + preflight
 * POST /api/migration/cutover — execute cutover
 */

import { NextRequest, NextResponse } from 'next/server'
import { executeCutover, getCutoverStatus, runCutoverPreflight } from '@/lib/server/cutover'
import { executeCutoverSchema } from '@/lib/validations/migration'
import { ZodError } from 'zod'

export async function GET() {
  try {
    const [status, preflight] = await Promise.all([
      getCutoverStatus(),
      runCutoverPreflight(),
    ])
    return NextResponse.json({ status, preflight })
  } catch (err) {
    console.error('[cutover] GET error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const input = executeCutoverSchema.parse(body)
    const result = await executeCutover(input)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: err.flatten().fieldErrors },
        { status: 400 }
      )
    }
    if (err instanceof Error && err.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'No autorizado — solo administradores pueden ejecutar el corte' }, { status: 403 })
    }
    console.error('[cutover] POST error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno' },
      { status: 500 }
    )
  }
}
