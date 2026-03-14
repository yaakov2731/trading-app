/**
 * lib/export/counts-export.ts
 * Excel export for physical count results.
 */

import ExcelJS from 'exceljs'
import type { PhysicalCountRow, PhysicalCountItemRow } from '@/lib/server/physical-counts'

export async function buildCountExcel(
  count: PhysicalCountRow,
  items: PhysicalCountItemRow[],
  options: { generatedAt?: Date } = {}
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'GastroStock'
  wb.created = options.generatedAt ?? new Date()

  const ws = wb.addWorksheet('Conteo Físico')

  // Header meta
  ws.mergeCells('A1:I1')
  const t = ws.getCell('A1')
  t.value = `Conteo Físico — ${count.location_name}`
  t.font = { bold: true, size: 14 }
  t.alignment = { horizontal: 'center' }

  const meta = [
    ['Código', count.count_code ?? ''],
    ['Fecha', count.count_date],
    ['Estado', count.status],
    ['Realizado por', count.created_by_name ?? ''],
    ['Notas', count.notes ?? ''],
    ['Generado', (options.generatedAt ?? new Date()).toLocaleString('es-AR')],
  ]

  let metaRow = 2
  for (const [label, val] of meta) {
    ws.mergeCells(`A${metaRow}:B${metaRow}`)
    ws.getCell(`A${metaRow}`).value = label
    ws.getCell(`A${metaRow}`).font = { bold: true }
    ws.mergeCells(`C${metaRow}:I${metaRow}`)
    ws.getCell(`C${metaRow}`).value = val
    metaRow++
  }

  ws.addRow([])

  const headerRow = ws.addRow([
    'SKU', 'Producto', 'Unidad',
    'Qty Sistema', 'Qty Contada', 'Diferencia', 'Diferencia %',
    'Costo Unit.', 'Valor Diferencia',
  ])
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
    { width: 12 },
    { width: 16 },
  ]

  for (const item of items) {
    const pct =
      item.system_quantity !== 0
        ? ((item.discrepancy / item.system_quantity) * 100).toFixed(1) + '%'
        : item.discrepancy !== 0
        ? '∞'
        : '0%'

    const valDiff =
      item.unit_cost != null ? Math.abs(item.discrepancy) * item.unit_cost : null

    const dataRow = ws.addRow([
      item.sku,
      item.product_name,
      item.unit_symbol,
      item.system_quantity,
      item.counted_quantity,
      item.discrepancy,
      pct,
      item.unit_cost ?? '',
      valDiff ?? '',
    ])

    // Color discrepancy cell
    const diffCell = dataRow.getCell(6)
    diffCell.numFmt = '+#,##0.###;-#,##0.###'
    if (item.discrepancy !== 0) {
      diffCell.font = {
        color: { argb: item.discrepancy > 0 ? 'FF22C55E' : 'FFEF4444' },
        bold: true,
      }
    }

    if (item.unit_cost != null) dataRow.getCell(8).numFmt = '#,##0.00'
    if (valDiff != null) dataRow.getCell(9).numFmt = '#,##0.00'

    // Highlight rows with discrepancies
    if (item.discrepancy !== 0) {
      for (let col = 1; col <= 9; col++) {
        const cell = dataRow.getCell(col)
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
            argb: item.discrepancy > 0 ? 'FFf0fdf4' : 'FFfef2f2',
          },
        }
      }
    }
  }

  // Summary row
  ws.addRow([])
  const total = items.length
  const withDiscrepancy = items.filter((i) => i.discrepancy !== 0).length
  const summaryRow = ws.addRow([
    `Total: ${total} productos`,
    `Con diferencia: ${withDiscrepancy}`,
    `Sin diferencia: ${total - withDiscrepancy}`,
  ])
  summaryRow.font = { bold: true }

  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: metaRow + 1 }]

  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}
