-- =============================================================================
-- 0007_rls_policies.sql
-- Row-Level Security policies
--
-- Access model:
--   admin      → full access to everything
--   supervisor → read/write for their assigned locations
--   encargado  → read/write operations for their assigned locations
--   read_only  → read-only for their assigned locations
--
-- Helper functions defined in 0008_functions.sql are used here:
--   auth_user_role()        → current user's role
--   is_admin()              → TRUE if admin
--   can_access_location(id) → TRUE if user has access to that location
-- =============================================================================

-- ── Roles: readable by all authenticated users ────────────────────────────────

CREATE POLICY "roles_select_authenticated"
  ON roles FOR SELECT
  TO authenticated
  USING (TRUE);

-- ── Users ─────────────────────────────────────────────────────────────────────

-- Everyone can read their own profile
CREATE POLICY "users_select_self"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admin can read all users
CREATE POLICY "users_select_admin"
  ON users FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admin can update any user
CREATE POLICY "users_update_admin"
  ON users FOR UPDATE
  TO authenticated
  USING (is_admin());

-- Users can update their own profile (limited fields managed by app)
CREATE POLICY "users_update_self"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Admin can insert users (usually done via auth.users trigger)
CREATE POLICY "users_insert_admin"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- ── User locations ────────────────────────────────────────────────────────────

-- Users can read their own assignments
CREATE POLICY "user_locations_select_self"
  ON user_locations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin can read all
CREATE POLICY "user_locations_select_admin"
  ON user_locations FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admin can manage all assignments
CREATE POLICY "user_locations_manage_admin"
  ON user_locations FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ── Locations ─────────────────────────────────────────────────────────────────

-- All authenticated users can read locations they have access to
CREATE POLICY "locations_select_accessible"
  ON locations FOR SELECT
  TO authenticated
  USING (is_admin() OR can_access_location(id));

-- Admin can manage locations
CREATE POLICY "locations_manage_admin"
  ON locations FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ── Categories ────────────────────────────────────────────────────────────────

-- All authenticated users can read categories
CREATE POLICY "categories_select_authenticated"
  ON categories FOR SELECT
  TO authenticated
  USING (TRUE);

-- Only admin/supervisor can manage categories
CREATE POLICY "categories_manage_supervisor"
  ON categories FOR ALL
  TO authenticated
  USING (is_admin() OR auth_user_role() = 'supervisor')
  WITH CHECK (is_admin() OR auth_user_role() = 'supervisor');

-- ── Units ─────────────────────────────────────────────────────────────────────

CREATE POLICY "units_select_authenticated"
  ON units FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "units_manage_admin"
  ON units FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ── SKU sequences ─────────────────────────────────────────────────────────────

-- Supervisor+ can read sequences
CREATE POLICY "sku_sequences_select"
  ON sku_sequences FOR SELECT
  TO authenticated
  USING (is_admin() OR auth_user_role() IN ('supervisor','encargado'));

-- Only managed via functions (not direct DML from app)
CREATE POLICY "sku_sequences_manage_admin"
  ON sku_sequences FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ── Products ──────────────────────────────────────────────────────────────────

-- All authenticated users can read active products
CREATE POLICY "products_select_authenticated"
  ON products FOR SELECT
  TO authenticated
  USING (is_active = TRUE OR is_admin() OR auth_user_role() = 'supervisor');

-- Supervisor+ can create and update products
CREATE POLICY "products_insert_supervisor"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (is_admin() OR auth_user_role() = 'supervisor');

CREATE POLICY "products_update_supervisor"
  ON products FOR UPDATE
  TO authenticated
  USING (is_admin() OR auth_user_role() = 'supervisor');

-- Only admin can hard-delete products
CREATE POLICY "products_delete_admin"
  ON products FOR DELETE
  TO authenticated
  USING (is_admin());

-- ── Product aliases ───────────────────────────────────────────────────────────

CREATE POLICY "product_aliases_select_authenticated"
  ON product_aliases FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "product_aliases_manage_supervisor"
  ON product_aliases FOR ALL
  TO authenticated
  USING (is_admin() OR auth_user_role() = 'supervisor')
  WITH CHECK (is_admin() OR auth_user_role() = 'supervisor');

