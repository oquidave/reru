import { NextResponse } from 'next/server'
import { z } from 'zod'
import { addWeeks, addDays, format, isAfter, startOfDay, getDay } from 'date-fns'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { COLLECTION_DAYS, type CollectionDay } from '@/types'

const bulkScheduleSchema = z.object({
  weeks_ahead: z.number().int().min(1).max(8).default(4),
})

/** date-fns day index (0 = Sunday) for each collection day. */
const DAY_INDEX: Record<CollectionDay, number> = {
  Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
}

function isCollectionDay(value: string | null): value is CollectionDay {
  return value !== null && (COLLECTION_DAYS as readonly string[]).includes(value)
}

/**
 * First occurrence of `day` on or after `from`. Driven off a day index rather
 * than date-fns' per-weekday helpers so a newly added collection day can never
 * fall through to an undefined lookup.
 */
function getNextOccurrence(day: CollectionDay, from: Date): Date {
  const offset = (DAY_INDEX[day] - getDay(from) + 7) % 7
  return addDays(from, offset)
}

export async function POST(req: Request) {
  const adminUser = await getAdminUser(req)
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as unknown
  const parsed = bulkScheduleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 })
  }

  const { weeks_ahead } = parsed.data

  const { data: clients, error: clientsError } = await adminUser.supabase
    .from('reru_clients')
    .select('id, collection_day')
    .eq('status', 'active')

  if (clientsError || !clients) {
    console.error('[POST /api/admin/collections/bulk-schedule]', clientsError)
    return NextResponse.json({ ok: false, error: 'Failed to fetch clients' }, { status: 500 })
  }

  const today = startOfDay(new Date())
  const rows: { client_id: string; scheduled_date: string; status: string }[] = []
  // Clients with a missing or unrecognised collection day are reported back to the
  // admin rather than failing the whole run.
  const skipped: string[] = []

  for (const client of clients) {
    const day = client.collection_day as string | null
    if (!isCollectionDay(day)) {
      skipped.push(client.id as string)
      continue
    }
    let next = getNextOccurrence(day, today)

    for (let w = 0; w < weeks_ahead; w++) {
      if (isAfter(next, today) || format(next, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
        rows.push({
          client_id:      client.id as string,
          scheduled_date: format(next, 'yyyy-MM-dd'),
          status:         'scheduled',
        })
      }
      next = addWeeks(next, 1)
    }
  }

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, data: { scheduled: 0, already_scheduled: 0, skipped_clients: skipped.length } })
  }

  // `ignoreDuplicates` means existing (client, date) pairs are left untouched, so the
  // returned rows are exactly the ones newly created — that is what we report.
  const { data: inserted, error: insertError } = await adminUser.supabase
    .from('reru_collections')
    .upsert(rows, { onConflict: 'client_id,scheduled_date', ignoreDuplicates: true })
    .select('id')

  if (insertError) {
    console.error('[POST /api/admin/collections/bulk-schedule]', insertError)
    return NextResponse.json({ ok: false, error: 'Failed to schedule collections' }, { status: 500 })
  }

  const created = inserted?.length ?? 0

  await adminUser.supabase.from('audit_logs').insert({
    admin_id:  adminUser.user.id,
    action:    'bulk_schedule_collections',
    entity:    'collection',
    entity_id: '00000000-0000-0000-0000-000000000000',
    new_value: { count: created, weeks_ahead, client_count: clients.length, skipped_clients: skipped.length },
  })

  return NextResponse.json({
    ok: true,
    data: {
      scheduled:         created,
      already_scheduled: rows.length - created,
      skipped_clients:   skipped.length,
    },
  })
}
