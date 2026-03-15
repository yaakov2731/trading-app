/**
 * lib/server/audit.ts
 * Reusable audit logging layer.
 * Fire-and-forget safe — errors are caught internally to avoid blocking primary ops.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'

// ── Audit event types ─────────────────────────────────────────────────────────

export type AuditAction =
  // Products
  | 'product.create' | 'product.update' | 'product.delete'
  // Purchases
  | 'purchase.create' | 'purchase.receive' | 'purchase.cancel'
  // Transfers
  | 'transfer.create' | 'transfer.send' | 'transfer.receive' | 'transfer.cancel'
  // Physical counts
  | 'count.create' | 'count.confirm'
  // Adjustments
  | 'adjustment.create'
  // Migration
  | 'migration.import' | 'migration.review_approve' | 'migration.review_reject'
  | 'migration.opening_balance_approve' | 'migration.cutover_execute' | 'migration.cutover_rollback'
  // Exports
  | 'export.create'
  // User management
  | 'user.create' | 'user.update' | 'user.role_change'
  // Settings
  | 'settings.update'

export interface AuditEvent {
  action: AuditAction
  actor_id: string
  target_table?: string
  target_id?: string
  location_id?: string
  metadata?: Record<string, unknown>
}

// ── Log audit event ───────────────────────────────────────────────────────────

export async function logAudit(event: AuditEvent): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient()
    await supabase.from('audit_logs').insert({
      action: event.action,
      actor_id: event.actor_id,
      target_table: event.target_table ?? null,
      target_id: event.target_id ?? null,
      location_id: event.location_id ?? null,
      metadata: event.metadata ?? null,
      created_at: new Date().toISOString(),
    })
  } catch (err) {
    // Never let audit failure block primary operation
    console.error('[audit] Failed to log event:', event.action, err)
  }
}

// ── Fire-and-forget helper ────────────────────────────────────────────────────

export function logAuditAsync(event: AuditEvent): void {
  logAudit(event).catch((err) => {
    console.error('[audit] Async log failed:', event.action, err)
  })
}

// ── Convenience wrappers ──────────────────────────────────────────────────────

export function auditProductCreate(actorId: string, productId: string, name: string) {
  return logAuditAsync({ action: 'product.create', actor_id: actorId, target_table: 'products', target_id: productId, metadata: { name } })
}

export function auditProductUpdate(actorId: string, productId: string, changes: Record<string, unknown>) {
  return logAuditAsync({ action: 'product.update', actor_id: actorId, target_table: 'products', target_id: productId, metadata: changes })
}

export function auditPurchaseCreate(actorId: string, entryId: string, locationId: string, total: number) {
  return logAuditAsync({ action: 'purchase.create', actor_id: actorId, target_table: 'purchase_entries', target_id: entryId, location_id: locationId, metadata: { total } })
}

export function auditPurchaseReceive(actorId: string, entryId: string, locationId: string, itemCount: number) {
  return logAuditAsync({ action: 'purchase.receive', actor_id: actorId, target_table: 'purchase_entries', target_id: entryId, location_id: locationId, metadata: { item_count: itemCount } })
}

export function auditTransferCreate(actorId: string, transferId: string, fromId: string, toId: string) {
  return logAuditAsync({ action: 'transfer.create', actor_id: actorId, target_table: 'transfers', target_id: transferId, metadata: { from_location_id: fromId, to_location_id: toId } })
}

export function auditCountConfirm(actorId: string, countId: string, locationId: string, discrepancies: number) {
  return logAuditAsync({ action: 'count.confirm', actor_id: actorId, target_table: 'physical_counts', target_id: countId, location_id: locationId, metadata: { discrepancies } })
}

export function auditCutoverExecute(actorId: string, applied: number, dryRun: boolean) {
  return logAuditAsync({ action: 'migration.cutover_execute', actor_id: actorId, metadata: { applied, dry_run: dryRun } })
}

export function auditExportCreate(actorId: string, exportType: string, rowCount: number) {
  return logAuditAsync({ action: 'export.create', actor_id: actorId, metadata: { export_type: exportType, row_count: rowCount } })
}

// ── Query audit logs ──────────────────────────────────────────────────────────

export interface AuditLogRow {
  id: string
  action: string
  actor_id: string
  actor_name: string | null
  target_table: string | null
  target_id: string | null
  location_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export async function getAuditLogs(opts: {
  action?: AuditAction
  actor_id?: string
  target_table?: string
  target_id?: string
  location_id?: string
  limit?: number
  page?: number
} = {}): Promise<{ logs: AuditLogRow[]; total: number }> {
  const { limit = 50, page = 1 } = opts
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('audit_logs')
    .select('*, actor:users!audit_logs_actor_id_fkey(full_name)', { count: 'exact' })

  if (opts.action) query = query.eq('action', opts.action)
  if (opts.actor_id) query = query.eq('actor_id', opts.actor_id)
  if (opts.target_table) query = query.eq('target_table', opts.target_table)
  if (opts.target_id) query = query.eq('target_id', opts.target_id)
  if (opts.location_id) query = query.eq('location_id', opts.location_id)

  const from = (page - 1) * limit
  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (error) throw new Error(error.message)

  return {
    logs: (data ?? []).map((r) => ({
      ...r,
      actor_name: (r.actor as { full_name: string } | null)?.full_name ?? null,
    })) as AuditLogRow[],
    total: count ?? 0,
  }
}
