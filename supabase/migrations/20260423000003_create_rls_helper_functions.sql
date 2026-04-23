-- RLS helper functions in the app schema.
-- SECURITY DEFINER so they can query profiles without being blocked by RLS.
-- All policies reference these functions rather than inlining subqueries.

CREATE SCHEMA IF NOT EXISTS app;

-- Returns reru_clients.id for the authenticated user
CREATE OR REPLACE FUNCTION app.current_client_id()
RETURNS uuid AS $$
  SELECT id FROM reru_clients WHERE user_id = auth.uid() LIMIT 1
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Returns the role string for the authenticated user
CREATE OR REPLACE FUNCTION app.current_user_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Returns true if the authenticated user is admin or superadmin
CREATE OR REPLACE FUNCTION app.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
