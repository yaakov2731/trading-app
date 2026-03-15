-- =============================================================================
-- 0008_functions.sql
-- DB helper functions: auth helpers, SKU generation, movement recording
-- =============================================================================

-- ── Auth helper functions (used in RLS policies) ──────────────────────────────

-- Returns the current user's role from the users table
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS TEXT
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

-- Returns TRUE if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Returns TRUE if current user has access to a given location
CREATE OR REPLACE FUNCTION can_access_location(p_location_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM user_locations
    WHERE user_id = auth.uid()
      AND location_id = p_location_id
  );
$$;

-- ── update_updated_at trigger function ────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ── SKU sequence generation ────────────────────────────────────────────────────
-- Concurrency-safe: uses SELECT FOR UPDATE to prevent race conditions.
-- Returns formatted SKU like CAR-0001, VER-0042, BEB-0100

CREATE OR REPLACE FUNCTION generate_sku(p_category_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix       TEXT;
  v_sequence     INT;
  v_new_sequence INT;
  v_sku          TEXT;
BEGIN
  -- Get category prefix
  SELECT prefix INTO v_prefix
  FROM categories
  WHERE id = p_category_id AND is_active = TRUE;

  IF v_prefix IS NULL THEN
    RAISE EXCEPTION 'Category not found or inactive: %', p_category_id;
  END IF;

  -- Lock the sequence row to prevent concurrent SKU generation
  SELECT last_sequence INTO v_sequence
  FROM sku_sequences
  WHERE category_id = p_category_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Initialize sequence if not yet created
    INSERT INTO sku_sequences (category_id, last_sequence)
    VALUES (p_category_id, 0)
    ON CONFLICT (category_id) DO NOTHING;

    v_sequence := 0;
  END IF;

  v_new_sequence := v_sequence + 1;

  -- Update sequence
  UPDATE sku_sequences
  SET last_sequence = v_new_sequence,
      updated_at    = NOW()
  WHERE category_id = p_category_id;

  -- Format: PREFIX-NNNN (zero-padded to 4 digits, extends beyond 9999)
  v_sku := v_prefix || '-' || LPAD(v_new_sequence::TEXT, 4, '0');

  -- Ensure uniqueness (failsafe — should not be needed in normal operation)
  IF EXISTS (SELECT 1 FROM products WHERE sku = v_sku) THEN
    RAISE EXCEPTION 'SKU collision detected: %. This should not happen.', v_sku;
  END IF;

  RETURN v_sku;
END;
$$;

-- ── Create product with SKU in a single transaction ───────────────────────────

CREATE OR REPLACE FUNCTION create_product_with_sku(
  p_name        TEXT,
  p_category_id UUID,
  p_unit_id     UUID,
  p_description TEXT    DEFAULT NULL,
  p_cost_price  NUMERIC DEFAULT NULL,
  p_sale_price  NUMERIC DEFAULT NULL,
  p_min_stock   NUMERIC DEFAULT 0,
  p_max_stock   NUMERIC DEFAULT NULL,
  p_barcode     TEXT    DEFAULT NULL,
  p_notes       TEXT    DEFAULT NULL,
  p_created_by  UUID    DEFAULT NULL,
  p_is_legacy   BOOLEAN DEFAULT FALSE,
  p_legacy_sku  TEXT    DEFAULT NULL       -- if set, use this SKU instead of generating
)
RETURNS products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sku     TEXT;
  v_product products;
BEGIN
  -- Determine SKU
  IF p_legacy_sku IS NOT NULL AND p_legacy_sku <> '' THEN
    -- Legacy import: preserve original SKU
    v_sku := p_legacy_sku;
    IF EXISTS (SELECT 1 FROM products WHERE sku = v_sku) THEN
      RAISE EXCEPTION 'SKU already exists: %', v_sku;
    END IF;
  ELSE
    -- Generate new SKU from sequence
    v_sku := generate_sku(p_category_id);
  END IF;

  INSERT INTO products (
    sku, name, description, category_id, unit_id,
    cost_price, sale_price, min_stock, max_stock,
    barcode, notes, created_by, is_legacy
  ) VALUES (
    v_sku, p_name, p_description, p_category_id, p_unit_id,
    p_cost_price, p_sale_price, COALESCE(p_min_stock, 0), p_max_stock,
    p_barcode, p_notes, p_created_by, COALESCE(p_is_legacy, FALSE)
  )
  RETURNING * INTO v_product;

  -- Ensure sku_sequences row exists for this category
  INSERT INTO sku_sequences (category_id, last_sequence)
  VALUES (p_category_id, 0)
  ON CONFLICT (category_id) DO NOTHING;

  RETURN v_product;
END;
$$;

-- ── record_movement — atomic movement + balance update ────────────────────────

CREATE OR REPLACE FUNCTION record_movement(
  p_product_id       UUID,
  p_location_id      UUID,
  p_movement_type    TEXT,
  p_quantity         NUMERIC,
  p_unit_cost        NUMERIC  DEFAULT NULL,
  p_reference_type   TEXT     DEFAULT NULL,
  p_reference_id     UUID     DEFAULT NULL,
  p_notes            TEXT     DEFAULT NULL,
  p_performed_by     UUID     DEFAULT NULL,
  p_idempotency_key  TEXT     DEFAULT NULL
)
RETURNS stock_movements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id         UUID;
  v_current_balance NUMERIC;
  v_new_balance     NUMERIC;
  v_movement        stock_movements;
  v_reference_code  TEXT;
BEGIN
  -- Determine performed_by
  v_user_id := COALESCE(p_performed_by, auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'performed_by is required';
  END IF;

  -- Idempotency check: return existing movement if key already used
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_movement
    FROM stock_movements
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
      RETURN v_movement;
    END IF;
  END IF;

  -- Validate quantity
  IF p_quantity = 0 THEN
    RAISE EXCEPTION 'Movement quantity cannot be zero';
  END IF;

  -- Validate movement type
  IF p_movement_type NOT IN (
    'opening_stock','purchase_in','production_in',
    'consumption_out','transfer_out','transfer_in',
    'waste_out','manual_adjustment','physical_count',
    'reconciliation_adjustment'
  ) THEN
    RAISE EXCEPTION 'Invalid movement type: %', p_movement_type;
  END IF;

  -- Get current balance (with row lock for consistency)
  SELECT current_stock INTO v_current_balance
  FROM stock_balances
  WHERE product_id = p_product_id AND location_id = p_location_id
  FOR UPDATE;

  -- If no balance row exists yet, start at 0
  v_current_balance := COALESCE(v_current_balance, 0);
  v_new_balance     := v_current_balance + p_quantity;

  -- Build reference code if reference provided
  IF p_reference_id IS NOT NULL THEN
    v_reference_code := UPPER(COALESCE(p_reference_type, 'REF')) || '-' || LEFT(p_reference_id::TEXT, 8);
  END IF;

  -- Insert movement
  INSERT INTO stock_movements (
    product_id, location_id, movement_type, quantity,
    unit_cost, total_cost,
    reference_type, reference_id, reference_code,
    running_balance, notes,
    performed_by, performed_at, idempotency_key
  ) VALUES (
    p_product_id, p_location_id, p_movement_type, p_quantity,
    p_unit_cost, CASE WHEN p_unit_cost IS NOT NULL THEN ABS(p_quantity) * p_unit_cost ELSE NULL END,
    p_reference_type, p_reference_id, v_reference_code,
    v_new_balance, p_notes,
    v_user_id, NOW(), p_idempotency_key
  )
  RETURNING * INTO v_movement;

  -- Upsert stock balance
  INSERT INTO stock_balances (product_id, location_id, current_stock, last_movement_at, last_updated_at)
  VALUES (p_product_id, p_location_id, v_new_balance, NOW(), NOW())
  ON CONFLICT (product_id, location_id) DO UPDATE
    SET current_stock    = EXCLUDED.current_stock,
        last_movement_at = EXCLUDED.last_movement_at,
        last_updated_at  = EXCLUDED.last_updated_at;

  RETURN v_movement;
END;
$$;

-- ── Views ─────────────────────────────────────────────────────────────────────

-- Current stock view (joins balances → products → categories → units → locations)
CREATE OR REPLACE VIEW v_current_stock AS
SELECT
  sb.id,
  sb.product_id,
  sb.location_id,
  p.sku,
  p.name          AS product_name,
  p.barcode,
  p.cost_price    AS unit_cost,
  p.min_stock,
  p.max_stock,
  p.is_active,
  sb.current_stock,
  sb.last_movement_at,
  sb.last_updated_at,
  c.id            AS category_id,
  c.name          AS category_name,
  c.color         AS category_color,
  c.prefix        AS category_prefix,
  u.id            AS unit_id,
  u.name          AS unit_name,
  u.symbol        AS unit_symbol,
  l.id            AS location_id_ref,
  l.name          AS location_name,
  l.color         AS location_color,
  -- Effective min stock: location override or product default
  COALESCE(lp.min_stock, p.min_stock, 0) AS effective_min_stock,
  -- Stock status
  CASE
    WHEN sb.current_stock <= 0                                          THEN 'zero'
    WHEN sb.current_stock <= COALESCE(lp.min_stock, p.min_stock, 0)    THEN 'low'
    WHEN sb.current_stock <= COALESCE(lp.min_stock, p.min_stock, 0) * 1.5 THEN 'warning'
    ELSE 'ok'
  END AS stock_status
FROM stock_balances sb
JOIN products    p  ON p.id  = sb.product_id
JOIN categories  c  ON c.id  = p.category_id
JOIN units       u  ON u.id  = p.unit_id
JOIN locations   l  ON l.id  = sb.location_id
LEFT JOIN location_products lp ON lp.product_id = sb.product_id AND lp.location_id = sb.location_id
WHERE p.is_active = TRUE AND l.is_active = TRUE;

-- Low stock alerts view
CREATE OR REPLACE VIEW v_low_stock_alerts AS
SELECT *
FROM v_current_stock
WHERE stock_status IN ('zero','low','warning')
ORDER BY
  CASE stock_status WHEN 'zero' THEN 1 WHEN 'low' THEN 2 ELSE 3 END,
  location_name,
  product_name;

-- Movement history view
CREATE OR REPLACE VIEW v_movement_history AS
SELECT
  sm.id,
  sm.product_id,
  sm.location_id,
  sm.movement_type,
  sm.quantity,
  sm.unit_cost,
  sm.total_cost,
  sm.reference_type,
  sm.reference_id,
  sm.reference_code,
  sm.running_balance,
  sm.notes,
  sm.performed_by,
  sm.performed_at,
  sm.idempotency_key,
  p.sku,
  p.name            AS product_name,
  u.symbol          AS unit_symbol,
  c.name            AS category_name,
  c.color           AS category_color,
  l.name            AS location_name,
  l.color           AS location_color,
  usr.full_name     AS performed_by_name
FROM stock_movements sm
JOIN products    p   ON p.id  = sm.product_id
JOIN categories  c   ON c.id  = p.category_id
JOIN units       u   ON u.id  = p.unit_id
JOIN locations   l   ON l.id  = sm.location_id
LEFT JOIN users  usr ON usr.id = sm.performed_by;
