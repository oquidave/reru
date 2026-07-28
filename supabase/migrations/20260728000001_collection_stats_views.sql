-- Aggregate views powering the admin collection statistics page.
--
-- Both use security_invoker so RLS on reru_collections applies as the calling
-- user: admins see every collection, a client sees only their own. That keeps
-- the same views safe to reuse for a future client-facing "your bags" figure.
--
-- Aggregating in the database (rather than fetching rows and summing in the app)
-- keeps the payload bounded — one row per week, not one row per collection — and
-- avoids PostgREST's default 1000-row select cap as history accumulates.

create or replace view public.collection_weekly_stats
with (security_invoker = true) as
select
  date_trunc('week', c.scheduled_date)::date                              as week_start,
  count(*)::int                                                           as scheduled_total,
  count(*) filter (where c.status = 'completed')::int                     as completed,
  count(*) filter (where c.status = 'missed')::int                        as missed,
  coalesce(sum(c.bags_collected) filter (where c.status = 'completed'), 0)::int as bags,
  count(*) filter (where c.status = 'completed' and c.bags_collected is null)::int as completed_without_bags
from public.reru_collections c
group by 1;

comment on view public.collection_weekly_stats is
  'Per-ISO-week collection counts and bag totals. week_start is the Monday of the week.';

create or replace view public.collection_location_weekly_stats
with (security_invoker = true) as
select
  date_trunc('week', c.scheduled_date)::date                              as week_start,
  coalesce(l.name, 'Unassigned')                                          as location,
  count(*)::int                                                           as scheduled_total,
  count(*) filter (where c.status = 'completed')::int                     as completed,
  count(*) filter (where c.status = 'missed')::int                        as missed,
  coalesce(sum(c.bags_collected) filter (where c.status = 'completed'), 0)::int as bags
from public.reru_collections c
left join public.reru_clients cl on cl.id = c.client_id
left join public.service_locations l on l.id = cl.location_id
group by 1, 2;

comment on view public.collection_location_weekly_stats is
  'Per-week, per-service-location collection counts and bag totals.';

grant select on public.collection_weekly_stats to authenticated;
grant select on public.collection_location_weekly_stats to authenticated;
