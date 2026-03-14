/**
 * lib/export/purchases-export.ts
 * Excel export for purchase entries and items.
 */

import ExcelJS from 'exceljs'
import type { PurchaseEntryRow, PurchaseItemRow } from '@/lib/server/purchases'
import { PURCHASE_STATUS_LABELS } from '@/lib/validations/purchases'

// ── Single purchase detail ─────────────────────────────────────────────────────

export async function buildPurchaseDetailExcel(
  entry: PurchaseEntryRow,
  items: PurchaseItemRow[],
  options: { generatedAt?: Date } = {}
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'GastroStock'
  wb.created = options.generatedAt ?? new Date()

  const ws = wb.addWorksheet('Compra')

  ws.mergeCells('A1:G1')
  const t = ws.getCell('A1')
  t.value = `Compra ${entry.entry_code ?? entry.id.slice(0, 8)}`
  t.font = { bold: true, size: 14 }
  t.alignment = { horizontal: 'center' }

  const meta: [string, string | number | null][] = [
    ['Ubicación', entry.location_name],
    ['Proveedor', entry.supplier_name ?? 'Sin proveedor'],
    ['Fecha', entry.entry_date],
    ['N° Remito/Factura', entry.invoice_number ?? ''],
    ['Estado', PURCHASE_STATUS_LABELS[entry.status as keyof typeof PURCHASE_STATUS_LABELS] ?? entry.status],
    ['Creado por', entry.created_by_name ?? ''],
    ['Recibido por', entry.received_by_name ?? ''],
    ['Recibido en', entry.received_at ? new Date(entry.received_at).toLocaleString('es-AR') : '—'],
    ['Notas', entry.notes ?? ''],
    ['Generado', (options.generatedAt ?? new Date()).toLocaleString('es-AR')],
  ]

  let r = 2
  for (const [label, val] of meta) {
    ws.getCell(`A${r}`).value = label
    ws.getCell(`A${r}`).font = { bold: true }
    ws.mergeCells(`B${r}:G${r}`)
    ws.getCell(`B${r}`).value = val
    r++
  }

  ws.addRow([])

  const headerRow = ws.addRow(['SKU', 'Producto', 'Unidad', 'Qty Pedida', 'Qty Recibida', 'Costo Unit.', 'Total'])
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e293b' } }
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' }

  ws.columns = [
    { width: 12 },
    { width: 30 },
    { width: 10 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
  ]

  let grandTotal = 0
  for (const item of items) {
    const lineTotal = item.unit_cost != null ? item.quantity_received * item.unit_cost : null
    if (lineTotal != null) grandTotal += lineTotal

    const dataRow = ws.addRow([
      item.sku,
      item.product_name,
      item.unit_symbol,
      item.quantity_ordered,
      item.quantity_received,
      item.unit_cost ?? '',
      lineTotal ?? '',
    ])

    if (item.unit_cost != null) dataRow.getCell(6).numFmt = '#,##0.00'
    if (lineTotal != null) dataRow.getCell(7).numFmt = '#,##0.00'
  }

  ws.addRow([])
  const totalRow = ws.addRow(['', '', '', '', '', 'TOTAL', grandTotal || ''])
  totalRow.font = { bold: true }
  if (grandTotal) totalRow.getCell(7).numFmt = '#,##0.00'

  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: r + 1 }]

  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}

// ── Purchase list ──────────────────────────────────────────────────────────────

export async function buildPurchasesListExcel(
  entries: PurchaseEntryRow[],
  options: { generatedAt?: Date; title?: string } = {}
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'GastroStock'

  const ws = wb.addWorksheet('Compras')

  ws.mergeCells('A1:J1')
  ws.getCell('A1').value = options.title ?? 'Listado de Compras'
  ws.getCell('A1').font = { bold: true, size: 14 }
  ws.getCell('A1').alignment = { horizontal: 'center' }

  ws.mergeCells('A2:J2')
  ws.getCell('A2').value = `Generado: ${(options.generatedAt ?? new Date()).toLocaleString('es-AR')}`
  ws.getCell('A2').font = { size: 9, color: { argb: 'FF666666' } }
  ws.getCell('A2').alignment = { horizontal: 'center' }

  ws.addRow([])

  const headerRow = ws.addRow([
    'Código', 'Fecha', 'Ubicación', 'Proveedor', 'Remito/Factura',
    'Items', 'Total', 'Estado', 'Creado por', 'Notas',
  ])
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e293b' } }
  headerRow.height = 22

  ws.columns = [
    { width: 14 }, { width: 12 }, { width: 16 }, { width: 20 },
    { width: 18 }, { width: 8 }, { width: 14 }, { width: 12 },
    { width: 18 }, { width: 30 },
  ]

  const STATUS_COLORS: Record<string, string> = {
    draft:     'FFFBBF24',
    received:  'FF22C55E',
    cancelled: 'FFEF4444',
  }

  for (const e of entries) {
    const dataRow = ws.addRow([
      e.entry_code ?? e.id.slice(0, 8),
      e.entry_date,
      e.location_name,
      e.supplier_name ?? 'Sin proveedor',
      e.invoice_number ?? '',
      e.item_count,
      e.total_amount ?? '',
      PURCHASE_STATUS_LABELS[e.status as keyof typeof PURCHASE_STATUS_LABELS] ?? e.status,
      e.created_by_name ?? '',
      e.notes ?? '',
    ])

    if (e.total_amount != null) dataRow.getCell(7).numFmt = '#,##0.00'

    const statusCell = dataRow.getCell(8)
    statusCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: STATUS_COLORS[e.status] ?? 'FFFFFFFF' },
    }
    statusCell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    statusCell.alignment = { horizontal: 'center' }
  }

  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: 10 } }
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }]

  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}
