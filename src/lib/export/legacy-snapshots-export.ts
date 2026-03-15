/**
 * lib/export/legacy-snapshots-export.ts
 * Excel export of raw legacy snapshot data from an import run.
 */

import ExcelJS from 'exceljs'
import type { ImportedRow } from '@/lib/server/migration-import'

export async function buildLegacySnapshotsExcel(
  rows: ImportedRow[],
  metadata: { filename: string; importType: string; exportedAt?: Date }
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Sistema de Inventario'
  wb.created = new Date()

  // Meta sheet
  const metaWs = wb.addWorksheet('Info')
  metaWs.addRow(['Archivo origen', metadata.filename])
  metaWs.addRow(['Tipo de importación', metadata.importType])
  metaWs.addRow(['Total filas', rows.length])
  metaWs.addRow(['Exportado el', (metadata.exportedAt ?? new Date()).toLocaleDateString('es-AR')])
  metaWs.columns = [{ width: 25 }, { width: 40 }]

  // Snapshot data sheet
  const ws = wb.addWorksheet('Snapshots', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  ws.columns = [
    { header: 'Fila #', key: 'row_number', width: 8 },
    { header: 'Estado', key: 'status', width: 14 },
    { header: 'Confianza', key: 'confidence', width: 12 },
    { header: 'SKU', key: 'sku', width: 16 },
    { header: 'Producto', key: 'product', width: 30 },
    { header: 'Stock', key: 'stock', width: 10 },
    { header: 'Unidad (raw)', key: 'unit_raw', width: 12 },
    { header: 'Unidad (normalizada)', key: 'unit_norm', width: 16 },
    { header: 'Ubicación', key: 'location', width: 20 },
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Hora', key: 'hora', width: 10 },
    { header: 'Responsable', key: 'responsable', width: 20 },
    { header: 'Notas', key: 'notes', width: 30 },
    { header: 'Problemas', key: 'issues', width: 60 },
  ]

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
    const raw = row.raw_data as Record<string, unknown>
    const issues = (row.issues ?? []).map((i) => `[${i.severity}] ${i.message}`).join(' | ')

    const dataRow = ws.addRow({
      row_number: row.row_number,
      status: row.status,
      confidence: row.confidence ?? '',
      sku: (parsed?.sku as string) ?? (raw.SKU as string) ?? '',
      product: (parsed?.productName as string) ?? (raw.PRODUCTO as string) ?? '',
      stock: (parsed?.quantity as number) ?? (raw.STOCK as string) ?? '',
      unit_raw: (parsed?.unitRaw as string) ?? (raw.UNIDAD as string) ?? '',
      unit_norm: (parsed?.unitNormalized as string) ?? '',
      location: (parsed?.locationRaw as string) ?? row.location_raw ?? (raw.UBICACION as string) ?? '',
      fecha: (raw.FECHA as string) ?? '',
      hora: (raw.HORA as string) ?? '',
      responsable: (parsed?.responsable as string) ?? (raw.RESPONSABLE as string) ?? '',
      notes: (parsed?.notes as string) ?? (raw.NOTA as string) ?? '',
      issues,
    })

    const color = STATUS_COLORS[row.status]
    if (color) {
      const statusCell = dataRow.getCell('status')
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } }
    }

    // Highlight issues column
    if (issues) {
      const issueCell = dataRow.getCell('issues')
      issueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } }
    }

    dataRow.alignment = { vertical: 'middle' }
  }

  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: ws.columns.length },
  }

  return wb.xlsx.writeBuffer() as Promise<Buffer>
}
