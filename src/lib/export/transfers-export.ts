/**
 * lib/export/transfers-export.ts
 * Excel export for stock transfers.
 */

import ExcelJS from 'exceljs'
import type { TransferRow, TransferItemRow } from '@/lib/server/transfers'
import { TRANSFER_STATUS_LABELS } from '@/lib/validations/transfers'

export async function buildTransferDetailExcel(
  transfer: TransferRow,
  items: TransferItemRow[],
  options: { generatedAt?: Date } = {}
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'GastroStock'
  wb.created = options.generatedAt ?? new Date()

  const ws = wb.addWorksheet('Transferencia')

  ws.mergeCells('A1:H1')
  const t = ws.getCell('A1')
  t.value = `Transferencia ${transfer.transfer_code ?? transfer.id.slice(0, 8)}`
  t.font = { bold: true, size: 14 }
  t.alignment = { horizontal: 'center' }

  const meta = [
    ['Origen', transfer.from_location_name],
    ['Destino', transfer.to_location_name],
    ['Fecha', transfer.transfer_date],
    ['Estado', TRANSFER_STATUS_LABELS[transfer.status as keyof typeof TRANSFER_STATUS_LABELS] ?? transfer.status],
    ['Solicitado por', transfer.requested_by_name ?? ''],
    ['Enviado', transfer.sent_at ? new Date(transfer.sent_at).toLocaleString('es-AR') : '—'],
    ['Recibido', transfer.received_at ? new Date(transfer.received_at).toLocaleString('es-AR') : '—'],
    ['Notas', transfer.notes ?? ''],
  ]

  let r = 2
  for (const [label, val] of meta) {
    ws.getCell(`A${r}`).value = label
    ws.getCell(`A${r}`).font = { bold: true }
    ws.mergeCells(`B${r}:H${r}`)
    ws.getCell(`B${r}`).value = val
    r++
  }

  ws.addRow([])

  const headerRow = ws.addRow([
    'SKU', 'Producto', 'Unidad',
    'Qty Solicitada', 'Qty Enviada', 'Qty Recibida', 'Diferencia', 'Costo Unit.',
  ])
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e293b' } }
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' }

  ws.columns = [
    { width: 12 },
    { width: 30 },
    { width: 10 },
    { width: 16 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 12 },
  ]

  for (const item of items) {
    const diff = item.quantity_received - item.quantity_sent

    const dataRow = ws.addRow([
      item.sku,
      item.product_name,
      item.unit_symbol,
      item.quantity_requested,
      item.quantity_sent,
      item.quantity_received,
      diff,
      item.unit_cost ?? '',
    ])

    const diffCell = dataRow.getCell(7)
    diffCell.numFmt = '+#,##0.###;-#,##0.###'
    if (diff !== 0) {
      diffCell.font = {
        color: { argb: diff > 0 ? 'FF22C55E' : 'FFEF4444' },
        bold: true,
      }
    }

    if (item.unit_cost != null) dataRow.getCell(8).numFmt = '#,##0.00'
  }

  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: r + 1 }]

  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}

export async function buildTransfersListExcel(
  transfers: TransferRow[],
  options: { generatedAt?: Date } = {}
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'GastroStock'

  const ws = wb.addWorksheet('Transferencias')

  ws.mergeCells('A1:J1')
  const t = ws.getCell('A1')
  t.value = 'Listado de Transferencias'
  t.font = { bold: true, size: 14 }
  t.alignment = { horizontal: 'center' }

  ws.mergeCells('A2:J2')
  ws.getCell('A2').value = `Generado: ${(options.generatedAt ?? new Date()).toLocaleString('es-AR')}`
  ws.getCell('A2').font = { size: 9, color: { argb: 'FF666666' } }
  ws.getCell('A2').alignment = { horizontal: 'center' }

  ws.addRow([])

  const headerRow = ws.addRow([
    'Código', 'Fecha', 'Origen', 'Destino', 'Estado',
    'Items', 'Solicitado por', 'Enviado en', 'Recibido en', 'Notas',
  ])
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e293b' } }
  headerRow.height = 22

  ws.columns = [
    { width: 16 },
    { width: 12 },
    { width: 18 },
    { width: 18 },
    { width: 14 },
    { width: 8 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
    { width: 30 },
  ]

  for (const tr of transfers) {
    ws.addRow([
      tr.transfer_code ?? tr.id.slice(0, 8),
      tr.transfer_date,
      tr.from_location_name,
      tr.to_location_name,
      TRANSFER_STATUS_LABELS[tr.status as keyof typeof TRANSFER_STATUS_LABELS] ?? tr.status,
      tr.item_count,
      tr.requested_by_name ?? '',
      tr.sent_at ? new Date(tr.sent_at).toLocaleString('es-AR') : '—',
      tr.received_at ? new Date(tr.received_at).toLocaleString('es-AR') : '—',
      tr.notes ?? '',
    ])
  }

  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: 10 } }
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }]

  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}
