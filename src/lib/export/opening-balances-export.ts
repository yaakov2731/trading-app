/**
 * lib/export/opening-balances-export.ts
 * Excel export for opening balance candidates.
 */

import ExcelJS from 'exceljs'
import type { OpeningBalanceCandidate } from '@/lib/server/opening-balances'

export async function buildOpeningBalancesExcel(
  candidates: OpeningBalanceCandidate[]
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Sistema de Inventario'
  wb.created = new Date()

  const ws = wb.addWorksheet('Saldos Iniciales', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  ws.columns = [
    { header: 'SKU', key: 'sku', width: 16 },
    { header: 'Producto (raw)', key: 'product_name', width: 30 },
    { header: 'Producto vinculado', key: 'matched_product', width: 30 },
    { header: 'Cantidad', key: 'quantity', width: 12 },
    { header: 'Cantidad override', key: 'override_qty', width: 14 },
    { header: 'Unidad', key: 'unit', width: 10 },
    { header: 'Ubicación (raw)', key: 'location_raw', width: 20 },
    { header: 'Ubicación vinculada', key: 'matched_location', width: 20 },
    { header: 'Fecha snapshot', key: 'snapshot_date', width: 18 },
    { header: 'Confianza', key: 'confidence', width: 12 },
    { header: 'Estado', key: 'status', width: 12 },
    { header: 'Notas', key: 'notes', width: 30 },
  ]

  const headerRow = ws.getRow(1)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }
    cell.alignment = { vertical: 'middle' }
  })

  const STATUS_COLORS: Record<string, string> = {
    pending:  'FFFEF3C7',
    approved: 'FFD1FAE5',
    excluded: 'FFF1F5F9',
    applied:  'FFE0F2FE',
  }

  const CONFIDENCE_COLORS: Record<string, string> = {
    high:       'FFD1FAE5',
    medium:     'FFFEF3C7',
    low:        'FFFEE2E2',
    unresolved: 'FFFEE2E2',
  }

  for (const c of candidates) {
    const dataRow = ws.addRow({
      sku: c.matched_product_sku ?? c.sku ?? '',
      product_name: c.product_name ?? '',
      matched_product: c.matched_product_name ?? '—',
      quantity: c.quantity,
      override_qty: c.override_quantity ?? '',
      unit: c.unit_raw ?? '',
      location_raw: c.location_raw ?? '',
      matched_location: c.matched_location_name ?? '—',
      snapshot_date: c.snapshot_datetime
        ? new Date(c.snapshot_datetime).toLocaleDateString('es-AR')
        : '',
      confidence: c.confidence,
      status: c.status,
      notes: c.notes ?? '',
    })

    const statusColor = STATUS_COLORS[c.status]
    if (statusColor) {
      const statusCell = dataRow.getCell('status')
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusColor } }
    }

    const confColor = CONFIDENCE_COLORS[c.confidence]
    if (confColor) {
      const confCell = dataRow.getCell('confidence')
      confCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: confColor } }
    }

    // Highlight unresolved rows
    if (!c.matched_product_id || !c.matched_location_id) {
      const qtyCell = dataRow.getCell('quantity')
      qtyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }
    }

    dataRow.alignment = { vertical: 'middle' }
  }

  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: ws.columns.length },
  }

  // Summary sheet
  const summaryWs = wb.addWorksheet('Resumen')
  summaryWs.addRow(['Resumen de saldos iniciales'])
  summaryWs.addRow(['Total candidatos', candidates.length])
  summaryWs.addRow(['Pendientes', candidates.filter((c) => c.status === 'pending').length])
  summaryWs.addRow(['Aprobados', candidates.filter((c) => c.status === 'approved').length])
  summaryWs.addRow(['Excluidos', candidates.filter((c) => c.status === 'excluded').length])
  summaryWs.addRow(['Aplicados', candidates.filter((c) => c.status === 'applied').length])
  summaryWs.addRow(['Sin producto vinculado', candidates.filter((c) => !c.matched_product_id).length])
  summaryWs.addRow(['Sin ubicación vinculada', candidates.filter((c) => !c.matched_location_id).length])
  summaryWs.addRow(['Exportado el', new Date().toLocaleDateString('es-AR')])

  summaryWs.columns = [{ width: 30 }, { width: 15 }]

  return wb.xlsx.writeBuffer() as Promise<Buffer>
}
