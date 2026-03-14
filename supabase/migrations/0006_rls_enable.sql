-- =============================================================================
-- 0006_rls_enable.sql
-- Enable RLS on all user-facing tables
-- =============================================================================

ALTER TABLE roles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE units                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sku_sequences          ENABLE ROW LEVEL SECURITY;
ALTER TABLE products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_aliases        ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_balances         ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alert_rules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_snapshots_legacy ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_entries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_entry_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_counts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_count_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_import_runs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_import_rows  ENABLE ROW LEVEL SECURITY;