-- ── Location products ─────────────────────────────────────────────────────────

CREATE POLICY "location_products_select_accessible"
  ON location_products FOR SELECT
  TO authenticated
  USING (is_admin() OR can_access_location(location_id));

CREATE POLICY "location_products_manage_supervisor"
  ON location_products FOR ALL
  TO authenticated
  USING (is_admin() OR (auth_user_role() = 'supervisor' AND can_access_location(location_id)))
  WITH CHECK (is_admin() OR (auth_user_role() = 'supervisor' AND can_access_location(location_id)));

-- ── Stock balances ────────────────────────────────────────────────────────────

CREATE POLICY "stock_balances_select_accessible"
  ON stock_balances FOR SELECT
  TO authenticated
  USING (is_admin() OR can_access_location(location_id));

-- Balances are maintained by triggers, not direct DML
CREATE POLICY "stock_balances_manage_admin"
  ON stock_balances FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ── Stock movements ───────────────────────────────────────────────────────────

CREATE POLICY "stock_movements_select_accessible"
  ON stock_movements FOR SELECT
  TO authenticated
  USING (is_admin() OR can_access_location(location_id));

-- Encargado+ can insert movements for accessible locations
CREATE POLICY "stock_movements_insert_encargado"
  ON stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (
    can_access_location(location_id) AND
    auth_user_role() IN ('admin','supervisor','encargado')
  );

-- Movements are immutable once created — no update/delete for non-admins
CREATE POLICY "stock_movements_update_admin"
  ON stock_movements FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "stock_movements_delete_admin"
  ON stock_movements FOR DELETE
  TO authenticated
  USING (is_admin());

-- ── Stock alert rules ─────────────────────────────────────────────────────────

CREATE POLICY "alert_rules_select_accessible"
  ON stock_alert_rules FOR SELECT
  TO authenticated
  USING (is_admin() OR (location_id IS NULL) OR can_access_location(location_id));

CREATE POLICY "alert_rules_manage_supervisor"
  ON stock_alert_rules FOR ALL
  TO authenticated
  USING (is_admin() OR auth_user_role() = 'supervisor')
  WITH CHECK (is_admin() OR auth_user_role() = 'supervisor');

-- ── Stock snapshots legacy ────────────────────────────────────────────────────

CREATE POLICY "snapshots_select_authenticated"
  ON stock_snapshots_legacy FOR SELECT
  TO authenticated
  USING (is_admin() OR location_id IS NULL OR can_access_location(location_id));

CREATE POLICY "snapshots_manage_admin"
  ON stock_snapshots_legacy FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ── Suppliers ─────────────────────────────────────────────────────────────────

CREATE POLICY "suppliers_select_authenticated"
  ON suppliers FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "suppliers_manage_supervisor"
  ON suppliers FOR ALL
  TO authenticated
  USING (is_admin() OR auth_user_role() = 'supervisor')
  WITH CHECK (is_admin() OR auth_user_role() = 'supervisor');

-- ── Purchase entries ──────────────────────────────────────────────────────────

CREATE POLICY "purchase_entries_select_accessible"
  ON purchase_entries FOR SELECT
  TO authenticated
  USING (is_admin() OR can_access_location(location_id));

CREATE POLICY "purchase_entries_insert_encargado"
  ON purchase_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    can_access_location(location_id) AND
    auth_user_role() IN ('admin','supervisor','encargado')
  );

CREATE POLICY "purchase_entries_update_encargado"
  ON purchase_entries FOR UPDATE
  TO authenticated
  USING (
    can_access_location(location_id) AND
    auth_user_role() IN ('admin','supervisor','encargado')
  );

CREATE POLICY "purchase_entries_delete_admin"
  ON purchase_entries FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "purchase_entry_items_select_accessible"
  ON purchase_entry_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM purchase_entries pe
      WHERE pe.id = purchase_entry_id
        AND (is_admin() OR can_access_location(pe.location_id))
    )
  );

