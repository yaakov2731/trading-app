-- =============================================================================
-- GastroStock - Functions, Triggers, and Business Logic
-- =============================================================================

-- =============================================================================
-- FUNCTION: update_updated_at
-- Purpose: Auto-update updated_at on row changes
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all relevant tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'locations', 'categories', 'units', 'suppliers',
    'products', 'location_products', 'purchase_entries',
    'transfers', 'physical_counts', 'stock_alert_rules'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t, t
    );
  END LOOP;
END $$;

-- =============================================================================
-- FUNCTION: generate_sku
-- Purpose: Atomically generate next SKU for a category
-- Uses SELECT FOR UPDATE to prevent race conditions
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_sku(p_category_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_prefix      TEXT;
  v_next_seq    INT;
  v_sku         TEXT;
BEGIN
  -- Lock the sequence row for this category exclusively
  -- This prevents concurrent SKU generation for the same category
  SELECT c.prefix, COALESCE(s.last_sequence, 0) + 1
  INTO   v_prefix, v_next_seq
  FROM   categories c
  LEFT JOIN sku_sequences s ON s.category_id = c.id
  WHERE  c.id = p_category_id
  FOR UPDATE OF s;  -- Row-level lock on sku_sequences

  IF v_prefix IS NULL THEN
    RAISE EXCEPTION 'Category % not found', p_category_id;
  END IF;

  -- Upsert the sequence counter
  INSERT INTO sku_sequences (category_id, last_sequence, updated_at)
  VALUES (p_category_id, v_next_seq, NOW())
  ON CONFLICT (category_id) DO UPDATE
    SET last_sequence = EXCLUDED.last_sequence,
        updated_at    = NOW();

  -- Format: PREFIX-NNNN (zero-padded to 4 digits)
  v_sku := v_prefix || '-' || LPAD(v_next_seq::TEXT, 4, '0');

  -- Verify uniqueness (safety net)
  IF EXISTS (SELECT 1 FROM products WHERE sku = v_sku) THEN
    RAISE EXCEPTION 'SKU collision detected: %. This should not happen — check sku_sequences integrity.', v_sku;
  END IF;

  RETURN v_sku;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_sku IS 'Atomically generate next SKU for a category. Concurrency-safe via row lock';

-- =============================================================================
-- FUNCTION: create_product_with_sku
-- Purpose: Create a product and generate its SKU atomically in one transaction
-- =============================================================================

CREATE OR REPLACE FUNCTION create_product_with_sku(
  p_name        TEXT,
  p_category_id UUID,
  p_unit_id     UUID,
  p_description TEXT DEFAULT NULL,
  p_cost_price  NUMERIC DEFAULT NULL,
  p_sale_price  NUMERIC DEFAULT NULL,
  p_min_stock   NUMERIC DEFAULT 0,
  p_notes       TEXT DEFAULT NULL,
  p_metadata    JSONB DEFAULT '{}',
  p_created_by  UUID DEFAULT NULL
)
RETURNS products AS $$
DECLARE
  v_sku  TEXT;
  v_product products;
BEGIN
  -- Generate SKU inside the same transaction
  v_sku := generate_sku(p_category_id);

  -- Insert product
  INSERT INTO products (
    sku, name, category_id, unit_id, description,
    cost_price, sale_price, min_stock, notes, metadata, created_by
  ) VALUES (
    v_sku, p_name, p_category_id, p_unit_id, p_description,
    p_cost_price, p_sale_price, p_min_stock, p_notes, p_metadata, p_created_by
  )
  RETURNING * INTO v_product;

  -- Initialize stock_balances for all locations (0 stock)
  INSERT INTO stock_balances (product_id, location_id, current_stock)
  SELECT v_product.id, l.id, 0
  FROM locations l
  WHERE l.is_active = TRUE
  ON CONFLICT (product_id, location_id) DO NOTHING;

  RETURN v_product;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCTION: prevent_sku_change
-- Purpose: Prevent SKU modification after creation (immutability)
-- =============================================================================

CREATE OR REPLACE FUNCTION prevent_sku_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.sku != NEW.sku THEN
    -- Allow only admin bypass via special session variable
    IF current_setting('app.allow_sku_change', TRUE) != 'true' THEN
      RAISE EXCEPTION 'SKU is immutable after creation. SKU: %. Use admin override to change with audit trail.', OLD.sku;
    END IF;
    -- Log SKU change in audit
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_at)
    VALUES ('products', OLD.id, 'UPDATE',
            jsonb_build_object('sku', OLD.sku),
            jsonb_build_object('sku', NEW.sku),
            NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_prevent_sku_change
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION prevent_sku_change();

-- =============================================================================
-- FUNCTION: update_stock_balance
-- Purpose: Maintain cached stock_balances table on every movement insert
-- This is the key performance optimization — no aggregate needed for current stock
-- =============================================================================

CREATE OR REPLACE FUNCTION update_stock_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stock_balances (product_id, location_id, current_stock, last_movement_at, last_updated_at)
  VALUES (NEW.product_id, NEW.location_id, NEW.quantity, NEW.performed_at, NOW())
  ON CONFLICT (product_id, location_id) DO UPDATE
    SET current_stock    = stock_balances.current_stock + NEW.quantity,
        last_movement_at = NEW.performed_at,
        last_updated_at  = NOW();

  -- Store running balance on the movement for audit trail
  UPDATE stock_movements
  SET running_balance = (
    SELECT current_stock
    FROM stock_balances
    WHERE product_id  = NEW.product_id
      AND location_id = NEW.location_id
  )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stock_movements_update_balance
  AFTER INSERT ON stock_movements
  FOR EACH ROW EXECUTE FUNCTION update_stock_balance();

-- =============================================================================
-- FUNCTION: check_stock_alerts
-- Purpose: Check and fire stock alerts after balance update
-- =============================================================================

CREATE OR REPLACE FUNCTION check_stock_alerts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_triggered_at for any matching active alert rules
  UPDATE stock_alert_rules
  SET last_triggered_at = NOW()
  WHERE is_active = TRUE
    AND product_id  = NEW.product_id
    AND (location_id = NEW.location_id OR location_id IS NULL)
    AND (
      (alert_type = 'zero_stock'     AND NEW.current_stock <= 0) OR
      (alert_type = 'negative_stock' AND NEW.current_stock < 0)  OR
      (alert_type = 'low_stock'      AND NEW.current_stock > 0 AND NEW.current_stock <= threshold)
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stock_balances_check_alerts
  AFTER INSERT OR UPDATE ON stock_balances
  FOR EACH ROW EXECUTE FUNCTION check_stock_alerts();

-- =============================================================================
-- FUNCTION: get_current_stock
-- Purpose: Get current stock for a product at a location (fast path via cache)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_current_stock(
  p_product_id  UUID,
  p_location_id UUID
)
RETURNS NUMERIC AS $$
  SELECT COALESCE(current_stock, 0)
  FROM   stock_balances
  WHERE  product_id  = p_product_id
    AND  location_id = p_location_id;
$$ LANGUAGE sql STABLE;

-- =============================================================================
-- FUNCTION: get_stock_summary
-- Purpose: Get all products with current stock for a location
-- =============================================================================

CREATE OR REPLACE FUNCTION get_stock_summary(p_location_id UUID)
RETURNS TABLE (
  product_id    UUID,
  sku           TEXT,
  product_name  TEXT,
  category_name TEXT,
  unit_symbol   TEXT,
  current_stock NUMERIC,
  min_stock     NUMERIC,
  cost_price    NUMERIC,
  stock_value   NUMERIC,
  status        TEXT,
  last_movement TIMESTAMPTZ
) AS $$
  SELECT
    p.id,
    p.sku,
    p.name,
    c.name,
    u.symbol,
    COALESCE(sb.current_stock, 0),
    COALESCE(lp.min_stock, p.min_stock, 0),
    p.cost_price,
    COALESCE(sb.current_stock, 0) * COALESCE(p.cost_price, 0),
    CASE
      WHEN COALESCE(sb.current_stock, 0) <= 0                              THEN 'zero'
      WHEN COALESCE(sb.current_stock, 0) <= COALESCE(lp.min_stock, p.min_stock, 0) THEN 'low'
      WHEN COALESCE(sb.current_stock, 0) <= COALESCE(lp.min_stock, p.min_stock, 0) * 1.5 THEN 'warning'
      ELSE 'ok'
    END,
    sb.last_movement_at
  FROM products p
  JOIN categories c       ON c.id = p.category_id
  JOIN units u            ON u.id = p.unit_id
  LEFT JOIN location_products lp ON lp.product_id = p.id AND lp.location_id = p_location_id
  LEFT JOIN stock_balances sb    ON sb.product_id  = p.id AND sb.location_id = p_location_id
  WHERE p.is_active = TRUE
  ORDER BY c.sort_order, p.name;
$$ LANGUAGE sql STABLE;

-- =============================================================================
-- FUNCTION: record_movement
-- Purpose: Idempotent movement recording with balance update
-- =============================================================================

CREATE OR REPLACE FUNCTION record_movement(
  p_product_id      UUID,
  p_location_id     UUID,
  p_movement_type   movement_type,
  p_quantity        NUMERIC,        -- signed quantity
  p_performed_by    UUID,
  p_unit_cost       NUMERIC DEFAULT NULL,
  p_reference_type  TEXT DEFAULT NULL,
  p_reference_id    UUID DEFAULT NULL,
  p_reference_code  TEXT DEFAULT NULL,
  p_notes           TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS stock_movements AS $$
DECLARE
  v_movement stock_movements;
BEGIN
  -- Idempotency check
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_movement
    FROM stock_movements
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
      RETURN v_movement;  -- Return existing movement (idempotent)
    END IF;
  END IF;

  -- Validate quantity is non-zero
  IF p_quantity = 0 THEN
    RAISE EXCEPTION 'Movement quantity cannot be zero';
  END IF;

  -- Insert movement (triggers update_stock_balance automatically)
  INSERT INTO stock_movements (
    product_id, location_id, movement_type, quantity,
    unit_cost, reference_type, reference_id, reference_code,
    notes, performed_by, performed_at, idempotency_key
  ) VALUES (
    p_product_id, p_location_id, p_movement_type, p_quantity,
    p_unit_cost, p_reference_type, p_reference_id, p_reference_code,
    p_notes, p_performed_by, NOW(), p_idempotency_key
  )
  RETURNING * INTO v_movement;

  RETURN v_movement;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCTION: generate_document_code
-- Purpose: Generate sequential human-readable codes for documents
-- Format: PREFIX-YYYY-NNNN (e.g., PE-2024-0001, TRF-2024-0001)
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS purchase_entry_seq START 1;
CREATE SEQUENCE IF NOT EXISTS transfer_seq START 1;
CREATE SEQUENCE IF NOT EXISTS physical_count_seq START 1;

CREATE OR REPLACE FUNCTION generate_purchase_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.code := 'PE-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('purchase_entry_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_transfer_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.code := 'TRF-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('transfer_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_count_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.code := 'CNT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('physical_count_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_purchase_entries_code
  BEFORE INSERT ON purchase_entries
  FOR EACH ROW WHEN (NEW.code IS NULL OR NEW.code = '')
  EXECUTE FUNCTION generate_purchase_code();

CREATE TRIGGER trg_transfers_code
  BEFORE INSERT ON transfers
  FOR EACH ROW WHEN (NEW.code IS NULL OR NEW.code = '')
  EXECUTE FUNCTION generate_transfer_code();

CREATE TRIGGER trg_physical_counts_code
  BEFORE INSERT ON physical_counts
  FOR EACH ROW WHEN (NEW.code IS NULL OR NEW.code = '')
  EXECUTE FUNCTION generate_count_code();

-- =============================================================================
-- FUNCTION: apply_physical_count_reconciliation
-- Purpose: Apply reconciliation adjustments from approved physical count
-- =============================================================================

CREATE OR REPLACE FUNCTION apply_physical_count_reconciliation(
  p_count_id    UUID,
  p_approved_by UUID
)
RETURNS INT AS $$
DECLARE
  v_count       physical_counts;
  v_item        physical_count_items;
  v_count_items INT := 0;
BEGIN
  -- Fetch and validate count
  SELECT * INTO v_count FROM physical_counts WHERE id = p_count_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Physical count % not found', p_count_id;
  END IF;

  IF v_count.status != 'pending_review' THEN
    RAISE EXCEPTION 'Physical count must be in pending_review status to reconcile. Current: %', v_count.status;
  END IF;

  -- Create reconciliation movements for all items with differences
  FOR v_item IN
    SELECT * FROM physical_count_items
    WHERE physical_count_id = p_count_id
      AND counted_quantity IS NOT NULL
      AND ABS(counted_quantity - system_quantity) > 0.001  -- tolerance for floating point
  LOOP
    PERFORM record_movement(
      p_product_id      := v_item.product_id,
      p_location_id     := v_count.location_id,
      p_movement_type   := 'reconciliation_adjustment',
      p_quantity        := v_item.counted_quantity - v_item.system_quantity,
      p_performed_by    := p_approved_by,
      p_unit_cost       := v_item.unit_cost,
      p_reference_type  := 'physical_count',
      p_reference_id    := p_count_id,
      p_reference_code  := v_count.code,
      p_notes           := 'Reconciliation from physical count ' || v_count.code
    );
    v_count_items := v_count_items + 1;
  END LOOP;

  -- Update count status
  UPDATE physical_counts
  SET status      = 'reconciled',
      approved_by = p_approved_by,
      approved_at = NOW(),
      updated_at  = NOW()
  WHERE id = p_count_id;

  RETURN v_count_items;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCTION: apply_transfer
-- Purpose: Apply a transfer between locations (creates movement pairs)
-- =============================================================================

CREATE OR REPLACE FUNCTION apply_transfer(
  p_transfer_id UUID,
  p_received_by UUID
)
RETURNS VOID AS $$
DECLARE
  v_transfer   transfers;
  v_item       transfer_items;
BEGIN
  SELECT * INTO v_transfer FROM transfers WHERE id = p_transfer_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer % not found', p_transfer_id;
  END IF;

  IF v_transfer.status NOT IN ('in_transit', 'partial') THEN
    RAISE EXCEPTION 'Transfer must be in_transit or partial to receive. Current: %', v_transfer.status;
  END IF;

  FOR v_item IN
    SELECT * FROM transfer_items
    WHERE transfer_id = p_transfer_id
      AND quantity_received > 0
  LOOP
    -- Deduct from source (already done at send, skip if already recorded)
    -- Credit to destination
    PERFORM record_movement(
      p_product_id      := v_item.product_id,
      p_location_id     := v_transfer.to_location_id,
      p_movement_type   := 'transfer_in',
      p_quantity        := v_item.quantity_received,
      p_performed_by    := p_received_by,
      p_reference_type  := 'transfer',
      p_reference_id    := p_transfer_id,
      p_reference_code  := v_transfer.code,
      p_idempotency_key := 'transfer_in_' || v_item.id::TEXT
    );
  END LOOP;

  UPDATE transfers
  SET status      = 'received',
      received_by = p_received_by,
      received_at = NOW(),
      updated_at  = NOW()
  WHERE id = p_transfer_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCTION: send_transfer
-- Purpose: Send a transfer (creates transfer_out movements)
-- =============================================================================

CREATE OR REPLACE FUNCTION send_transfer(
  p_transfer_id UUID,
  p_sent_by     UUID
)
RETURNS VOID AS $$
DECLARE
  v_transfer transfers;
  v_item     transfer_items;
BEGIN
  SELECT * INTO v_transfer FROM transfers WHERE id = p_transfer_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer % not found', p_transfer_id;
  END IF;

  IF v_transfer.status != 'pending_approval' THEN
    RAISE EXCEPTION 'Transfer must be pending_approval to send. Current: %', v_transfer.status;
  END IF;

  FOR v_item IN
    SELECT * FROM transfer_items
    WHERE transfer_id = p_transfer_id
      AND quantity_sent > 0
  LOOP
    -- Check available stock
    IF get_current_stock(v_item.product_id, v_transfer.from_location_id) < v_item.quantity_sent THEN
      RAISE EXCEPTION 'Insufficient stock for product % at source location', v_item.product_id;
    END IF;

    -- Deduct from source
    PERFORM record_movement(
      p_product_id      := v_item.product_id,
      p_location_id     := v_transfer.from_location_id,
      p_movement_type   := 'transfer_out',
      p_quantity        := -v_item.quantity_sent,  -- NEGATIVE
      p_performed_by    := p_sent_by,
      p_reference_type  := 'transfer',
      p_reference_id    := p_transfer_id,
      p_reference_code  := v_transfer.code,
      p_idempotency_key := 'transfer_out_' || v_item.id::TEXT
    );
  END LOOP;

  UPDATE transfers
  SET status   = 'in_transit',
      sent_by  = p_sent_by,
      sent_at  = NOW(),
      updated_at = NOW()
  WHERE id = p_transfer_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_balances         ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_entries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_counts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alert_rules      ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: get current user's location IDs
CREATE OR REPLACE FUNCTION auth_user_location_ids()
RETURNS UUID[] AS $$
  SELECT ARRAY_AGG(location_id)
  FROM user_locations
  WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Admin bypass policy (applied first)
CREATE POLICY admin_all ON users
  USING (auth_user_role() = 'admin');

-- Users can see their own record
CREATE POLICY users_self ON users
  FOR SELECT USING (id = auth.uid());

-- Location access control
CREATE POLICY location_access ON stock_movements
  USING (
    auth_user_role() = 'admin' OR
    location_id = ANY(auth_user_location_ids())
  );

CREATE POLICY location_access ON stock_balances
  USING (
    auth_user_role() = 'admin' OR
    location_id = ANY(auth_user_location_ids())
  );

CREATE POLICY location_access ON purchase_entries
  USING (
    auth_user_role() IN ('admin', 'manager') OR
    location_id = ANY(auth_user_location_ids())
  );

CREATE POLICY location_access ON transfers
  USING (
    auth_user_role() IN ('admin', 'manager') OR
    from_location_id = ANY(auth_user_location_ids()) OR
    to_location_id   = ANY(auth_user_location_ids())
  );

CREATE POLICY location_access ON physical_counts
  USING (
    auth_user_role() IN ('admin', 'manager') OR
    location_id = ANY(auth_user_location_ids())
  );

-- Public read on reference tables for authenticated users
CREATE POLICY authenticated_read ON categories     FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY authenticated_read ON units          FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY authenticated_read ON products       FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY authenticated_read ON locations      FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY authenticated_read ON suppliers      FOR SELECT USING (auth.uid() IS NOT NULL);

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Current stock with all product details (for dashboard)
CREATE OR REPLACE VIEW v_current_stock AS
SELECT
  p.id           AS product_id,
  p.sku,
  p.name         AS product_name,
  c.id           AS category_id,
  c.name         AS category_name,
  c.color        AS category_color,
  u.symbol       AS unit_symbol,
  l.id           AS location_id,
  l.name         AS location_name,
  l.code         AS location_code,
  l.color        AS location_color,
  COALESCE(sb.current_stock, 0)                              AS current_stock,
  COALESCE(lp.min_stock, p.min_stock, 0)                    AS min_stock,
  COALESCE(lp.reorder_point, p.reorder_point)               AS reorder_point,
  p.cost_price,
  COALESCE(sb.current_stock, 0) * COALESCE(p.cost_price, 0) AS stock_value,
  sb.last_movement_at,
  CASE
    WHEN COALESCE(sb.current_stock, 0) <= 0                                                THEN 'zero'
    WHEN COALESCE(sb.current_stock, 0) <= COALESCE(lp.min_stock, p.min_stock, 0)          THEN 'low'
    WHEN COALESCE(sb.current_stock, 0) <= COALESCE(lp.min_stock, p.min_stock, 0) * 1.5   THEN 'warning'
    ELSE 'ok'
  END AS stock_status
FROM products p
CROSS JOIN locations l
JOIN categories c ON c.id = p.category_id
JOIN units u ON u.id = p.unit_id
LEFT JOIN location_products lp ON lp.product_id = p.id AND lp.location_id = l.id
LEFT JOIN stock_balances sb    ON sb.product_id  = p.id AND sb.location_id = l.id
WHERE p.is_active = TRUE AND l.is_active = TRUE;

-- Low stock alerts view
CREATE OR REPLACE VIEW v_low_stock_alerts AS
SELECT *
FROM v_current_stock
WHERE stock_status IN ('zero', 'low', 'warning')
ORDER BY location_name, stock_status, product_name;

-- Movement history with full context
CREATE OR REPLACE VIEW v_movement_history AS
SELECT
  sm.id,
  sm.performed_at,
  sm.movement_type,
  sm.quantity,
  sm.unit_cost,
  sm.total_cost,
  sm.running_balance,
  sm.reference_type,
  sm.reference_code,
  sm.notes,
  p.id           AS product_id,
  p.sku,
  p.name         AS product_name,
  c.name         AS category_name,
  u.symbol       AS unit_symbol,
  l.id           AS location_id,
  l.name         AS location_name,
  usr.full_name  AS performed_by_name
FROM stock_movements sm
JOIN products p  ON p.id  = sm.product_id
JOIN categories c ON c.id = p.category_id
JOIN units u ON u.id = p.unit_id
JOIN locations l ON l.id  = sm.location_id
JOIN users usr   ON usr.id = sm.performed_by
ORDER BY sm.performed_at DESC;
