-- =============================================================================
-- GastroStock - Complete Database Schema
-- Version: 1.0.0
-- Description: Production-grade inventory management for multi-location gastronomy
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- trigram search for product autocomplete
CREATE EXTENSION IF NOT EXISTS "btree_gin";      -- GIN index support
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- for gen_random_uuid()

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'supervisor', 'operator', 'auditor');
CREATE TYPE location_type AS ENUM ('restaurant', 'cafe', 'bar', 'events', 'warehouse', 'other');
CREATE TYPE movement_type AS ENUM (
  'opening_stock',
  'purchase_in',
  'production_in',
  'consumption_out',
  'transfer_out',
  'transfer_in',
  'waste_out',
  'manual_adjustment',
  'physical_count',
  'reconciliation_adjustment'
);
CREATE TYPE transfer_status AS ENUM ('draft', 'pending_approval', 'in_transit', 'received', 'partial', 'cancelled');
CREATE TYPE purchase_status AS ENUM ('draft', 'ordered', 'partial', 'received', 'cancelled');
CREATE TYPE physical_count_status AS ENUM ('draft', 'in_progress', 'pending_review', 'approved', 'reconciled', 'cancelled');
CREATE TYPE alert_type AS ENUM ('low_stock', 'zero_stock', 'negative_stock', 'overstock', 'expiry');
CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE', 'SELECT');

-- =============================================================================
-- TABLE: roles
-- Purpose: Defines permissions for each system role
-- =============================================================================

CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        user_role UNIQUE NOT NULL,
  label       TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE roles IS 'System roles with granular permission sets';

-- =============================================================================
-- TABLE: users
-- Purpose: Application users linked to Supabase Auth
-- =============================================================================

CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT UNIQUE NOT NULL,
  full_name     TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'operator',
  avatar_url    TEXT,
  phone         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email   ON users(email);
CREATE INDEX idx_users_role    ON users(role);
CREATE INDEX idx_users_active  ON users(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE users IS 'Application users linked to Supabase Auth identity';

-- =============================================================================
-- TABLE: locations
-- Purpose: Physical business locations
-- =============================================================================

CREATE TABLE locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT UNIQUE NOT NULL CHECK (code ~ '^[A-Z0-9_]+$'),
  name        TEXT NOT NULL,
  type        location_type NOT NULL DEFAULT 'restaurant',
  address     TEXT,
  phone       TEXT,
  timezone    TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
  color       TEXT NOT NULL DEFAULT '#3b82f6',  -- display color in UI
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INT NOT NULL DEFAULT 0,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_locations_active ON locations(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_locations_code   ON locations(code);

COMMENT ON TABLE locations IS 'Physical business locations (Umo Grill, Puerto Gelato, etc.)';

-- =============================================================================
-- TABLE: user_locations
-- Purpose: Maps users to locations with per-location roles
-- =============================================================================

CREATE TABLE user_locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  role        user_role NOT NULL DEFAULT 'operator',
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, location_id)
);

CREATE INDEX idx_user_locations_user     ON user_locations(user_id);
CREATE INDEX idx_user_locations_location ON user_locations(location_id);

COMMENT ON TABLE user_locations IS 'User access permissions per location';

-- =============================================================================
-- TABLE: categories
-- Purpose: Product categories with SKU prefix configuration
-- =============================================================================

CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT UNIQUE NOT NULL CHECK (code ~ '^[A-Z0-9]+$'),
  prefix      TEXT UNIQUE NOT NULL CHECK (prefix ~ '^[A-Z]{2,5}$'),
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT NOT NULL DEFAULT '#6366f1',
  icon        TEXT NOT NULL DEFAULT 'package',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE categories IS 'Product categories with SKU prefix definitions';

-- =============================================================================
-- TABLE: units
-- Purpose: Units of measurement with conversion factors
-- =============================================================================