CREATE POLICY "purchase_entry_items_manage_encargado"
  ON purchase_entry_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM purchase_entries pe
      WHERE pe.id = purchase_entry_id
        AND can_access_location(pe.location_id)
        AND auth_user_role() IN ('admin','supervisor','encargado')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM purchase_entries pe
      WHERE pe.id = purchase_entry_id
        AND can_access_location(pe.location_id)
        AND auth_user_role() IN ('admin','supervisor','encargado')
    )
  );

-- ── Transfers ─────────────────────────────────────────────────────────────────

CREATE POLICY "transfers_select_accessible"
  ON transfers FOR SELECT
  TO authenticated
  USING (
    is_admin() OR
    can_access_location(from_location_id) OR
    can_access_location(to_location_id)
  );

CREATE POLICY "transfers_insert_encargado"
  ON transfers FOR INSERT
  TO authenticated
  WITH CHECK (
    auth_user_role() IN ('admin','supervisor','encargado') AND
    (can_access_location(from_location_id) OR can_access_location(to_location_id))
  );

CREATE POLICY "transfers_update_encargado"
  ON transfers FOR UPDATE
  TO authenticated
  USING (
    auth_user_role() IN ('admin','supervisor','encargado') AND
    (can_access_location(from_location_id) OR can_access_location(to_location_id))
  );

CREATE POLICY "transfer_items_select_accessible"
  ON transfer_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transfers t
      WHERE t.id = transfer_id AND (
        is_admin() OR can_access_location(t.from_location_id) OR can_access_location(t.to_location_id)
      )
    )
  );

CREATE POLICY "transfer_items_manage_encargado"
  ON transfer_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transfers t
      WHERE t.id = transfer_id AND
        auth_user_role() IN ('admin','supervisor','encargado') AND
        (can_access_location(t.from_location_id) OR can_access_location(t.to_location_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transfers t
      WHERE t.id = transfer_id AND
        auth_user_role() IN ('admin','supervisor','encargado') AND
        (can_access_location(t.from_location_id) OR can_access_location(t.to_location_id))
    )
  );

-- ── Physical counts ───────────────────────────────────────────────────────────

CREATE POLICY "physical_counts_select_accessible"
  ON physical_counts FOR SELECT
  TO authenticated
  USING (is_admin() OR can_access_location(location_id));

CREATE POLICY "physical_counts_insert_encargado"
  ON physical_counts FOR INSERT
  TO authenticated
  WITH CHECK (
    can_access_location(location_id) AND
    auth_user_role() IN ('admin','supervisor','encargado')
  );

CREATE POLICY "physical_counts_update_encargado"
  ON physical_counts FOR UPDATE
  TO authenticated
  USING (
    can_access_location(location_id) AND
    auth_user_role() IN ('admin','supervisor','encargado')
  );

CREATE POLICY "physical_count_items_select_accessible"
  ON physical_count_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM physical_counts pc
      WHERE pc.id = physical_count_id AND (is_admin() OR can_access_location(pc.location_id))
    )
  );

CREATE POLICY "physical_count_items_manage_encargado"
  ON physical_count_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM physical_counts pc
      WHERE pc.id = physical_count_id AND
        auth_user_role() IN ('admin','supervisor','encargado') AND
        can_access_location(pc.location_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM physical_counts pc
      WHERE pc.id = physical_count_id AND
        auth_user_role() IN ('admin','supervisor','encargado') AND
        can_access_location(pc.location_id)
    )
  );

-- ── Audit logs ────────────────────────────────────────────────────────────────

CREATE POLICY "audit_logs_select_admin"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (is_admin() OR user_id = auth.uid());

CREATE POLICY "audit_logs_insert_authenticated"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ── Migration runs ────────────────────────────────────────────────────────────

CREATE POLICY "migration_runs_select_admin"
  ON migration_import_runs FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "migration_runs_manage_admin"
  ON migration_import_runs FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "migration_rows_select_admin"
  ON migration_import_rows FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "migration_rows_manage_admin"
  ON migration_import_rows FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
