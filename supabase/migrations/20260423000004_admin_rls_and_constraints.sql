-- Admin RLS policies for existing tables, plus the profiles/audit_logs admin policies.
-- Depends on app.is_admin() from migration 20260423000003.

-- profiles: admins can read and update all
-- Logic: caller must have admin or superadmin role
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (app.is_admin());

CREATE POLICY "Admins can update profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

-- audit_logs: admins can insert and view
-- Logic: only admins write and read the audit trail
CREATE POLICY "Admins can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (app.is_admin());

CREATE POLICY "Admins can view audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (app.is_admin());

-- reru_clients: admins can read and update all clients
-- Logic: admins need full client visibility for management
CREATE POLICY "Admins can view all clients"
  ON reru_clients
  FOR SELECT
  TO authenticated
  USING (app.is_admin());

CREATE POLICY "Admins can update clients"
  ON reru_clients
  FOR UPDATE
  TO authenticated
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

-- reru_invoices: admins can read, create, and update all invoices
-- Logic: admins generate invoices in bulk and mark them paid
CREATE POLICY "Admins can view all invoices"
  ON reru_invoices
  FOR SELECT
  TO authenticated
  USING (app.is_admin());

CREATE POLICY "Admins can insert invoices"
  ON reru_invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (app.is_admin());

CREATE POLICY "Admins can update invoices"
  ON reru_invoices
  FOR UPDATE
  TO authenticated
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

-- reru_collections: admins can read, create, and update all collections
-- Logic: admins schedule, complete, and mark-missed collection records
CREATE POLICY "Admins can view all collections"
  ON reru_collections
  FOR SELECT
  TO authenticated
  USING (app.is_admin());

CREATE POLICY "Admins can insert collections"
  ON reru_collections
  FOR INSERT
  TO authenticated
  WITH CHECK (app.is_admin());

CREATE POLICY "Admins can update collections"
  ON reru_collections
  FOR UPDATE
  TO authenticated
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

-- Prevent duplicate collection records for the same client on the same day.
-- Used by bulk-schedule upsert logic.
ALTER TABLE reru_collections
  ADD CONSTRAINT IF NOT EXISTS collections_client_date_unique
  UNIQUE (client_id, scheduled_date);
