-- Admin "Add client" (and onboarding) was failing with
-- "Failed to create client profile" whenever a plan other than the two legacy
-- values was chosen. Root cause: `plan` was rewired to reference the dynamic
-- pricing_tiers.slug set (monthly, annual, commercial_monthly, apartment_monthly,
-- apartment_annual, custom, …) but reru_clients.plan was still the old Postgres
-- enum plan_enum {monthly, annual}, so any newer slug was rejected by the DB.
--
-- collection_day has the same shape of bug: the UI/API now allow Saturday, but
-- collection_day was still day_enum {Monday..Friday}.
--
-- Convert both columns to text so they match the application model (see
-- `types/index.ts`: `export type Plan = string  // dynamic — matches pricing_tiers.slug`).

ALTER TABLE reru_clients ALTER COLUMN plan DROP DEFAULT;
ALTER TABLE reru_clients ALTER COLUMN plan TYPE text USING plan::text;
ALTER TABLE reru_clients ALTER COLUMN plan SET DEFAULT 'monthly';

ALTER TABLE reru_clients ALTER COLUMN collection_day DROP DEFAULT;
ALTER TABLE reru_clients ALTER COLUMN collection_day TYPE text USING collection_day::text;
ALTER TABLE reru_clients ALTER COLUMN collection_day SET DEFAULT 'Wednesday';

-- plan_enum / day_enum are now unused. Left in place (as zone_enum was) to avoid
-- breaking any cached references; they can be dropped in a later migration.
