-- =============================================================================
-- 0005_indexes.sql
-- Performance indexes for all hot query paths
-- =============================================================================

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE INDEX idx_users_role       ON users(role);
CREATE INDEX idx_users_is_active  ON users(is_active);
CREATE INDEX idx_users_email      ON users(email);

-- ── User locations ────────────────────────────────────────────────────────────
CREATE INDEX idx_user_locations_user     ON user_locations(user_id);
CREATE INDEX idx_user_locations_location ON user_locations(location_id);

-- ── Products ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_products_sku         ON products(sku);
CREATE INDEX idx_products_category    ON products(category_id);
CREATE INDEX idx_products_unit        ON products(unit_id);
CREATE INDEX idx_products_barcode     ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_is_active   ON products(is_active);
CREATE INDEX idx_products_is_legacy   ON products(is_legacy) WHERE is_legacy = TRUE;

-- Full-text search on product name + SKU
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX idx_products_sku_trgm  ON products USING gin(sku gin_trgm_ops);

-- ── SKU sequences ─────────────────────────────────────────────────────────────
CREATE INDEX idx_sku_sequences_category ON sku_sequences(category_id);

-- ── Product aliases ───────────────────────────────────────────────────────────
CREATE INDEX idx_product_aliases_product ON product_aliases(product_id);
CREATE INDEX idx_product_aliases_alias   ON product_aliases(alias);

-- ── Location products ─────────────────────────────────────────────────────────
CREATE INDEX idx_location_products_product  ON location_products(product_id);
CREATE INDEX idx_location_products_location ON location_products(location_id);

-- ── Stock balances ────────────────────────────────────────────────────────────
CREATE INDEX idx_stock_balances_product  ON stock_balances(product_id);
CREATE INDEX idx_stock_balances_location ON stock_balances(location_id);
-- Compound — the most common query
CREATE INDEX idx_stock_balances_product_location ON stock_balances(product_id, location_id);

-- ── Stock movements ────────────────────────────────────────────────────────────
CREATE INDEX idx_stock_movements_product      ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_location     ON stock_movements(location_id);
CREATE INDEX idx_stock_movements_type         ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_performed_at ON stock_movements(performed_at DESC);
CREATE INDEX idx_stock_movements_reference    ON stock_movements(reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX idx_stock_movements_performed_by ON stock_movements(performed_by);
CREATE INDEX idx_stock_movements_idempotency  ON stock_movements(idempotency_key) WHERE idempotency_key IS NOT NULL;
-- Compound for history queries
CREATE INDEX idx_stock_movements_location_date ON stock_movements(location_id, performed_at DESC);
CREATE INDEX idx_stock_movements_product_loc   ON stock_movements(product_id, location_id, performed_at DESC);

-- ── Stock alert rules ─────────────────────────────────────────────────────────
CREATE INDEX idx_alert_rules_product  ON stock_alert_rules(product_id);
CREATE INDEX idx_alert_rules_location ON stock_alert_rules(location_id) WHERE location_id IS NOT NULL;
CREATE INDEX idx_alert_rules_active   ON stock_alert_rules(is_active) WHERE is_active = TRUE;

-- ── Stock snapshots ───────────────────────────────────────────────────────────
CREATE INDEX idx_snapshots_product  ON stock_snapshots_legacy(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_snapshots_location ON stock_snapshots_legacy(location_id) WHERE location_id IS NOT NULL;
CREATE INDEX idx_snapshots_date     ON stock_snapshots_legacy(snapshot_date DESC);

-- ── Purchase entries ──────────────────────────────────────────────────────────
CREATE INDEX idx_purchase_entries_location ON purchase_entries(location_id);
CREATE INDEX idx_purchase_entries_supplier ON purchase_entries(supplier_id) WHERE supplier_id IS NOT NULL;
CREATE INDEX idx_purchase_entries_date     ON purchase_entries(entry_date DESC);
CREATE INDEX idx_purchase_entries_status   ON purchase_entries(status);
CREATE INDEX idx_purchase_entry_items_entry ON purchase_entry_items(purchase_entry_id);

-- ── Transfers ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_transfers_from_location ON transfers(from_location_id);
CREATE INDEX idx_transfers_to_location   ON transfers(to_location_id);
CREATE INDEX idx_transfers_date          ON transfers(transfer_date DESC);
CREATE INDEX idx_transfers_status        ON transfers(status);
CREATE INDEX idx_transfer_items_transfer ON transfer_items(transfer_id);

-- ── Physical counts ───────────────────────────────────────────────────────────
CREATE INDEX idx_physical_counts_location ON physical_counts(location_id);
CREATE INDEX idx_physical_counts_date     ON physical_counts(count_date DESC);
CREATE INDEX idx_physical_count_items_count ON physical_count_items(physical_count_id);

-- ── Audit logs ────────────────────────────────────────────────────────────────
CREATE INDEX idx_audit_logs_user         ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity       ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_performed_at ON audit_logs(performed_at DESC);

-- ── Migration imports ─────────────────────────────────────────────────────────
CREATE INDEX idx_import_rows_run    ON migration_import_rows(import_run_id);
CREATE INDEX idx_import_rows_status ON migration_import_rows(status);
