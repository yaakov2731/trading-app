// =============================================================================
// Excel / Google Sheets Export Mappers
// Transforms DB rows into flat, spreadsheet-ready objects.
// =============================================================================

import { formatDate, formatDateTime, formatMovementType, MOVEMENT_LABELS } from '@/lib/utils/format'
import type { MovementType } from '@/lib/types'

// =============================================================================
// Column definitions (for building header rows / metadata)
// =============================================================================

export interface ExcelColumn {
  key:     string
  label:   string
  width?:  number
  type?:   'string' | 'number' | 'currency' | 'date' | 'datetime'
  format?: string
}

// =============================================================================
// Products mapper
// =============================================================================

export const PRODUCT_COLUMNS: ExcelColumn[] = [
  { key: 'sku',          label: 'SKU',            width: 14, type: 'string' },
  { key: 'name',         label: 'Producto',        width: 40, type: 'string' },
  { key: 'category',     label: 'Categoría',       width: 20, type: 'string' },
  { key: 'unit',         label: 'Unidad',          width: 12, type: 'string' },
  { key: 'cost_price',   label: 'Costo',           width: 14, type: 'currency' },
  { key: 'sale_price',   label: 'Precio Venta',    width: 14, type: 'currency' },
  { key: 'min_stock',    label: 'Stock Mínimo',    width: 14, type: 'number' },
  { key: 'max_stock',    label: 'Stock Máximo',    width: 14, type: 'number' },
  { key: 'barcode',      label: 'Código de Barras',width: 20, type: 'string' },
  { key: 'is_active',    label: 'Activo',          width: 10, type: 'string' },
  { key: 'created_at',   label: 'Fecha Alta',      width: 16, type: 'date' },
]

export function mapProductToExcelRow(product: any): Record<string, any> {
  return {
    sku:        product.sku,
    name:       product.name,
    category:   product.category?.name ?? '',
    unit:       product.unit?.name ?? '',
    cost_price: product.cost_price ?? '',
    sale_price: product.sale_price ?? '',
    min_stock:  product.min_stock,
    max_stock:  product.max_stock ?? '',
    barcode:    product.barcode ?? '',
    is_active:  product.is_active ? 'Sí' : 'No',
    created_at: formatDate(product.created_at),
  }
}

// =============================================================================
// Current stock mapper
// =============================================================================

export const STOCK_COLUMNS: ExcelColumn[] = [
  { key: 'sku',           label: 'SKU',          width: 14,  type: 'string' },
  { key: 'product_name',  label: 'Producto',     width: 40,  type: 'string' },
  { key: 'category',      label: 'Categoría',    width: 20,  type: 'string' },
  { key: 'location',      label: 'Local',        width: 20,  type: 'string' },
  { key: 'current_stock', label: 'Stock Actual', width: 14,  type: 'number' },
  { key: 'unit',          label: 'Unidad',       width: 12,  type: 'string' },
  { key: 'min_stock',     label: 'Mínimo',       width: 12,  type: 'number' },
  { key: 'stock_status',  label: 'Estado',       width: 14,  type: 'string' },
  { key: 'stock_value',   label: 'Valor Stock',  width: 16,  type: 'currency' },
  { key: 'last_movement', label: 'Últ. Movim.',  width: 18,  type: 'datetime' },
]

const STOCK_STATUS_LABELS: Record<string, string> = {
  ok:      'Normal',
  warning: 'Bajo',
  low:     'Crítico',
  zero:    'Sin Stock',
}

export function mapStockToExcelRow(row: any): Record<string, any> {
  return {
    sku:           row.sku ?? row.product_sku ?? '',
    product_name:  row.product_name ?? row.name ?? '',
    category:      row.category_name ?? '',
    location:      row.location_name ?? '',
    current_stock: row.current_stock ?? 0,
    unit:          row.unit_symbol ?? row.unit_name ?? '',
    min_stock:     row.min_stock ?? 0,
    stock_status:  STOCK_STATUS_LABELS[row.stock_status] ?? row.stock_status ?? '',
    stock_value:   row.unit_cost != null ? row.current_stock * row.unit_cost : '',
    last_movement: row.last_movement_at ? formatDateTime(row.last_movement_at) : '',
  }
}

