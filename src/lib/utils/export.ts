import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import type { ExportDataPayload } from '@/server/actions/export'
import { formatDate, formatDateTime, formatCurrency, formatQuantity } from './format'

// =============================================================================
// Excel Export — Professional Workbook Builder
// 20 sheets covering all operational data, reports, and audit trail
// =============================================================================

// Shared workbook styles (XLSX doesn't support rich CSS, but we define column widths / formats)
const COL_WIDTHS = {
  id:       { wch: 38 },
  sku:      { wch: 12 },
  name:     { wch: 30 },
  date:     { wch: 14 },
  number:   { wch: 12 },
  short:    { wch: 8  },
  long:     { wch: 45 },
  currency: { wch: 16 },
  qty:      { wch: 12 },
  status:   { wch: 15 },
}

function setColWidths(ws: XLSX.WorkSheet, widths: XLSX.ColInfo[]) {
  ws['!cols'] = widths
}

function buildSheet<T extends Record<string, unknown>>(
  rows:     T[],
  headers:  { key: keyof T; label: string; format?: 'date' | 'currency' | 'qty' | 'pct' }[],
  widths:   XLSX.ColInfo[]
): XLSX.WorkSheet {
  const data = [
    headers.map(h => h.label),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h.key]
        if (val == null) return ''
        if (h.format === 'date' && typeof val === 'string') return formatDate(val)
        if (h.format === 'currency' && typeof val === 'number') return val  // keep numeric for Excel
        if (h.format === 'qty' && typeof val === 'number') return val
        return val
      })
    ),
  ]

  const ws = XLSX.utils.aoa_to_sheet(data)
  setColWidths(ws, widths)
  return ws
}

// =============================================================================
// Main export function
// =============================================================================

