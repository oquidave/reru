-- Creates the profiles table that maps every auth.users row to a role.
-- Separate from reru_clients so admins and superadmins don't need a client record.

CREATE TABLE IF NOT EXISTS profiles (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text        NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin', 'superadmin')),
  full_name  text        NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
-- Logic: profile.user_id must match the authenticated user
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Backfill: create a client profile for every existing auth user
INSERT INTO profiles (user_id, role, full_name)
SELECT id, 'client', ''
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