CREATE TABLE units (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code              TEXT UNIQUE NOT NULL CHECK (code ~ '^[a-zA-Z]+$'),
  name              TEXT NOT NULL,
  symbol            TEXT NOT NULL,
  base_unit_id      UUID REFERENCES units(id),
  conversion_factor NUMERIC(12, 6) NOT NULL DEFAULT 1,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_units_base ON units(base_unit_id) WHERE base_unit_id IS NOT NULL;

COMMENT ON TABLE units IS 'Units of measurement (kg, L, units, boxes, etc.)';

-- =============================================================================
-- TABLE: sku_sequences
-- Purpose: Per-category sequence counters for atomic SKU generation
-- =============================================================================

CREATE TABLE sku_sequences (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   UUID UNIQUE NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  last_sequence INT NOT NULL DEFAULT 0 CHECK (last_sequence >= 0),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sku_sequences IS 'Per-category sequence counters for concurrency-safe SKU generation';

-- =============================================================================
-- TABLE: suppliers
-- Purpose: Product suppliers / vendors
-- =============================================================================

CREATE TABLE suppliers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  contact     TEXT,
  email       TEXT,
  phone       TEXT,
  address     TEXT,
  tax_id      TEXT,
  notes       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suppliers_active ON suppliers(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_suppliers_name   ON suppliers USING gin(name gin_trgm_ops);

COMMENT ON TABLE suppliers IS 'Suppliers and vendors for purchase orders';

-- =============================================================================
-- TABLE: products
-- Purpose: Product master catalog with auto-generated immutable SKUs
-- =============================================================================

CREATE TABLE products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku              TEXT UNIQUE NOT NULL,
  name             TEXT NOT NULL,
  description      TEXT,
  category_id      UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  unit_id          UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  cost_price       NUMERIC(12, 2),
  sale_price       NUMERIC(12, 2),
  min_stock        NUMERIC(12, 3) NOT NULL DEFAULT 0,
  max_stock        NUMERIC(12, 3),
  reorder_point    NUMERIC(12, 3),
  image_url        TEXT,
  barcode          TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  is_legacy        BOOLEAN NOT NULL DEFAULT FALSE,  -- imported from legacy
  notes            TEXT,
  metadata         JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by       UUID REFERENCES users(id),
  CONSTRAINT products_sku_immutable CHECK (TRUE)  -- enforced via trigger
);

CREATE INDEX idx_products_sku          ON products(sku);
CREATE INDEX idx_products_category     ON products(category_id);
CREATE INDEX idx_products_unit         ON products(unit_id);
CREATE INDEX idx_products_active       ON products(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_products_name_search  ON products USING gin(name gin_trgm_ops);
CREATE INDEX idx_products_sku_search   ON products USING gin(sku gin_trgm_ops);
CREATE INDEX idx_products_barcode      ON products(barcode) WHERE barcode IS NOT NULL;

COMMENT ON TABLE products IS 'Product master catalog. SKUs are auto-generated and immutable after creation';

-- =============================================================================
-- TABLE: product_aliases
-- Purpose: Alternative names / legacy mappings for products
-- =============================================================================

CREATE TABLE product_aliases (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  alias      TEXT NOT NULL,
  source     TEXT NOT NULL DEFAULT 'manual',  -- 'legacy', 'manual', 'import'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(alias)
);

CREATE INDEX idx_product_aliases_product ON product_aliases(product_id);
CREATE INDEX idx_product_aliases_alias   ON product_aliases USING gin(alias gin_trgm_ops);

COMMENT ON TABLE product_aliases IS 'Alternative names and legacy mappings for product search';

-- =============================================================================
-- TABLE: location_products
-- Purpose: Per-location product configurations and stock thresholds
-- =============================================================================

CREATE TABLE location_products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id       UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  min_stock         NUMERIC(12, 3),         -- overrides product default
  max_stock         NUMERIC(12, 3),
  reorder_point     NUMERIC(12, 3),
  preferred_supplier_id UUID REFERENCES suppliers(id),
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, location_id)
);

CREATE INDEX idx_location_products_product  ON location_products(product_id);
CREATE INDEX idx_location_products_location ON location_products(location_id);
CREATE INDEX idx_location_products_active   ON location_products(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE location_products IS 'Per-location product settings and stock thresholds';

-- =============================================================================
-- TABLE: stock_movements
-- Purpose: Core ledger/kardex - single source of truth for all inventory changes
-- =============================================================================

CREATE TABLE stock_movements (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  location_id      UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  movement_type    movement_type NOT NULL,
  quantity         NUMERIC(12, 3) NOT NULL,  -- SIGNED: positive=in, negative=out
  unit_cost        NUMERIC(12, 2),
  total_cost       NUMERIC(14, 2) GENERATED ALWAYS AS (
                     CASE WHEN unit_cost IS NOT NULL
                     THEN ABS(quantity) * unit_cost
                     ELSE NULL END
                   ) STORED,
  -- Reference to the source document
  reference_type   TEXT,  -- 'purchase_entry', 'transfer', 'physical_count', etc.
  reference_id     UUID,
  reference_code   TEXT,  -- human-readable reference number
  -- Snapshot of running balance (denormalized for performance)
  running_balance  NUMERIC(12, 3),
  -- Metadata
  notes            TEXT,
  performed_by     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  performed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Idempotency key to prevent duplicate submissions
  idempotency_key  TEXT UNIQUE,
  -- Audit
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT stock_movements_quantity_nonzero CHECK (quantity != 0)
);

CREATE INDEX idx_stock_movements_product     ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_location    ON stock_movements(location_id);
CREATE INDEX idx_stock_movements_product_loc ON stock_movements(product_id, location_id);
CREATE INDEX idx_stock_movements_type        ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_performed   ON stock_movements(performed_at DESC);
CREATE INDEX idx_stock_movements_reference   ON stock_movements(reference_type, reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX idx_stock_movements_idempotency ON stock_movements(idempotency_key) WHERE idempotency_key IS NOT NULL;

COMMENT ON TABLE stock_movements IS 'Core inventory ledger/kardex. Current stock = SUM(quantity) per product+location';

-- =============================================================================
-- TABLE: stock_balances
-- Purpose: Materialized/cached stock balance per product+location for performance
-- Updated by triggers on stock_movements insert
-- =============================================================================

CREATE TABLE stock_balances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id     UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  current_stock   NUMERIC(12, 3) NOT NULL DEFAULT 0,
  last_movement_at TIMESTAMPTZ,
  last_updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, location_id)
);

CREATE INDEX idx_stock_balances_product     ON stock_balances(product_id);
CREATE INDEX idx_stock_balances_location    ON stock_balances(location_id);
CREATE INDEX idx_stock_balances_low         ON stock_balances(current_stock) WHERE current_stock <= 0;

COMMENT ON TABLE stock_balances IS 'Cached current stock per product+location. Updated by trigger on every movement';

-- =============================================================================
-- TABLE: stock_snapshots_legacy
-- Purpose: Read-only preservation of legacy spreadsheet snapshot data
-- =============================================================================

CREATE TABLE stock_snapshots_legacy (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_run_id        UUID,  -- FK added after migration_import_runs table
  product_sku_legacy   TEXT NOT NULL,
  product_name_legacy  TEXT NOT NULL,
  location_code_legacy TEXT NOT NULL,
  snapshot_date        DATE NOT NULL,
  quantity             NUMERIC(12, 3),
  unit_legacy          TEXT,
  cost_price_legacy    NUMERIC(12, 2),
  category_legacy      TEXT,
  mapped_product_id    UUID REFERENCES products(id),
  mapped_location_id   UUID REFERENCES locations(id),
  is_opening_balance   BOOLEAN NOT NULL DEFAULT FALSE,
  source_row_number    INT,
  raw_data             JSONB NOT NULL DEFAULT '{}',
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_legacy_snapshots_sku      ON stock_snapshots_legacy(product_sku_legacy);
CREATE INDEX idx_legacy_snapshots_location ON stock_snapshots_legacy(location_code_legacy);
CREATE INDEX idx_legacy_snapshots_date     ON stock_snapshots_legacy(snapshot_date);
CREATE INDEX idx_legacy_snapshots_mapped   ON stock_snapshots_legacy(mapped_product_id) WHERE mapped_product_id IS NOT NULL;

COMMENT ON TABLE stock_snapshots_legacy IS 'Read-only preservation of legacy spreadsheet data. Never edit directly';

-- =============================================================================
-- TABLE: purchase_entries
-- Purpose: Purchase order headers
-- =============================================================================

CREATE TABLE purchase_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT UNIQUE NOT NULL,  -- auto-generated: PE-2024-0001
  supplier_id   UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  location_id   UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  status        purchase_status NOT NULL DEFAULT 'draft',
  entry_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  invoice_number TEXT,
  invoice_date  DATE,
  total_amount  NUMERIC(14, 2),
  notes         TEXT,
  created_by    UUID NOT NULL REFERENCES users(id),
  approved_by   UUID REFERENCES users(id),
  approved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchase_entries_location  ON purchase_entries(location_id);
CREATE INDEX idx_purchase_entries_supplier  ON purchase_entries(supplier_id) WHERE supplier_id IS NOT NULL;
CREATE INDEX idx_purchase_entries_status    ON purchase_entries(status);
CREATE INDEX idx_purchase_entries_date      ON purchase_entries(entry_date DESC);

COMMENT ON TABLE purchase_entries IS 'Purchase order / goods receipt headers';

-- =============================================================================
-- TABLE: purchase_entry_items
-- Purpose: Line items for purchase entries
-- =============================================================================

CREATE TABLE purchase_entry_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_entry_id   UUID NOT NULL REFERENCES purchase_entries(id) ON DELETE CASCADE,
  product_id          UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity_ordered    NUMERIC(12, 3) NOT NULL CHECK (quantity_ordered > 0),
  quantity_received   NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
  unit_cost           NUMERIC(12, 2),
  line_total          NUMERIC(14, 2) GENERATED ALWAYS AS (quantity_received * COALESCE(unit_cost, 0)) STORED,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchase_items_entry   ON purchase_entry_items(purchase_entry_id);
CREATE INDEX idx_purchase_items_product ON purchase_entry_items(product_id);

COMMENT ON TABLE purchase_entry_items IS 'Line items for purchase orders / goods receipts';

-- =============================================================================
-- TABLE: transfers
-- Purpose: Stock transfer headers between locations
-- =============================================================================

CREATE TABLE transfers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code               TEXT UNIQUE NOT NULL,  -- TRF-2024-0001
  from_location_id   UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  to_location_id     UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  status             transfer_status NOT NULL DEFAULT 'draft',
  transfer_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  notes              TEXT,
  created_by         UUID NOT NULL REFERENCES users(id),
  approved_by        UUID REFERENCES users(id),
  approved_at        TIMESTAMPTZ,
  sent_by            UUID REFERENCES users(id),
  sent_at            TIMESTAMPTZ,
  received_by        UUID REFERENCES users(id),
  received_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT transfers_different_locations CHECK (from_location_id != to_location_id)
);

CREATE INDEX idx_transfers_from     ON transfers(from_location_id);
CREATE INDEX idx_transfers_to       ON transfers(to_location_id);
CREATE INDEX idx_transfers_status   ON transfers(status);
CREATE INDEX idx_transfers_date     ON transfers(transfer_date DESC);

COMMENT ON TABLE transfers IS 'Inter-location stock transfer headers';

-- =============================================================================
-- TABLE: transfer_items
-- Purpose: Line items for transfers
-- =============================================================================

CREATE TABLE transfer_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id         UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  product_id          UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity_requested  NUMERIC(12, 3) NOT NULL CHECK (quantity_requested > 0),
  quantity_sent       NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (quantity_sent >= 0),
  quantity_received   NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transfer_items_transfer ON transfer_items(transfer_id);
CREATE INDEX idx_transfer_items_product  ON transfer_items(product_id);

COMMENT ON TABLE transfer_items IS 'Line items for inter-location transfers';

-- =============================================================================
-- TABLE: physical_counts
-- Purpose: Physical inventory count sessions
-- =============================================================================

CREATE TABLE physical_counts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT UNIQUE NOT NULL,  -- CNT-2024-0001
  location_id   UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  status        physical_count_status NOT NULL DEFAULT 'draft',
  count_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  notes         TEXT,
  total_items   INT NOT NULL DEFAULT 0,
  items_counted INT NOT NULL DEFAULT 0,
  total_variance NUMERIC(14, 2),  -- sum of value differences
  created_by    UUID NOT NULL REFERENCES users(id),
  reviewed_by   UUID REFERENCES users(id),
  reviewed_at   TIMESTAMPTZ,
  approved_by   UUID REFERENCES users(id),
  approved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_physical_counts_location ON physical_counts(location_id);
CREATE INDEX idx_physical_counts_status   ON physical_counts(status);
CREATE INDEX idx_physical_counts_date     ON physical_counts(count_date DESC);

COMMENT ON TABLE physical_counts IS 'Physical inventory count sessions. Generates reconciliation_adjustment movements';

-- =============================================================================
-- TABLE: physical_count_items
-- Purpose: Line items for physical count sessions
-- =============================================================================

CREATE TABLE physical_count_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  physical_count_id UUID NOT NULL REFERENCES physical_counts(id) ON DELETE CASCADE,
  product_id       UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  system_quantity  NUMERIC(12, 3) NOT NULL DEFAULT 0,  -- snapshot at count start
  counted_quantity NUMERIC(12, 3),                      -- what was physically counted
  difference       NUMERIC(12, 3) GENERATED ALWAYS AS (
                     COALESCE(counted_quantity, 0) - system_quantity
                   ) STORED,
  unit_cost        NUMERIC(12, 2),
  value_difference NUMERIC(14, 2) GENERATED ALWAYS AS (
                     (COALESCE(counted_quantity, 0) - system_quantity) * COALESCE(unit_cost, 0)
                   ) STORED,
  status           TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'counted', 'approved'
  notes            TEXT,
  counted_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(physical_count_id, product_id)
);