export async function exportToExcel(payload: ExportDataPayload): Promise<void> {
  const wb = XLSX.utils.book_new()

  // ── PARAMETROS ─────────────────────────────────────────────────────────────
  const wsParams = XLSX.utils.aoa_to_sheet([
    ['GastroStock — Exportación de datos'],
    [''],
    ['Exportado el:', formatDateTime(payload.exportedAt)],
    ['Versión:',     '1.0'],
    [''],
    ['NOTA:', 'Este archivo es solo lectura. No editar manualmente.'],
    ['NOTA:', 'Los datos transaccionales están en la base de datos.'],
  ])
  wsParams['!cols'] = [{ wch: 20 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, wsParams, 'Parametros')

  // ── LOCALES ────────────────────────────────────────────────────────────────
  const wsLocales = buildSheet(
    payload.locations as any[],
    [
      { key: 'code',    label: 'Código'   },
      { key: 'name',    label: 'Nombre'   },
      { key: 'type',    label: 'Tipo'     },
      { key: 'address', label: 'Dirección'},
      { key: 'phone',   label: 'Teléfono' },
      { key: 'is_active', label: 'Activo' },
    ],
    [COL_WIDTHS.short, COL_WIDTHS.name, COL_WIDTHS.short, COL_WIDTHS.long, COL_WIDTHS.number, COL_WIDTHS.short]
  )
  XLSX.utils.book_append_sheet(wb, wsLocales, 'Locales')

  // ── CATEGORIAS ─────────────────────────────────────────────────────────────
  const wsCats = buildSheet(
    payload.categories as any[],
    [
      { key: 'code',   label: 'Código'  },
      { key: 'prefix', label: 'Prefijo SKU' },
      { key: 'name',   label: 'Nombre'  },
      { key: 'description', label: 'Descripción' },
    ],
    [COL_WIDTHS.short, COL_WIDTHS.short, COL_WIDTHS.name, COL_WIDTHS.long]
  )
  XLSX.utils.book_append_sheet(wb, wsCats, 'Categorias')

  // ── UNIDADES ───────────────────────────────────────────────────────────────
  const wsUnits = buildSheet(
    payload.units as any[],
    [
      { key: 'code',   label: 'Código'  },
      { key: 'name',   label: 'Nombre'  },
      { key: 'symbol', label: 'Símbolo' },
    ],
    [COL_WIDTHS.short, COL_WIDTHS.name, COL_WIDTHS.short]
  )
  XLSX.utils.book_append_sheet(wb, wsUnits, 'Unidades')

  // ── PRODUCTOS ──────────────────────────────────────────────────────────────
  const wsProducts = buildSheet(
    payload.products as any[],
    [
      { key: 'sku',          label: 'SKU'          },
      { key: 'name',         label: 'Nombre'        },
      { key: 'category',     label: 'Categoría',   },
      { key: 'unit',         label: 'Unidad'        },
      { key: 'cost_price',   label: 'Costo',   format: 'currency' },
      { key: 'min_stock',    label: 'Stock Mín.',  format: 'qty'    },
      { key: 'is_active',    label: 'Activo'        },
    ],
    [COL_WIDTHS.sku, COL_WIDTHS.name, COL_WIDTHS.name, COL_WIDTHS.short, COL_WIDTHS.currency, COL_WIDTHS.qty, COL_WIDTHS.short]
  )
  XLSX.utils.book_append_sheet(wb, wsProducts, 'Productos')

  // ── STOCK ACTUAL ───────────────────────────────────────────────────────────
  const wsStock = buildSheet(
    payload.currentStock as any[],
    [
      { key: 'location_name',  label: 'Local'         },
      { key: 'sku',            label: 'SKU'            },
      { key: 'product_name',   label: 'Producto'       },
      { key: 'category_name',  label: 'Categoría'      },
      { key: 'unit_symbol',    label: 'Unidad'         },
      { key: 'current_stock',  label: 'Stock Actual',  format: 'qty'      },
      { key: 'min_stock',      label: 'Stock Mínimo',  format: 'qty'      },
      { key: 'cost_price',     label: 'Costo Unit.',   format: 'currency' },
      { key: 'stock_value',    label: 'Valor Stock',   format: 'currency' },
      { key: 'stock_status',   label: 'Estado'         },
      { key: 'last_movement_at', label: 'Último Movim.', format: 'date' },
    ],
    [
      COL_WIDTHS.name, COL_WIDTHS.sku, COL_WIDTHS.name, COL_WIDTHS.name,
      COL_WIDTHS.short, COL_WIDTHS.qty, COL_WIDTHS.qty, COL_WIDTHS.currency,
      COL_WIDTHS.currency, COL_WIDTHS.status, COL_WIDTHS.date
    ]
  )
  XLSX.utils.book_append_sheet(wb, wsStock, 'Stock_Actual')

  // ── MOVIMIENTOS ────────────────────────────────────────────────────────────
  const wsMovements = buildSheet(
    payload.movements as any[],
    [
      { key: 'performed_at',   label: 'Fecha/Hora',     format: 'date'     },
      { key: 'location_name',  label: 'Local'                              },
      { key: 'sku',            label: 'SKU'                                },
      { key: 'product_name',   label: 'Producto'                           },
      { key: 'movement_type',  label: 'Tipo'                               },
      { key: 'quantity',       label: 'Cantidad',        format: 'qty'     },
      { key: 'unit_cost',      label: 'Costo Unit.',     format: 'currency'},
      { key: 'total_cost',     label: 'Total',           format: 'currency'},
      { key: 'running_balance',label: 'Saldo',           format: 'qty'     },
      { key: 'reference_code', label: 'Referencia'                         },
      { key: 'notes',          label: 'Observaciones'                      },
      { key: 'performed_by_name', label: 'Usuario'                         },
    ],
    [
      COL_WIDTHS.date, COL_WIDTHS.name, COL_WIDTHS.sku, COL_WIDTHS.name,
      COL_WIDTHS.status, COL_WIDTHS.qty, COL_WIDTHS.currency, COL_WIDTHS.currency,
      COL_WIDTHS.qty, COL_WIDTHS.number, COL_WIDTHS.long, COL_WIDTHS.name
    ]
  )
  XLSX.utils.book_append_sheet(wb, wsMovements, 'Movimientos')

  // ── COMPRAS ────────────────────────────────────────────────────────────────
  const purchaseRows = (payload.purchases as any[]).flatMap(p =>
    ((p.items as any[]) ?? []).map((item: any) => ({
      code:          p.code,
      entry_date:    p.entry_date,
      location_name: p.location?.name,
      supplier_name: p.supplier?.name,
      status:        p.status,
      sku:           item.product?.sku,
      product_name:  item.product?.name,
      qty_ordered:   item.quantity_ordered,
      qty_received:  item.quantity_received,
      unit_cost:     item.unit_cost,
      line_total:    item.line_total,
    }))
  )

  const wsPurchases = buildSheet(purchaseRows, [
    { key: 'code',         label: 'Nro. Compra'                    },
    { key: 'entry_date',   label: 'Fecha',        format: 'date'  },
    { key: 'location_name',label: 'Local'                          },
    { key: 'supplier_name',label: 'Proveedor'                      },
    { key: 'status',       label: 'Estado'                         },
    { key: 'sku',          label: 'SKU'                            },
    { key: 'product_name', label: 'Producto'                       },
    { key: 'qty_ordered',  label: 'Cant. Pedida',  format: 'qty'  },
    { key: 'qty_received', label: 'Cant. Recibida',format: 'qty'  },
    { key: 'unit_cost',    label: 'Costo Unit.',   format: 'currency' },
    { key: 'line_total',   label: 'Total',         format: 'currency' },
  ],
  [
    COL_WIDTHS.number, COL_WIDTHS.date, COL_WIDTHS.name, COL_WIDTHS.name,
    COL_WIDTHS.status, COL_WIDTHS.sku, COL_WIDTHS.name, COL_WIDTHS.qty,
    COL_WIDTHS.qty, COL_WIDTHS.currency, COL_WIDTHS.currency
  ])
  XLSX.utils.book_append_sheet(wb, wsPurchases, 'Compras')

  // ── TRANSFERENCIAS ─────────────────────────────────────────────────────────
  const transferRows = (payload.transfers as any[]).flatMap(t =>
    ((t.items as any[]) ?? []).map((item: any) => ({
      code:          t.code,
      transfer_date: t.transfer_date,
      from_location: t.from_location?.name,
      to_location:   t.to_location?.name,
      status:        t.status,
      sku:           item.product?.sku,
      product_name:  item.product?.name,
      qty_requested: item.quantity_requested,
      qty_sent:      item.quantity_sent,
      qty_received:  item.quantity_received,
    }))
  )

  const wsTransfers = buildSheet(transferRows, [
    { key: 'code',         label: 'Nro. Transfer.'                    },
    { key: 'transfer_date',label: 'Fecha',          format: 'date'   },
    { key: 'from_location',label: 'Origen'                            },
    { key: 'to_location',  label: 'Destino'                           },
    { key: 'status',       label: 'Estado'                            },
    { key: 'sku',          label: 'SKU'                               },
    { key: 'product_name', label: 'Producto'                          },
    { key: 'qty_requested',label: 'Cant. Solicitada',format: 'qty'   },
    { key: 'qty_sent',     label: 'Cant. Enviada',   format: 'qty'   },
    { key: 'qty_received', label: 'Cant. Recibida',  format: 'qty'   },
  ],
  [
    COL_WIDTHS.number, COL_WIDTHS.date, COL_WIDTHS.name, COL_WIDTHS.name,
    COL_WIDTHS.status, COL_WIDTHS.sku, COL_WIDTHS.name,
    COL_WIDTHS.qty, COL_WIDTHS.qty, COL_WIDTHS.qty
  ])
  XLSX.utils.book_append_sheet(wb, wsTransfers, 'Transferencias')

  // ── CONTEOS ────────────────────────────────────────────────────────────────
  const countRows = (payload.physicalCounts as any[]).flatMap(c =>
    ((c.items as any[]) ?? []).map((item: any) => ({
      code:           c.code,
      count_date:     c.count_date,
      location_name:  c.location?.name,
      status:         c.status,
      sku:            item.product?.sku,
      product_name:   item.product?.name,
      system_qty:     item.system_quantity,
      counted_qty:    item.counted_quantity,
      difference:     item.difference,
      value_diff:     item.value_difference,
    }))
  )

  const wsCounts = buildSheet(countRows, [
    { key: 'code',         label: 'Nro. Conteo'                      },
    { key: 'count_date',   label: 'Fecha',          format: 'date'  },
    { key: 'location_name',label: 'Local'                            },
    { key: 'status',       label: 'Estado'                           },
    { key: 'sku',          label: 'SKU'                              },
    { key: 'product_name', label: 'Producto'                         },
    { key: 'system_qty',   label: 'Stock Sistema',  format: 'qty'   },
    { key: 'counted_qty',  label: 'Stock Contado',  format: 'qty'   },
    { key: 'difference',   label: 'Diferencia',     format: 'qty'   },
    { key: 'value_diff',   label: 'Valor Dif.',     format: 'currency' },
  ],
  [
    COL_WIDTHS.number, COL_WIDTHS.date, COL_WIDTHS.name, COL_WIDTHS.status,
    COL_WIDTHS.sku, COL_WIDTHS.name, COL_WIDTHS.qty, COL_WIDTHS.qty,
    COL_WIDTHS.qty, COL_WIDTHS.currency
  ])
  XLSX.utils.book_append_sheet(wb, wsCounts, 'Conteos_Fisicos')

  // ── Save ───────────────────────────────────────────────────────────────────
  const fileName = `gastrostock_export_${formatDate(payload.exportedAt).replace(/\//g, '-')}.xlsx`
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveAs(blob, fileName)
}
