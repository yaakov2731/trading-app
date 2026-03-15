-- =============================================================================
-- 0003_inventory_tables.sql
-- SKU sequences, products, stock tracking
-- =============================================================================

-- ── SKU sequences — one row per category ──────────────────────────────────────

CREATE TABLE sku_sequences (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   UUID        NOT NULL UNIQUE REFERENCES categories(id) ON DELETE RESTRICT,
  last_sequence INT         NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT sku_sequences_non_negative CHECK (last_sequence >= 0)
);

-- ── Products ──────────────────────────────────────────────────────────────────

CREATE TABLE products (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  sku            TEXT          NOT NULL UNIQUE,
  name           TEXT          NOT NULL,
  description    TEXT,
  category_id    UUID          NOT NULL REFERENCES categories(id),
  unit_id        UUID          NOT NULL REFERENCES units(id),
  cost_price     NUMERIC(12,4) CHECK (cost_price >= 0),
  sale_price     NUMERIC(12,4) CHECK (sale_price >= 0),
  min_stock      NUMERIC(12,3) NOT NULL DEFAULT 0,
  max_stock      NUMERIC(12,3) CHECK (max_stock >= 0),
  reorder_point  NUMERIC(12,3) CHECK (reorder_point >= 0),
  image_url      TEXT,
  barcode        TEXT          UNIQUE,
  is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
  is_legacy      BOOLEAN       NOT NULL DEFAULT FALSE,
  notes          TEXT,
  metadata       JSONB         NOT NULL DEFAULT '{}',
  created_by     UUID          REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT products_min_stock_non_negative CHECK (min_stock >= 0),
  CONSTRAINT products_name_length CHECK (length(name) >= 2)
);

-- ── Product aliases (legacy barcodes, alternate names) ────────────────────────

CREATE TABLE product_aliases (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  alias       TEXT        NOT NULL,
  source      TEXT        NOT NULL DEFAULT 'manual',    -- 'legacy_import','barcode','manual'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT product_aliases_unique UNIQUE (alias)
);

-- ── Per-location product settings (overrides global) ─────────────────────────

CREATE TABLE location_products (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            UUID          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id           UUID          NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  min_stock             NUMERIC(12,3) CHECK (min_stock >= 0),
  max_stock             NUMERIC(12,3) CHECK (max_stock >= 0),
  reorder_point         NUMERIC(12,3) CHECK (reorder_point >= 0),
  preferred_supplier_id UUID,                              -- FK added after suppliers table
  is_active             BOOLEAN       NOT NULL DEFAULT TRUE,
  notes                 TEXT,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT location_products_unique UNIQUE (product_id, location_id)
);

-- ── Stock balances — current stock level per product/location ─────────────────
-- Maintained by trigger on stock_movements

CREATE TABLE stock_balances (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id      UUID          NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  current_stock    NUMERIC(12,3) NOT NULL DEFAULT 0,
  last_movement_at TIMESTAMPTZ,
  last_updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT stock_balances_unique UNIQUE (product_id, location_id)
);

-- ── Stock movements — the immutable ledger ────────────────────────────────────

CREATE TABLE stock_movements (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID          NOT NULL REFERENCES products(id),
  location_id      UUID          NOT NULL REFERENCES locations(id),
  movement_type    TEXT          NOT NULL,
  quantity         NUMERIC(12,3) NOT NULL,          -- signed: + in, - out
  unit_cost        NUMERIC(12,4) CHECK (unit_cost >= 0),
  total_cost       NUMERIC(14,4),
  reference_type   TEXT,                            -- 'purchase_entry','transfer','physical_count',…
  reference_id     UUID,
  reference_code   TEXT,
  running_balance  NUMERIC(12,3),                   -- snapshot at time of movement
  notes            TEXT,
  performed_by     UUID          NOT NULL REFERENCES auth.users(id),
  performed_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  idempotency_key  TEXT          UNIQUE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT stock_movements_type_check CHECK (
    movement_type IN (
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
    )
  ),
  CONSTRAINT stock_movements_quantity_nonzero CHECK (quantity <> 0)
);

-- ── Stock alert rules ─────────────────────────────────────────────────────────

CREATE TABLE stock_alert_rules (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id      UUID        REFERENCES locations(id) ON DELETE CASCADE,
  alert_type       TEXT        NOT NULL DEFAULT 'low_stock',
  threshold        NUMERIC(12,3) NOT NULL DEFAULT 0,
  notify_channels  TEXT[]      NOT NULL DEFAULT '{}',
  notify_users     UUID[]      NOT NULL DEFAULT '{}',
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT stock_alert_rules_type CHECK (
    alert_type IN ('low_stock','zero_stock','negative_stock','overstock','expiry')
  ),
  CONSTRAINT stock_alert_rules_threshold_non_negative CHECK (threshold >= 0)
);

-- ── Stock snapshots (legacy import source) ────────────────────────────────────

CREATE TABLE stock_snapshots_legacy (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID          REFERENCES products(id),
  location_id    UUID          REFERENCES locations(id),
  snapshot_date  DATE          NOT NULL,
  quantity       NUMERIC(12,3) NOT NULL DEFAULT 0,
  unit_cost      NUMERIC(12,4),
  import_source  TEXT          NOT NULL DEFAULT 'manual',
  sku_raw        TEXT,          -- original SKU from import, before matching
  product_name_raw TEXT,        -- original product name from import
  notes          TEXT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Audit log ─────────────────────────────────────────────────────────────────

CREATE TABLE audit_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        REFERENCES auth.users(id),
  action       TEXT        NOT NULL,         -- 'create','update','delete','login',…
  entity_type  TEXT        NOT NULL,         -- 'product','movement','user',…
  entity_id    UUID,
  old_data     JSONB,
  new_data     JSONB,
  ip_address   INET,
  user_agent   TEXT,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