// =============================================================================
// Movements mapper
// =============================================================================

export const MOVEMENT_COLUMNS: ExcelColumn[] = [
  { key: 'date',         label: 'Fecha / Hora',    width: 18, type: 'datetime' },
  { key: 'sku',          label: 'SKU',             width: 14, type: 'string' },
  { key: 'product',      label: 'Producto',        width: 40, type: 'string' },
  { key: 'category',     label: 'Categoría',       width: 20, type: 'string' },
  { key: 'location',     label: 'Local',           width: 20, type: 'string' },
  { key: 'type',         label: 'Tipo',            width: 26, type: 'string' },
  { key: 'quantity',     label: 'Cantidad',        width: 14, type: 'number' },
  { key: 'unit',         label: 'Unidad',          width: 12, type: 'string' },
  { key: 'unit_cost',    label: 'Costo Unit.',     width: 14, type: 'currency' },
  { key: 'total_cost',   label: 'Costo Total',     width: 14, type: 'currency' },
  { key: 'balance',      label: 'Saldo',           width: 12, type: 'number' },
  { key: 'reference',    label: 'Referencia',      width: 20, type: 'string' },
  { key: 'notes',        label: 'Notas',           width: 40, type: 'string' },
  { key: 'user',         label: 'Usuario',         width: 24, type: 'string' },
]

export function mapMovementToExcelRow(mv: any): Record<string, any> {
  return {
    date:       formatDateTime(mv.performed_at),
    sku:        mv.sku ?? '',
    product:    mv.product_name ?? '',
    category:   mv.category_name ?? '',
    location:   mv.location_name ?? '',
    type:       MOVEMENT_LABELS[mv.movement_type as MovementType] ?? mv.movement_type,
    quantity:   mv.quantity ?? 0,
    unit:       mv.unit_symbol ?? '',
    unit_cost:  mv.unit_cost ?? '',
    total_cost: mv.total_cost ?? '',
    balance:    mv.running_balance ?? '',
    reference:  mv.reference_code ?? '',
    notes:      mv.notes ?? '',
    user:       mv.performed_by_name ?? '',
  }
}

// =============================================================================
// Purchase entries mapper
// =============================================================================

export const PURCHASE_COLUMNS: ExcelColumn[] = [
  { key: 'date',      label: 'Fecha',         width: 14, type: 'date' },
  { key: 'code',      label: 'Código',        width: 16, type: 'string' },
  { key: 'supplier',  label: 'Proveedor',     width: 30, type: 'string' },
  { key: 'location',  label: 'Local',         width: 20, type: 'string' },
  { key: 'sku',       label: 'SKU',           width: 14, type: 'string' },
  { key: 'product',   label: 'Producto',      width: 40, type: 'string' },
  { key: 'qty_ord',   label: 'Cant. Pedida',  width: 14, type: 'number' },
  { key: 'qty_rec',   label: 'Cant. Recibida',width: 14, type: 'number' },
  { key: 'unit_cost', label: 'Costo Unit.',   width: 14, type: 'currency' },
  { key: 'line_total',label: 'Total Línea',   width: 14, type: 'currency' },
  { key: 'reference', label: 'Referencia',    width: 20, type: 'string' },
  { key: 'status',    label: 'Estado',        width: 14, type: 'string' },
]

const PURCHASE_STATUS_LABELS: Record<string, string> = {
  draft:     'Borrador',
  ordered:   'Pedido',
  received:  'Recibido',
  cancelled: 'Cancelado',
}

export function mapPurchaseToExcelRows(purchase: any): Array<Record<string, any>> {
  const baseRow = {
    date:      formatDate(purchase.entry_date),
    code:      purchase.entry_code ?? purchase.code ?? '',
    supplier:  purchase.supplier?.name ?? 'Sin proveedor',
    location:  purchase.location?.name ?? '',
    status:    PURCHASE_STATUS_LABELS[purchase.status] ?? purchase.status,
    reference: purchase.reference_number ?? purchase.invoice_number ?? '',
  }

  if (!purchase.items?.length) {
    return [{ ...baseRow, sku: '', product: '', qty_ord: '', qty_rec: '', unit_cost: '', line_total: '' }]
  }

  return purchase.items.map((item: any) => ({
    ...baseRow,
    sku:       item.product?.sku ?? '',
    product:   item.product?.name ?? '',
    qty_ord:   item.quantity_ordered ?? item.quantity_expected ?? '',
    qty_rec:   item.quantity_received ?? '',
    unit_cost: item.unit_cost ?? '',
    line_total:item.total_cost ?? (item.quantity_received * (item.unit_cost ?? 0)) || '',
  }))
}

