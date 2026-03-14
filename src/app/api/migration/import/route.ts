export const dynamic = 'force-dynamic'

/**
 * app/api/migration/import/route.ts
 * POST /api/migration/import — create a new import run from parsed rows.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createImportRun } from '@/lib/server/migration-import'
import { importPayloadSchema } from '@/lib/validations/migration'
import { ZodError } from 'zod'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const input = importPayloadSchema.parse(body)
    const result = await createImportRun(input)
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: err.flatten().fieldErrors },
        { status: 400 }
      )
    }
    if (err instanceof Error && err.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error('[migration/import] POST error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno' },
      { status: 500 }
    )
  }
}
