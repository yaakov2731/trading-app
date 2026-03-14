import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { getTransfers, createTransfer } from '@/lib/server/transfers'
import { createTransferSchema, transferFilterSchema } from '@/lib/validations/transfers'
import { canCreateMovements } from '@/lib/auth/permissions'

export async function GET(req: NextRequest) {
  try {
    await requireSession()
    const sp = req.nextUrl.searchParams

    const filter = transferFilterSchema.parse({
      location_id: sp.get('location_id') ?? undefined,
      status: sp.get('status') ?? undefined,
      from_date: sp.get('from_date') ?? undefined,
      to_date: sp.get('to_date') ?? undefined,
      page: sp.get('page') ?? 1,
      page_size: sp.get('page_size') ?? 20,
    })

    const result = await getTransfers(filter)
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
    const input = createTransferSchema.parse(body)
    const result = await createTransfer(input)

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
