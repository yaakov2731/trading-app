import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { getPhysicalCounts, createPhysicalCount } from '@/lib/server/physical-counts'
import { createPhysicalCountSchema, countFilterSchema } from '@/lib/validations/counts'
import { canCreateMovements } from '@/lib/auth/permissions'

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession()
    const sp = req.nextUrl.searchParams

    const filter = countFilterSchema.parse({
      location_id: sp.get('location_id') ?? undefined,
      status: sp.get('status') ?? undefined,
      from_date: sp.get('from_date') ?? undefined,
      to_date: sp.get('to_date') ?? undefined,
      page: sp.get('page') ?? 1,
      page_size: sp.get('page_size') ?? 20,
    })

    const result = await getPhysicalCounts(filter)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()

    if (!canCreateMovements(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const input = createPhysicalCountSchema.parse(body)
    const result = await createPhysicalCount(input)

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
