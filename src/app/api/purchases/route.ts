export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { canCreateMovements } from '@/lib/auth/permissions'
import { getPurchaseEntries, createPurchaseEntry } from '@/lib/server/purchases'
import { createPurchaseSchema, purchaseFilterSchema } from '@/lib/validations/purchases'

export async function GET(req: NextRequest) {
  try {
    await requireSession()
    const sp = req.nextUrl.searchParams

    const filter = purchaseFilterSchema.parse({
      location_id: sp.get('location_id') ?? undefined,
      supplier_id: sp.get('supplier_id') ?? undefined,
      status: sp.get('status') ?? undefined,
      from_date: sp.get('from_date') ?? undefined,
      to_date: sp.get('to_date') ?? undefined,
      search: sp.get('search') ?? undefined,
      page: sp.get('page') ?? 1,
      page_size: sp.get('page_size') ?? 20,
    })

    const result = await getPurchaseEntries(filter)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error' },
      { status: 400 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()

    if (!canCreateMovements(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const input = createPurchaseSchema.parse(body)
    const result = await createPurchaseEntry(input)

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error' },
      { status: 400 }
    )
  }
}
