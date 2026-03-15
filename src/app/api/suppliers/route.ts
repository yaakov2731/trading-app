export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { isSupervisorOrAbove } from '@/lib/auth/permissions'
import { getSuppliers, createSupplier } from '@/lib/server/suppliers'
import { createSupplierSchema, supplierFilterSchema } from '@/lib/validations/suppliers'

export async function GET(req: NextRequest) {
  try {
    await requireSession()
    const sp = req.nextUrl.searchParams

    const filter = supplierFilterSchema.parse({
      search: sp.get('search') ?? undefined,
      is_active: sp.get('is_active') ?? undefined,
      page: sp.get('page') ?? 1,
      page_size: sp.get('page_size') ?? 50,
    })

    const result = await getSuppliers(filter)
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

    if (!isSupervisorOrAbove(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const input = createSupplierSchema.parse(body)
    const supplier = await createSupplier(input)

    return NextResponse.json(supplier, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error' },
      { status: 400 }
    )
  }
}
