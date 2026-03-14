/**
 * lib/export/movements-export.ts
 * Excel export for movement history.
 */

import ExcelJS from 'exceljs'
import type { HistoryRow } from '@/lib/server/history'
import { MOVEMENT_LABELS } from '@/lib/utils/format'

export async function buildMovementsExcel(
  rows: HistoryRow[],
  options: {
    locationName?: string
    fromDate?: string
    toDate?: string
    generatedAt?: Date
  } = {}
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'GastroStock'
  wb.created = options.generatedAt ?? new Date()

  const ws = wb.addWorksheet('Movimientos', {
    pageSetup: { fitToPage: true, orientation: 'landscape' },
  })

  // Title
  ws.mergeCells('A1:M1')
  const title = ws.getCell('A1')
  title.value = options.locationName
    ? `Movimientos — ${options.locationName}`
    : 'Historial de Movimientos'
  title.font = { bold: true, size: 14 }
  title.alignment = { horizontal: 'center' }

  ws.mergeCells('A2:M2')
  const sub = ws.getCell('A2')
  const dateRange =
    options.fromDate && options.toDate
      ? ` (${options.fromDate} al ${options.toDate})`
      : ''
  sub.value = `Generado: ${(options.generatedAt ?? new Date()).toLocaleString('es-AR')}${dateRange}`
  sub.font = { size: 9, color: { argb: 'FF666666' } }
  sub.alignment = { horizontal: 'center' }

  ws.addRow([])

  const headers = [
    'Fecha', 'Hora', 'SKU', 'Producto', 'Categoría', 'Ubicación',
    'Tipo', 'Cantidad', 'Costo Unit.', 'Total', 'Balance', 'Referencia', 'Realizado por',
  ]

  const headerRow = ws.addRow(headers)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e293b' } }
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
  headerRow.height = 22

  ws.columns = [
    { width: 12 }, // Fecha
    { width: 10 }, // Hora
    { width: 12 }, // SKU
    { width: 28 }, // Producto
    { width: 16 }, // Categoría
    { width: 16 }, // Ubicación
    { width: 22 }, // Tipo
    { width: 12 }, // Cantidad
    { width: 12 }, // Costo Unit.
    { width: 14 }, // Total
    { width: 12 }, // Balance
    { width: 18 }, // Referencia
    { width: 20 }, // Realizado por
  ]

  for (const row of rows) {
    const dt = new Date(row.performed_at)
    const label = MOVEMENT_LABELS[row.movement_type as keyof typeof MOVEMENT_LABELS] ?? row.movement_type
    const isNegative = row.quantity < 0

    const dataRow = ws.addRow([
      dt.toLocaleDateString('es-AR'),
      dt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      row.sku,
      row.product_name,
      row.category_name,
      row.location_name,
      label,
      row.quantity,
      row.unit_cost ?? '',
      row.total_cost ?? '',
      row.running_balance,
      row.reference_code ?? '',
      row.performed_by_name ?? '',
    ])

    // Qty color: red for outgoing, green for incoming
    const qtyCell = dataRow.getCell(8)
    qtyCell.numFmt = '+#,##0.###;-#,##0.###'
    qtyCell.font = { color: { argb: isNegative ? 'FFEF4444' : 'FF22C55E' }, bold: true }

    const costCell = dataRow.getCell(9)
    if (row.unit_cost != null) costCell.numFmt = '#,##0.00'

    const totalCell = dataRow.getCell(10)
    if (row.total_cost != null) totalCell.numFmt = '#,##0.00'

    const balCell = dataRow.getCell(11)
    balCell.numFmt = '#,##0.###'
  }

  ws.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: 4, column: 13 },
  }

  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }]

  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}
