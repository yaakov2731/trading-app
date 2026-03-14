-- =============================================================================
-- 0004_legacy_tables.sql
-- Suppliers, purchase entries, transfers, physical counts, import runs
-- =============================================================================

-- ── Suppliers ─────────────────────────────────────────────────────────────────

CREATE TABLE suppliers (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT        NOT NULL UNIQUE,
  name        TEXT        NOT NULL,
  contact     TEXT,
  email       TEXT,
  phone       TEXT,
  address     TEXT,
  tax_id      TEXT,
  notes       TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Back-fill FK that was deferred in location_products
ALTER TABLE location_products
  ADD CONSTRAINT location_products_supplier_fk
  FOREIGN KEY (preferred_supplier_id) REFERENCES suppliers(id);

-- ── Purchase entries ──────────────────────────────────────────────────────────

CREATE TABLE purchase_entries (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_code       TEXT          UNIQUE,               -- auto-generated or manual
  location_id      UUID          NOT NULL REFERENCES locations(id),
  supplier_id      UUID          REFERENCES suppliers(id),
  status           TEXT          NOT NULL DEFAULT 'draft',
  entry_date       DATE          NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  reference_number TEXT,
  invoice_number   TEXT,
  invoice_date     DATE,
  total_amount     NUMERIC(14,4) NOT NULL DEFAULT 0,
  notes            TEXT,
  created_by       UUID          NOT NULL REFERENCES auth.users(id),
  approved_by      UUID          REFERENCES auth.users(id),
  approved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT purchase_entries_status_check CHECK (
    status IN ('draft','ordered','received','partial','cancelled')
  )
);

CREATE TABLE purchase_entry_items (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_entry_id  UUID          NOT NULL REFERENCES purchase_entries(id) ON DELETE CASCADE,
  product_id         UUID          NOT NULL REFERENCES products(id),
  quantity_expected  NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (quantity_expected >= 0),
  quantity_received  NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
  unit_cost          NUMERIC(12,4) CHECK (unit_cost >= 0),
  total_cost         NUMERIC(14,4),
  notes              TEXT,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Transfers ─────────────────────────────────────────────────────────────────

CREATE TABLE transfers (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_code    TEXT        UNIQUE,
  from_location_id UUID        NOT NULL REFERENCES locations(id),
  to_location_id   UUID        NOT NULL REFERENCES locations(id),
  status           TEXT        NOT NULL DEFAULT 'pending',
  transfer_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
  notes            TEXT,
  requested_by     UUID        NOT NULL REFERENCES auth.users(id),
  approved_by      UUID        REFERENCES auth.users(id),
  approved_at      TIMESTAMPTZ,
  sent_by          UUID        REFERENCES auth.users(id),
  sent_at          TIMESTAMPTZ,
  received_by      UUID        REFERENCES auth.users(id),
  received_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT transfers_different_locations CHECK (from_location_id <> to_location_id),
  CONSTRAINT transfers_status_check CHECK (
    status IN ('pending','in_transit','completed','partial','cancelled')
  )
);

CREATE TABLE transfer_items (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id         UUID          NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  product_id          UUID          NOT NULL REFERENCES products(id),
  quantity_requested  NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (quantity_requested > 0),
  quantity_sent       NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (quantity_sent >= 0),
  quantity_received   NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
  unit_cost           NUMERIC(12,4) CHECK (unit_cost >= 0),
  notes               TEXT,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Physical counts ───────────────────────────────────────────────────────────

CREATE TABLE physical_counts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  count_code   TEXT        UNIQUE,
  location_id  UUID        NOT NULL REFERENCES locations(id),
  status       TEXT        NOT NULL DEFAULT 'draft',
  count_date   DATE        NOT NULL DEFAULT CURRENT_DATE,
  notes        TEXT,
  created_by   UUID        NOT NULL REFERENCES auth.users(id),
  approved_by  UUID        REFERENCES auth.users(id),
  approved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT physical_counts_status_check CHECK (
    status IN ('draft','in_progress','completed','cancelled')
  )
);

CREATE TABLE physical_count_items (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  physical_count_id UUID          NOT NULL REFERENCES physical_counts(id) ON DELETE CASCADE,
  product_id        UUID          NOT NULL REFERENCES products(id),
  system_quantity   NUMERIC(12,3) NOT NULL DEFAULT 0,
  counted_quantity  NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (counted_quantity >= 0),
  discrepancy       NUMERIC(12,3) GENERATED ALWAYS AS (counted_quantity - system_quantity) STORED,
  unit_cost         NUMERIC(12,4) CHECK (unit_cost >= 0),
  notes             TEXT,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT physical_count_items_unique UNIQUE (physical_count_id, product_id)
);

-- ── Migration import tracking ─────────────────────────────────────────────────

CREATE TABLE migration_import_runs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  filename      TEXT        NOT NULL,
  source_type   TEXT        NOT NULL DEFAULT 'excel',   -- 'excel','sheets','csv'
  status        TEXT        NOT NULL DEFAULT 'pending',
  total_rows    INT         NOT NULL DEFAULT 0,
  processed     INT         NOT NULL DEFAULT 0,
  succeeded     INT         NOT NULL DEFAULT 0,
  failed        INT         NOT NULL DEFAULT 0,
  error_summary JSONB,
  started_by    UUID        REFERENCES auth.users(id),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,

  CONSTRAINT migration_import_runs_status_check CHECK (
    status IN ('pending','running','completed','failed','partial')
  )
);

CREATE TABLE migration_import_rows (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  import_run_id   UUID        NOT NULL REFERENCES migration_import_runs(id) ON DELETE CASCADE,
  row_number      INT         NOT NULL,
  raw_data        JSONB       NOT NULL DEFAULT '{}',
  status          TEXT        NOT NULL DEFAULT 'pending',
  matched_product_id UUID     REFERENCES products(id),
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT migration_import_rows_status_check CHECK (
    status IN ('pending','matched','created','skipped','failed')
  )
);
