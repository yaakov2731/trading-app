/**
 * app/api/migration/opening-balances/route.ts
 * GET  /api/migration/opening-balances — list candidates (with ?format=xlsx)
 * POST /api/migration/opening-balances/derive — derive from import run
 * PATCH /api/migration/opening-balances — bulk approve
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getOpeningBalanceCandidates,
  approveOpeningBalance,
  excludeOpeningBalance,
  bulkApproveOpeningBalances,
  deriveOpeningBalanceCandidates,
} from '@/lib/server/opening-balances'
import {
  openingBalanceFilterSchema,
  bulkApproveOpeningBalancesSchema,
  approveOpeningBalanceSchema,
} from '@/lib/validations/migration'
import { buildOpeningBalancesExcel } from '@/lib/export/opening-balances-export'
import { ZodError } from 'zod'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const format = sp.get('format')

    const filter = openingBalanceFilterSchema.parse({
      location_id: sp.get('location_id') ?? undefined,
      confidence: sp.get('confidence') ?? undefined,
      status: sp.get('status') ?? undefined,
      unresolved_only: sp.get('unresolved_only') ?? undefined,
      page: sp.get('page') ?? undefined,
      page_size: sp.get('page_size') ?? undefined,
    })

    const result = await getOpeningBalanceCandidates(filter)

    if (format === 'xlsx') {
      const buffer = await buildOpeningBalancesExcel(result.candidates)
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="saldos-iniciales.xlsx"',
        },
      })
    }

    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof ZodError) return NextResponse.json({ error: 'Filtros inválidos' }, { status: 400 })
    console.error('[opening-balances] GET error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const url = req.nextUrl.pathname
    const body = await req.json()

    // Derive candidates from an import run
    if (url.includes('/derive')) {
      const { import_run_id } = body
      if (!import_run_id) return NextResponse.json({ error: 'import_run_id requerido' }, { status: 400 })
      const result = await deriveOpeningBalanceCandidates(import_run_id)
      return NextResponse.json(result)
    }

    // Single approve
    if (url.includes('/approve')) {
      const pathParts = url.split('/')
      const candidateId = pathParts[pathParts.length - 2]
      const input = approveOpeningBalanceSchema.parse({ ...body, candidate_id: candidateId })
      await approveOpeningBalance(input)
      return NextResponse.json({ ok: true })
    }

    // Single exclude
    if (url.includes('/exclude')) {
      const pathParts = url.split('/')
      const candidateId = pathParts[pathParts.length - 2]
      await excludeOpeningBalance(candidateId, body.notes)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Ruta no encontrada' }, { status: 404 })
  } catch (err) {
    if (err instanceof ZodError) return NextResponse.json({ error: 'Datos inválidos', details: err.flatten().fieldErrors }, { status: 400 })
    if (err instanceof Error && err.message.includes('Unauthorized')) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    console.error('[opening-balances] POST error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const input = bulkApproveOpeningBalancesSchema.parse(body)
    const result = await bulkApproveOpeningBalances(input)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof ZodError) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    if (err instanceof Error && err.message.includes('Unauthorized')) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    console.error('[opening-balances] PATCH error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 })
  }
}
