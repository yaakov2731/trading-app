/**
 * app/api/migration/review/route.ts
 * GET /api/migration/review — list review rows (with ?format=xlsx for export)
 * POST /api/migration/review — apply action to a single row
 * PATCH /api/migration/review — bulk action
 */

import { NextRequest, NextResponse } from 'next/server'
import { getReviewRows, applyRowAction, applyBulkRowAction } from '@/lib/server/migration-review'
import {
  reviewRowActionSchema,
  bulkReviewActionSchema,
  reviewFilterSchema,
} from '@/lib/validations/migration'
import { buildMigrationReviewExcel } from '@/lib/export/migration-review-export'
import { ZodError } from 'zod'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const format = sp.get('format')

    const filter = reviewFilterSchema.parse({
      import_run_id: sp.get('import_run_id') ?? undefined,
      location_id: sp.get('location_id') ?? undefined,
      status: sp.get('status') ?? undefined,
      issue_type: sp.get('issue_type') ?? undefined,
      page: sp.get('page') ?? undefined,
      page_size: sp.get('page_size') ?? undefined,
    })

    const result = await getReviewRows(filter)

    if (format === 'xlsx') {
      const buffer = await buildMigrationReviewExcel(result.rows)
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="revision-migracion.xlsx"',
        },
      })
    }

    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Filtros inválidos' }, { status: 400 })
    }
    console.error('[migration/review] GET error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const input = reviewRowActionSchema.parse(body)
    await applyRowAction(input)
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: err.flatten().fieldErrors }, { status: 400 })
    }
    if (err instanceof Error && err.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error('[migration/review] POST error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const input = bulkReviewActionSchema.parse(body)
    const result = await applyBulkRowAction(input)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }
    if (err instanceof Error && err.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error('[migration/review] PATCH error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 })
  }
}
