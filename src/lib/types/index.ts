// =============================================================================
// GastroStock - Core TypeScript Types
// =============================================================================

export type UserRole = 'admin' | 'manager' | 'supervisor' | 'operator' | 'auditor'
export type LocationType = 'restaurant' | 'cafe' | 'bar' | 'events' | 'warehouse' | 'other'
export type MovementType =
  | 'opening_stock'
  | 'purchase_in'
  | 'production_in'
  | 'consumption_out'
  | 'transfer_out'
  | 'transfer_in'
  | 'waste_out'
  | 'manual_adjustment'
  | 'physical_count'
  | 'reconciliation_adjustment'

export type TransferStatus = 'draft' | 'pending_approval' | 'in_transit' | 'received' | 'partial' | 'cancelled'
export type PurchaseStatus = 'draft' | 'ordered' | 'partial' | 'received' | 'cancelled'
export type PhysicalCountStatus = 'draft' | 'in_progress' | 'pending_review' | 'approved' | 'reconciled' | 'cancelled'
export type AlertType = 'low_stock' | 'zero_stock' | 'negative_stock' | 'overstock' | 'expiry'
export type StockStatus = 'ok' | 'warning' | 'low' | 'zero'

// =============================================================================
// ENTITIES
// =============================================================================

export interface Role {
  id: string
  name: UserRole
  label: string
  description: string | null
  permissions: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url: string | null
  phone: string | null
  is_active: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface Location {
  id: string
  code: string
  name: string
  type: LocationType
  address: string | null
  phone: string | null
  timezone: string
  color: string
  is_active: boolean
  sort_order: number
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface UserLocation {
  id: string
  user_id: string
  location_id: string
  role: UserRole
  is_primary: boolean
  created_at: string
  location?: Location
  user?: User
}

export interface Category {
  id: string
  code: string
  prefix: string
  name: string
  description: string | null
  color: string
  icon: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Unit {
  id: string
  code: string
  name: string
  symbol: string
  base_unit_id: string | null
  conversion_factor: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SkuSequence {
  id: string
  category_id: string
  last_sequence: number
  updated_at: string
}

export interface Supplier {
  id: string
  code: string
  name: string
  contact: string | null
  email: string | null
  phone: string | null
  address: string | null
  tax_id: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  sku: string
  name: string
  description: string | null
  category_id: string
  unit_id: string
  cost_price: number | null
  sale_price: number | null
  min_stock: number
  max_stock: number | null
  reorder_point: number | null
  image_url: string | null
  barcode: string | null
  is_active: boolean
  is_legacy: boolean
  notes: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  created_by: string | null
  // Joined
  category?: Category
  unit?: Unit
}

export interface ProductAlias {
  id: string
  product_id: string
  alias: string
  source: string
  created_at: string
}

export interface LocationProduct {
  id: string
  product_id: string
  location_id: string
  min_stock: number | null
  max_stock: number | null
  reorder_point: number | null
  preferred_supplier_id: string | null
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface StockMovement {
  id: string
  product_id: string
  location_id: string
  movement_type: MovementType
  quantity: number
  unit_cost: number | null
  total_cost: number | null
  reference_type: string | null
  reference_id: string | null
  reference_code: string | null
  running_balance: number | null
  notes: string | null
  performed_by: string
  performed_at: string
  idempotency_key: string | null
  created_at: string
  // Joined
  product?: Product
  location?: Location
  performed_by_user?: User
}

export interface StockBalance {
  id: string
  product_id: string
  location_id: string
  current_stock: number
  last_movement_at: string | null
  last_updated_at: string
  // Joined
  product?: Product
  location?: Location
}

export interface PurchaseEntry {
  id: string
  code: string
  supplier_id: string | null
  location_id: string
  status: PurchaseStatus
  entry_date: string
  invoice_number: string | null
  invoice_date: string | null
  total_amount: number | null
  notes: string | null
  created_by: string
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  // Joined
  supplier?: Supplier
  location?: Location
  items?: PurchaseEntryItem[]
}

export interface PurchaseEntryItem {
  id: string
  purchase_entry_id: string
  product_id: string
  quantity_ordered: number
  quantity_received: number
  unit_cost: number | null
  line_total: number | null
  notes: string | null
  created_at: string
  product?: Product
}

export interface Transfer {
  id: string
  code: string
  from_location_id: string
  to_location_id: string
  status: TransferStatus
  transfer_date: string
  notes: string | null
  created_by: string
  approved_by: string | null
  approved_at: string | null
  sent_by: string | null
  sent_at: string | null
  received_by: string | null
  received_at: string | null
  created_at: string
  updated_at: string
  from_location?: Location
  to_location?: Location
  items?: TransferItem[]
}

export interface TransferItem {
  id: string
  transfer_id: string
  product_id: string
  quantity_requested: number
  quantity_sent: number
  quantity_received: number
  notes: string | null
  created_at: string
  product?: Product
}

export interface PhysicalCount {
  id: string
  code: string
  location_id: string
  status: PhysicalCountStatus
  count_date: string
  notes: string | null
  total_items: number
  items_counted: number
  total_variance: number | null
  created_by: string
  reviewed_by: string | null
  reviewed_at: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  location?: Location
  items?: PhysicalCountItem[]
}

export interface PhysicalCountItem {
  id: string
  physical_count_id: string
  product_id: string
  system_quantity: number
  counted_quantity: number | null
  difference: number | null
  unit_cost: number | null
  value_difference: number | null
  status: string
  notes: string | null
  counted_at: string | null
  created_at: string
  product?: Product
}

export interface StockAlertRule {
  id: string
  product_id: string
  location_id: string | null
  alert_type: AlertType
  threshold: number
  notify_channels: string[]
  notify_users: string[]
  is_active: boolean
  last_triggered_at: string | null
  created_at: string
  updated_at: string
  product?: Product
  location?: Location
}

export interface AuditLog {
  id: string
  table_name: string
  record_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT'
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  changed_by: string | null
  changed_at: string
  ip_address: string | null
  user_agent: string | null
  session_id: string | null
}

// =============================================================================
// VIEW TYPES (from SQL views)
// =============================================================================

export interface CurrentStockRow {
  product_id: string
  sku: string
  product_name: string
  category_id: string
  category_name: string
  category_color: string
  unit_symbol: string
  location_id: string
  location_name: string
  location_code: string
  location_color: string
  current_stock: number
  min_stock: number
  reorder_point: number | null
  cost_price: number | null
  stock_value: number
  last_movement_at: string | null
  stock_status: StockStatus
}

export interface MovementHistoryRow {
  id: string
  performed_at: string
  movement_type: MovementType
  quantity: number
  unit_cost: number | null
  total_cost: number | null
  running_balance: number | null
  reference_type: string | null
  reference_code: string | null
  notes: string | null
  product_id: string
  sku: string
  product_name: string
  category_name: string
  unit_symbol: string
  location_id: string
  location_name: string
  performed_by_name: string
}

// =============================================================================
// FORM INPUT TYPES
// =============================================================================

export interface QuickMovementInput {
  product_id: string
  location_id: string
  movement_type: MovementType
  quantity: number
  unit_cost?: number
  notes?: string
  idempotency_key?: string
}

export interface PurchaseEntryInput {
  supplier_id?: string
  location_id: string
  entry_date: string
  invoice_number?: string
  invoice_date?: string
  notes?: string
  items: {
    product_id: string
    quantity_ordered: number
    quantity_received: number
    unit_cost?: number
  }[]
}

export interface TransferInput {
  from_location_id: string
  to_location_id: string
  transfer_date: string
  notes?: string
  items: {
    product_id: string
    quantity_requested: number
    quantity_sent?: number
  }[]
}

export interface PhysicalCountInput {
  location_id: string
  count_date: string
  notes?: string
}

export interface ProductInput {
  name: string
  category_id: string
  unit_id: string
  description?: string
  cost_price?: number
  sale_price?: number
  min_stock?: number
  max_stock?: number
  notes?: string
  barcode?: string
}

// =============================================================================
// UI STATE TYPES
// =============================================================================

export interface DashboardStats {
  totalProducts: number
  totalLocations: number
  totalStockValue: number
  lowStockAlerts: number
  zeroStockItems: number
  movementsToday: number
  pendingTransfers: number
  pendingCounts: number
}

export interface LocationDashboard {
  location: Location
  stats: {
    totalProducts: number
    totalStockValue: number
    lowStockCount: number
    zeroStockCount: number
    recentMovements: number
  }
  stockItems: CurrentStockRow[]
  recentMovements: MovementHistoryRow[]
  alerts: CurrentStockRow[]
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// =============================================================================
// MOVEMENT TYPE METADATA
// =============================================================================

export const MOVEMENT_TYPE_CONFIG: Record<MovementType, {
  label: string
  labelEs: string
  sign: 'positive' | 'negative' | 'both'
  color: string
  icon: string
}> = {
  opening_stock:            { label: 'Opening Stock',      labelEs: 'Stock Inicial',      sign: 'positive', color: '#3b82f6', icon: 'archive' },
  purchase_in:              { label: 'Purchase In',        labelEs: 'Compra',             sign: 'positive', color: '#22c55e', icon: 'shopping-cart' },
  production_in:            { label: 'Production In',      labelEs: 'Producción',         sign: 'positive', color: '#10b981', icon: 'factory' },
  consumption_out:          { label: 'Consumption Out',    labelEs: 'Consumo',            sign: 'negative', color: '#f59e0b', icon: 'minus-circle' },
  transfer_out:             { label: 'Transfer Out',       labelEs: 'Transferencia Sal.', sign: 'negative', color: '#8b5cf6', icon: 'arrow-right' },
  transfer_in:              { label: 'Transfer In',        labelEs: 'Transferencia Ent.', sign: 'positive', color: '#6366f1', icon: 'arrow-left' },
  waste_out:                { label: 'Waste Out',          labelEs: 'Merma',              sign: 'negative', color: '#ef4444', icon: 'trash-2' },
  manual_adjustment:        { label: 'Manual Adjustment',  labelEs: 'Ajuste Manual',      sign: 'both',     color: '#64748b', icon: 'sliders' },
  physical_count:           { label: 'Physical Count',     labelEs: 'Conteo Físico',      sign: 'both',     color: '#0ea5e9', icon: 'clipboard-list' },
  reconciliation_adjustment:{ label: 'Reconciliation',     labelEs: 'Reconciliación',     sign: 'both',     color: '#a78bfa', icon: 'git-merge' },
}

export const STOCK_STATUS_CONFIG: Record<StockStatus, {
  label: string
  color: string
  bgColor: string
  textColor: string
}> = {
  ok:      { label: 'Normal',    color: '#22c55e', bgColor: '#f0fdf4', textColor: '#15803d' },
  warning: { label: 'Bajo',      color: '#f59e0b', bgColor: '#fffbeb', textColor: '#b45309' },
  low:     { label: 'Crítico',   color: '#ef4444', bgColor: '#fef2f2', textColor: '#dc2626' },
  zero:    { label: 'Sin Stock', color: '#dc2626', bgColor: '#fef2f2', textColor: '#b91c1c' },
}
