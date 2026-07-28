-- GPS coordinates for client households, used for route mapping.
--
-- Stored as plain numerics rather than PostGIS geography: the operation covers a
-- single estate, needs point display and simple bounds queries, and adding the
-- extension would be weight without a use for it. Revisit if routing/distance
-- work lands.

alter table public.reru_clients
  add column if not exists latitude              numeric(9, 6),
  add column if not exists longitude             numeric(9, 6),
  -- Reported accuracy in metres from the browser Geolocation API, so a pin
  -- captured indoors on a weak fix can be distinguished from a good one.
  add column if not exists location_accuracy_m   numeric(7, 1),
  add column if not exists location_captured_at  timestamptz;

-- Latitude and longitude are only meaningful together.
alter table public.reru_clients
  drop constraint if exists reru_clients_coords_paired;
alter table public.reru_clients
  add constraint reru_clients_coords_paired
  check ((latitude is null) = (longitude is null));

alter table public.reru_clients
  drop constraint if exists reru_clients_latitude_range;
alter table public.reru_clients
  add constraint reru_clients_latitude_range
  check (latitude is null or (latitude >= -90 and latitude <= 90));

alter table public.reru_clients
  drop constraint if exists reru_clients_longitude_range;
alter table public.reru_clients
  add constraint reru_clients_longitude_range
  check (longitude is null or (longitude >= -180 and longitude <= 180));

comment on column public.reru_clients.latitude is
  'WGS84 latitude of the household pickup point. Null until captured.';
comment on column public.reru_clients.longitude is
  'WGS84 longitude of the household pickup point. Null until captured.';
comment on column public.reru_clients.location_accuracy_m is
  'Accuracy radius in metres reported by the capturing device; null for manual entry.';

-- Partial index: map views only ever query the located subset.
create index if not exists reru_clients_located_idx
  on public.reru_clients (latitude, longitude)
  where latitude is not null;
