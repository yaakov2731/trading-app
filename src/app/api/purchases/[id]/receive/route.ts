import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { canCreateMovements } from '@/lib/auth/permissions'
import { receivePurchaseEntry } from '@/lib/server/purchase-receiving'
import { getPurchaseItems } from '@/lib/server/purchases'

/**
 * POST /api/purchases/[id]/receive
 *
 * Full receive: marks all items as received at their ordered quantities
 * and creates purchase_in stock movements.
 *
 * Accepts optional body:
 * {
 *   notes?: string
 *   // For future partial receiving:
 *   // items?: Array<{ purchase_item_id: string; quantity_received: number }>
 * }
 *
 * This endpoint is idempotent-safe — duplicate calls are detected via
 * idempotency keys on stock_movements and return success without
 * creating duplicate movements.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession()

    if (!canCreateMovements(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json().catch(() => ({}))

    // Build received_items from current purchase items (full receive)
    const items = await getPurchaseItems(id)
    const received_items = items.map((item) => ({
      purchase_item_id: item.id,
      quantity_received: item.quantity_ordered, // full receive
    }))

    const result = await receivePurchaseEntry({
      purchase_entry_id: id,
      received_items,
      notes: body.notes ?? undefined,
    })

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    const status =
      message.includes('ya fue recibida') || message.includes('cancelada') ? 409 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
