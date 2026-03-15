/**
 * lib/export/suppliers-export.ts
 */

import ExcelJS from 'exceljs'
import type { SupplierRow } from '@/lib/server/suppliers'

export async function buildSuppliersExcel(
  suppliers: SupplierRow[],
  options: { generatedAt?: Date } = {}
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'GastroStock'

  const ws = wb.addWorksheet('Proveedores')

  ws.mergeCells('A1:H1')
  ws.getCell('A1').value = 'Listado de Proveedores'
  ws.getCell('A1').font = { bold: true, size: 14 }
  ws.getCell('A1').alignment = { horizontal: 'center' }

  ws.mergeCells('A2:H2')
  ws.getCell('A2').value = `Generado: ${(options.generatedAt ?? new Date()).toLocaleString('es-AR')}`
  ws.getCell('A2').font = { size: 9, color: { argb: 'FF666666' } }
  ws.getCell('A2').alignment = { horizontal: 'center' }

  ws.addRow([])

  const headerRow = ws.addRow([
    'Nombre', 'Contacto', 'Teléfono', 'Email', 'CUIT/Tax ID', 'Estado', 'Notas', 'Alta',
  ])
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e293b' } }
  headerRow.height = 22

  ws.columns = [
    { width: 28 }, { width: 22 }, { width: 16 },
    { width: 26 }, { width: 16 }, { width: 10 },
    { width: 30 }, { width: 14 },
  ]

  for (const s of suppliers) {
    const dataRow = ws.addRow([
      s.name,
      s.contact_name ?? '',
      s.phone ?? '',
      s.email ?? '',
      s.tax_id ?? '',
      s.is_active ? 'Activo' : 'Inactivo',
      s.notes ?? '',
      new Date(s.created_at).toLocaleDateString('es-AR'),
    ])

    const statusCell = dataRow.getCell(6)
    statusCell.font = {
      bold: true,
      color: { argb: s.is_active ? 'FF22C55E' : 'FFEF4444' },
    }
    statusCell.alignment = { horizontal: 'center' }
  }

  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: 8 } }
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }]

  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}
