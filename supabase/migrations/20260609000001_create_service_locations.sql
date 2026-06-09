-- Service locations replace the coarse Zone A/B/C enum.
-- Admin-managed list of towns/areas RERU currently serves (Kira Municipality & Wakiso).
-- Clients pick a location during onboarding; admins can add/disable locations.

CREATE TABLE IF NOT EXISTS service_locations (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL UNIQUE,
  active     boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE service_locations ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon mid-onboarding) may read active locations; admins see all.
DROP POLICY IF EXISTS "Anyone can view active locations" ON service_locations;
CREATE POLICY "Anyone can view active locations" ON service_locations
  FOR SELECT
  USING (active = true OR app.is_admin());

-- Only admins create / rename / toggle locations.
DROP POLICY IF EXISTS "Admins manage locations" ON service_locations;
CREATE POLICY "Admins manage locations" ON service_locations
  FOR ALL
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

-- Seed the primary service area.
INSERT INTO service_locations (name) VALUES
  ('Nsasa'), ('Bulindo'), ('Nabusugwe'), ('Mulawa'), ('Kira'), ('Buwate'),
  ('Kitikifumba'), ('Najjera'), ('Kiwologoma'), ('Nakwero'), ('Kitikutwe'),
  ('Ntinda'), ('Kiwatule'), ('Nalya'), ('Namugongo'), ('Mbalwa'), ('Sonde'), ('Misindye')
ON CONFLICT (name) DO NOTHING;
