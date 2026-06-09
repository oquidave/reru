-- Move reru_clients off the Zone enum and onto service_locations, and add the
-- profiling fields collected during the new post-OTP onboarding step.

ALTER TABLE reru_clients
  ADD COLUMN IF NOT EXISTS location_id           uuid REFERENCES service_locations(id),
  ADD COLUMN IF NOT EXISTS landmark              text,
  ADD COLUMN IF NOT EXISTS property_type         text CHECK (property_type IN ('household', 'business')),
  ADD COLUMN IF NOT EXISTS bin_count             integer CHECK (bin_count IS NULL OR bin_count >= 0),
  ADD COLUMN IF NOT EXISTS alt_phone             text,
  ADD COLUMN IF NOT EXISTS alt_phone_is_whatsapp boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS reru_clients_location_id_idx ON reru_clients (location_id);

-- These are now filled during onboarding (post-signup), so they can't be NOT NULL
-- at the moment the auth user is created. plan/collection_day keep their enum defaults.
ALTER TABLE reru_clients
  ALTER COLUMN address        DROP NOT NULL,
  ALTER COLUMN plan           DROP NOT NULL,
  ALTER COLUMN collection_day DROP NOT NULL;

-- Zone is fully replaced by location_id. The zone_enum type is left in place
-- (now unused) to avoid breaking any cached references; it can be dropped later.
ALTER TABLE reru_clients DROP COLUMN IF EXISTS zone;
