-- =============================================================================
-- 0009_triggers.sql
-- updated_at triggers, auth.users sync, audit helpers
-- =============================================================================

-- ── updated_at triggers ───────────────────────────────────────────────────────

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_location_products_updated_at
  BEFORE UPDATE ON location_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_sku_sequences_updated_at
  BEFORE UPDATE ON sku_sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_purchase_entries_updated_at
  BEFORE UPDATE ON purchase_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_transfers_updated_at
  BEFORE UPDATE ON transfers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_physical_counts_updated_at
  BEFORE UPDATE ON physical_counts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── auth.users → public.users sync trigger ────────────────────────────────────
-- Fires on INSERT into auth.users (triggered by Supabase Auth sign-up).
-- Creates a matching row in public.users with role = 'read_only' by default.

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    'read_only',   -- default role; admin upgrades after creation
    TRUE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET email      = EXCLUDED.email,
        updated_at = NOW();

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- ── Auto-generate entry codes for purchase_entries ────────────────────────────

CREATE OR REPLACE FUNCTION generate_entry_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.entry_code IS NULL OR NEW.entry_code = '' THEN
    NEW.entry_code := 'PE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(
      (SELECT COUNT(*) + 1 FROM purchase_entries
       WHERE entry_date = CURRENT_DATE)::TEXT, 4, '0'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_purchase_entries_code
  BEFORE INSERT ON purchase_entries
  FOR EACH ROW EXECUTE FUNCTION generate_entry_code();

-- ── Auto-generate transfer codes ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_transfer_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.transfer_code IS NULL OR NEW.transfer_code = '' THEN
    NEW.transfer_code := 'TR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(
      (SELECT COUNT(*) + 1 FROM transfers
       WHERE transfer_date = CURRENT_DATE)::TEXT, 4, '0'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_transfers_code
  BEFORE INSERT ON transfers
  FOR EACH ROW EXECUTE FUNCTION generate_transfer_code();

-- ── Auto-generate count codes ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_count_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.count_code IS NULL OR NEW.count_code = '' THEN
    NEW.count_code := 'PC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(
      (SELECT COUNT(*) + 1 FROM physical_counts
       WHERE count_date = CURRENT_DATE)::TEXT, 4, '0'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_physical_counts_code
  BEFORE INSERT ON physical_counts
  FOR EACH ROW EXECUTE FUNCTION generate_count_code();

-- ── purchase_entries total_amount auto-update ─────────────────────────────────

CREATE OR REPLACE FUNCTION sync_purchase_entry_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE purchase_entries
  SET total_amount = (
    SELECT COALESCE(SUM(COALESCE(total_cost, 0)), 0)
    FROM purchase_entry_items
    WHERE purchase_entry_id = COALESCE(NEW.purchase_entry_id, OLD.purchase_entry_id)
  )
  WHERE id = COALESCE(NEW.purchase_entry_id, OLD.purchase_entry_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_purchase_items_sync_total
  AFTER INSERT OR UPDATE OR DELETE ON purchase_entry_items
  FOR EACH ROW EXECUTE FUNCTION sync_purchase_entry_total();