CREATE INDEX idx_count_items_count   ON physical_count_items(physical_count_id);
CREATE INDEX idx_count_items_product ON physical_count_items(product_id);
CREATE INDEX idx_count_items_status  ON physical_count_items(status);

COMMENT ON TABLE physical_count_items IS 'Individual product counts within a physical count session';

-- =============================================================================
-- TABLE: stock_alert_rules
-- Purpose: Configurable stock alert thresholds
-- =============================================================================

CREATE TABLE stock_alert_rules (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id           UUID REFERENCES locations(id) ON DELETE CASCADE,  -- NULL = all locations
  alert_type            alert_type NOT NULL DEFAULT 'low_stock',
  threshold             NUMERIC(12, 3) NOT NULL DEFAULT 0,
  notify_channels       TEXT[] NOT NULL DEFAULT '{}',  -- 'email', 'sms', 'push', 'slack'
  notify_users          UUID[] NOT NULL DEFAULT '{}',
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  last_triggered_at     TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alert_rules_product  ON stock_alert_rules(product_id);
CREATE INDEX idx_alert_rules_location ON stock_alert_rules(location_id) WHERE location_id IS NOT NULL;
CREATE INDEX idx_alert_rules_active   ON stock_alert_rules(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE stock_alert_rules IS 'Stock level alert configurations per product/location';

-- =============================================================================
-- TABLE: audit_logs
-- Purpose: Immutable audit trail of all significant database changes
-- =============================================================================

CREATE TABLE audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name   TEXT NOT NULL,
  record_id    UUID NOT NULL,
  action       audit_action NOT NULL,
  old_values   JSONB,
  new_values   JSONB,
  changed_by   UUID REFERENCES users(id),
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address   INET,
  user_agent   TEXT,
  session_id   TEXT
);

CREATE INDEX idx_audit_logs_table    ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record   ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user     ON audit_logs(changed_by) WHERE changed_by IS NOT NULL;
CREATE INDEX idx_audit_logs_time     ON audit_logs(changed_at DESC);

COMMENT ON TABLE audit_logs IS 'Immutable audit trail. Never delete from this table';

-- =============================================================================
-- TABLE: migration_import_runs
-- Purpose: Tracks legacy data import sessions
-- =============================================================================

CREATE TABLE migration_import_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status            TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'running', 'review', 'approved', 'applied', 'failed'
  source_file       TEXT,
  source_sheet      TEXT,
  total_rows        INT NOT NULL DEFAULT 0,
  mapped_rows       INT NOT NULL DEFAULT 0,
  skipped_rows      INT NOT NULL DEFAULT 0,
  error_rows        INT NOT NULL DEFAULT 0,
  cutover_date      DATE,
  notes             TEXT,
  created_by        UUID REFERENCES users(id),
  approved_by       UUID REFERENCES users(id),
  approved_at       TIMESTAMPTZ,
  applied_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE migration_import_runs IS 'Legacy data migration sessions and status tracking';

-- =============================================================================
-- TABLE: migration_import_rows
-- Purpose: Individual row records from migration imports
-- =============================================================================

CREATE TABLE migration_import_rows (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_run_id      UUID NOT NULL REFERENCES migration_import_runs(id) ON DELETE CASCADE,
  row_number         INT NOT NULL,
  raw_data           JSONB NOT NULL DEFAULT '{}',
  status             TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'mapped', 'skipped', 'error', 'applied'
  mapped_product_id  UUID REFERENCES products(id),
  mapped_location_id UUID REFERENCES locations(id),
  opening_quantity   NUMERIC(12, 3),
  notes              TEXT,
  error_message      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_import_rows_run    ON migration_import_rows(import_run_id);
CREATE INDEX idx_import_rows_status ON migration_import_rows(status);

COMMENT ON TABLE migration_import_rows IS 'Individual rows from legacy migration imports with mapping status';

-- =============================================================================
-- Add FK from stock_snapshots_legacy -> migration_import_runs
-- =============================================================================

ALTER TABLE stock_snapshots_legacy
  ADD CONSTRAINT fk_snapshots_import_run
  FOREIGN KEY (import_run_id) REFERENCES migration_import_runs(id) ON DELETE SET NULL;

CREATE INDEX idx_legacy_snapshots_run ON stock_snapshots_legacy(import_run_id) WHERE import_run_id IS NOT NULL;