// =============================================================================
// Transfer mapper
// =============================================================================

export const TRANSFER_COLUMNS: ExcelColumn[] = [
  { key: 'date',       label: 'Fecha',         width: 14, type: 'date' },
  { key: 'code',       label: 'Código',        width: 16, type: 'string' },
  { key: 'from',       label: 'Origen',        width: 20, type: 'string' },
  { key: 'to',         label: 'Destino',       width: 20, type: 'string' },
  { key: 'sku',        label: 'SKU',           width: 14, type: 'string' },
  { key: 'product',    label: 'Producto',      width: 40, type: 'string' },
  { key: 'quantity',   label: 'Cantidad',      width: 14, type: 'number' },
  { key: 'unit',       label: 'Unidad',        width: 12, type: 'string' },
  { key: 'status',     label: 'Estado',        width: 14, type: 'string' },
]

const TRANSFER_STATUS_LABELS: Record<string, string> = {
  pending:    'Pendiente',
  in_transit: 'En tránsito',
  completed:  'Completada',
  cancelled:  'Cancelada',
}

export function mapTransferToExcelRows(transfer: any): Array<Record<string, any>> {
  const baseRow = {
    date:   formatDate(transfer.transfer_date),
    code:   transfer.transfer_code ?? transfer.code ?? '',
    from:   transfer.from_location?.name ?? '',
    to:     transfer.to_location?.name ?? '',
    status: TRANSFER_STATUS_LABELS[transfer.status] ?? transfer.status,
  }

  if (!transfer.items?.length) {
    return [{ ...baseRow, sku: '', product: '', quantity: '', unit: '' }]
  }

  return transfer.items.map((item: any) => ({
    ...baseRow,
    sku:      item.product?.sku ?? '',
    product:  item.product?.name ?? '',
    quantity: item.quantity ?? item.quantity_sent ?? '',
    unit:     item.product?.unit?.symbol ?? '',
  }))
}

// =============================================================================
// Legacy snapshot mapper
// =============================================================================

export const SNAPSHOT_COLUMNS: ExcelColumn[] = [
  { key: 'date',       label: 'Fecha',      width: 14, type: 'date' },
  { key: 'sku',        label: 'SKU',        width: 14, type: 'string' },
  { key: 'product',    label: 'Producto',   width: 40, type: 'string' },
  { key: 'location',   label: 'Local',      width: 20, type: 'string' },
  { key: 'quantity',   label: 'Cantidad',   width: 14, type: 'number' },
  { key: 'unit',       label: 'Unidad',     width: 12, type: 'string' },
  { key: 'unit_cost',  label: 'Costo Unit.',width: 14, type: 'currency' },
  { key: 'source',     label: 'Fuente',     width: 20, type: 'string' },
  { key: 'notes',      label: 'Notas',      width: 40, type: 'string' },
]

export function mapSnapshotToExcelRow(row: any): Record<string, any> {
  return {
    date:      formatDate(row.snapshot_date ?? row.date),
    sku:       row.sku ?? '',
    product:   row.product_name ?? row.name ?? '',
    location:  row.location_name ?? '',
    quantity:  row.quantity ?? 0,
    unit:      row.unit_symbol ?? '',
    unit_cost: row.unit_cost ?? '',
    source:    row.import_source ?? 'Importación',
    notes:     row.notes ?? '',
  }
}

// =============================================================================
// Utility: flatten nested rows into a single array
// e.g. for purchases/transfers that expand to one row per line item
// =============================================================================

export function flattenToRows<T>(
  records: T[],
  mapFn: (record: T) => Array<Record<string, any>>
): Array<Record<string, any>> {
  return records.flatMap(mapFn)
}
