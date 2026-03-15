/**
 * lib/export/migration-review-export.ts
 * Excel export for migration review queue rows.
 */

import ExcelJS from 'exceljs'
import type { ReviewRow } from '@/lib/server/migration-review'

export async function buildMigrationReviewExcel(rows: ReviewRow[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Sistema de Inventario'
  wb.created = new Date()

  const ws = wb.addWorksheet('Revisión Migración', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  ws.columns = [
    { header: 'Fila #', key: 'row_number', width: 8 },
    { header: 'Archivo', key: 'filename', width: 30 },
    { header: 'Estado', key: 'status', width: 15 },
    { header: 'Confianza', key: 'confidence', width: 12 },
    { header: 'SKU', key: 'sku', width: 16 },
    { header: 'Producto', key: 'product', width: 30 },
    { header: 'Stock', key: 'stock', width: 10 },
    { header: 'Unidad', key: 'unit', width: 10 },
    { header: 'Ubicación (raw)', key: 'location', width: 20 },
    { header: 'Fecha snapshot', key: 'snapshot_date', width: 18 },
    { header: 'Problemas', key: 'issues', width: 50 },
  ]

  // Header row styling
  const headerRow = ws.getRow(1)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }
    cell.alignment = { vertical: 'middle' }
  })

  const STATUS_COLORS: Record<string, string> = {
    matched:      'FFD1FAE5',
    needs_review: 'FFFEF3C7',
    failed:       'FFFEE2E2',
    skipped:      'FFF1F5F9',
    pending:      'FFE0F2FE',
  }

  for (const row of rows) {
    const parsed = row.parsed_data as Record<string, unknown> | null
    const issueMessages = (row.issues ?? []).map((i) => `[${i.severity}] ${i.message}`).join(' | ')

    const dataRow = ws.addRow({
      row_number: row.row_number,
      filename: row.import_filename ?? '',
      status: row.status,
      confidence: row.confidence ?? '',
      sku: (parsed?.sku as string) ?? '',
      product: (parsed?.productName as string) ?? '',
      stock: (parsed?.quantity as number) ?? '',
      unit: (parsed?.unitNormalized as string) ?? (parsed?.unitRaw as string) ?? '',
      location: row.location_raw ?? '',
      snapshot_date: row.snapshot_datetime
        ? new Date(row.snapshot_datetime).toLocaleDateString('es-AR')
        : '',
      issues: issueMessages,
    })

    const color = STATUS_COLORS[row.status]
    if (color) {
      dataRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } }
      })
    }

    dataRow.alignment = { vertical: 'middle' }
  }

  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: ws.columns.length },
  }

  return wb.xlsx.writeBuffer() as Promise<Buffer>
}
