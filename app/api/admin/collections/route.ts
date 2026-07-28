import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import type { ApiResponse } from '@/types/api'

const querySchema = z.object({
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  status:      z.enum(['scheduled', 'completed', 'missed']).optional(),
  location_id: z.string().uuid().optional(),
  limit:       z.coerce.number().int().min(1).max(100).default(50),
  offset:      z.coerce.number().int().min(0).default(0),
})

type CollectionWithClient = {
  id: string
  client_id: string
  scheduled_date: string
  status: string
  bags_collected: number | null
  notes: string | null
  completed_at: string | null
  reru_clients: { name: string; location: string | null; address: string } | null
}

type CollectionsData = { data: CollectionWithClient[]; total: number }

export async function GET(request: Request): Promise<NextResponse<ApiResponse<CollectionsData>>> {
  const adminUser = await getAdminUser(request)
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid query' },
      { status: 400 }
    )
  }

  const { date, status, location_id, limit, offset } = parsed.data

  let query = adminUser.supabase
    .from('reru_collections')
    .select('id, client_id, scheduled_date, status, bags_collected, notes, completed_at, reru_clients(name, address, service_locations(name))', { count: 'exact' })
    .order('scheduled_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (date)        query = query.eq('scheduled_date', date)
  if (status)      query = query.eq('status', status)
  if (location_id) query = query.eq('reru_clients.location_id', location_id)

  const { data, count, error } = await query

  if (error) {
    console.error('[GET /api/admin/collections]', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch collections' }, { status: 500 })
  }

  type Row = Omit<CollectionWithClient, 'reru_clients'> & {
    reru_clients: { name: string; address: string; service_locations: { name: string } | null } | null
  }
  const rows = ((data ?? []) as unknown as Row[]).map((r) => ({
    ...r,
    reru_clients: r.reru_clients
      ? { name: r.reru_clients.name, address: r.reru_clients.address, location: r.reru_clients.service_locations?.name ?? null }
      : null,
  }))

  return NextResponse.json({
    ok: true,
    data: { data: rows, total: count ?? 0 },
  })
}

const createSchema = z.object({
  client_ids:     z.array(z.string().uuid()).min(1, 'Select at least one client').max(200),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  notes:          z.string().max(1000).optional(),
})

type CreatedData = { scheduled: number; already_scheduled: number }

/** Schedules a one-off collection for one or more clients on a specific date. */
export async function POST(request: Request): Promise<NextResponse<ApiResponse<CreatedData>>> {
  const adminUser = await getAdminUser(request)
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as unknown
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid request body' },
      { status: 400 }
    )
  }

  const { client_ids, scheduled_date, notes } = parsed.data

  // Reject ids that are not real clients rather than relying on the FK error.
  const { data: existing, error: clientsError } = await adminUser.supabase
    .from('reru_clients')
    .select('id')
    .in('id', client_ids)

  if (clientsError) {
    console.error('[POST /api/admin/collections]', clientsError)
    return NextResponse.json({ ok: false, error: 'Failed to verify clients' }, { status: 500 })
  }
  if ((existing?.length ?? 0) !== client_ids.length) {
    return NextResponse.json({ ok: false, error: 'One or more clients were not found' }, { status: 400 })
  }

  const rows = client_ids.map((client_id) => ({
    client_id,
    scheduled_date,
    status: 'scheduled',
    ...(notes ? { notes } : {}),
  }))

  const { data: inserted, error } = await adminUser.supabase
    .from('reru_collections')
    .upsert(rows, { onConflict: 'client_id,scheduled_date', ignoreDuplicates: true })
    .select('id')

  if (error) {
    console.error('[POST /api/admin/collections]', error)
    return NextResponse.json({ ok: false, error: 'Failed to schedule collections' }, { status: 500 })
  }

  const created = inserted?.length ?? 0

  await adminUser.supabase.from('audit_logs').insert({
    admin_id:  adminUser.user.id,
    action:    'schedule_collection',
    entity:    'collection',
    entity_id: inserted?.[0]?.id ?? '00000000-0000-0000-0000-000000000000',
    new_value: { scheduled_date, client_count: client_ids.length, created },
  })

  return NextResponse.json({
    ok: true,
    data: { scheduled: created, already_scheduled: rows.length - created },
  })
}
