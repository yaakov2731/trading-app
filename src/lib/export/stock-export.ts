/**
 * lib/export/stock-export.ts
 * Excel export for stock balances (current inventory snapshot).
 */

import ExcelJS from 'exceljs'
import type { StockBalanceRow } from '@/lib/server/stock-queries'
import { formatQuantity, formatCurrency } from '@/lib/utils/format'

export async function buildStockExcel(
  rows: StockBalanceRow[],
  options: { locationName?: string; generatedAt?: Date } = {}
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'GastroStock'
  wb.created = options.generatedAt ?? new Date()

  const ws = wb.addWorksheet('Stock Actual', {
    pageSetup: { fitToPage: true, orientation: 'landscape' },
  })

  // ── Title row ───────────────────────────────────────────────────────────────
  ws.mergeCells('A1:K1')
  const titleCell = ws.getCell('A1')
  titleCell.value = options.locationName
    ? `Stock Actual — ${options.locationName}`
    : 'Stock Actual — Todas las ubicaciones'
  titleCell.font = { bold: true, size: 14 }
  titleCell.alignment = { horizontal: 'center' }

  ws.mergeCells('A2:K2')
  const dateCell = ws.getCell('A2')
  dateCell.value = `Generado: ${(options.generatedAt ?? new Date()).toLocaleString('es-AR')}`
  dateCell.font = { size: 9, color: { argb: 'FF666666' } }
  dateCell.alignment = { horizontal: 'center' }

  ws.addRow([]) // blank

  // ── Header row ──────────────────────────────────────────────────────────────
  const headers = [
    'SKU', 'Producto', 'Categoría', 'Unidad', 'Ubicación',
    'Stock Actual', 'Stock Mín', 'Stock Máx', 'Costo Unit.', 'Valor Total', 'Estado',
  ]

  const headerRow = ws.addRow(headers)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e293b' } }
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
  headerRow.height = 22

  // Column widths
  ws.columns = [
    { width: 12 }, // SKU
    { width: 30 }, // Producto
    { width: 18 }, // Categoría
    { width: 10 }, // Unidad
    { width: 18 }, // Ubicación
    { width: 14 }, // Stock Actual
    { width: 12 }, // Stock Mín
    { width: 12 }, // Stock Máx
    { width: 14 }, // Costo Unit.
    { width: 16 }, // Valor Total
    { width: 12 }, // Estado
  ]

  const STATUS_LABELS: Record<string, string> = {
    zero: 'Sin stock',
    low: 'Bajo',
    warning: 'Alerta',
    ok: 'OK',
  }

  const STATUS_COLORS: Record<string, string> = {
    zero: 'FFEF4444',
    low: 'FFFB923C',
    warning: 'FFFBBF24',
    ok: 'FF22C55E',
  }

  for (const row of rows) {
    const totalValue =
      row.current_stock != null && row.unit_cost != null
        ? row.current_stock * row.unit_cost
        : null

    const dataRow = ws.addRow([
      row.sku,
      row.product_name,
      row.category_name,
      row.unit_symbol,
      row.location_name,
      row.current_stock,
      row.effective_min_stock,
      row.max_stock ?? '',
      row.unit_cost ?? '',
      totalValue ?? '',
      STATUS_LABELS[row.stock_status] ?? row.stock_status,
    ])

    // Number formatting
    const stockCell = dataRow.getCell(6)
    stockCell.numFmt = '#,##0.###'

    const costCell = dataRow.getCell(9)
    if (row.unit_cost != null) costCell.numFmt = '#,##0.00'

    const valCell = dataRow.getCell(10)
    if (totalValue != null) valCell.numFmt = '#,##0.00'

    // Status color
    const statusCell = dataRow.getCell(11)
    statusCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: STATUS_COLORS[row.stock_status] ?? 'FFFFFFFF' },
    }
    statusCell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    statusCell.alignment = { horizontal: 'center' }

    // Zebra striping
    if (ws.rowCount % 2 === 0) {
      for (let col = 1; col <= 10; col++) {
        dataRow.getCell(col).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        }
      }
    }
  }

  // Auto-filter on header row
  ws.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: 4, column: 11 },
  }

  // Freeze header
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }]

  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}
