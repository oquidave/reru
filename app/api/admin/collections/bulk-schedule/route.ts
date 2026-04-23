import { NextResponse } from 'next/server'
import { z } from 'zod'
import { addWeeks, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, format, isAfter, startOfDay } from 'date-fns'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { CollectionDay } from '@/types'

const bulkScheduleSchema = z.object({
  weeks_ahead: z.number().int().min(1).max(8).default(4),
})

function getNextOccurrence(day: CollectionDay, from: Date): Date {
  const fns: Record<CollectionDay, (d: Date) => Date> = {
    Monday:    nextMonday,
    Tuesday:   nextTuesday,
    Wednesday: nextWednesday,
    Thursday:  nextThursday,
    Friday:    nextFriday,
  }
  return fns[day](from)
}

export async function POST(req: Request) {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createSupabaseServerClient()

  const body = await req.json() as unknown
  const parsed = bulkScheduleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 })
  }

  const { weeks_ahead } = parsed.data

  const { data: clients, error: clientsError } = await supabase
    .from('reru_clients')
    .select('id, collection_day')
    .eq('status', 'active')

  if (clientsError || !clients) {
    console.error('[POST /api/admin/collections/bulk-schedule]', clientsError)
    return NextResponse.json({ ok: false, error: 'Failed to fetch clients' }, { status: 500 })
  }

  const today = startOfDay(new Date())
  const rows: { client_id: string; scheduled_date: string; status: string }[] = []

  for (const client of clients) {
    const day = client.collection_day as CollectionDay
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
    return NextResponse.json({ ok: true, data: { scheduled: 0 } })
  }

  const { error: insertError } = await supabase
    .from('reru_collections')
    .upsert(rows, { onConflict: 'client_id,scheduled_date', ignoreDuplicates: true })

  if (insertError) {
    console.error('[POST /api/admin/collections/bulk-schedule]', insertError)
    return NextResponse.json({ ok: false, error: 'Failed to schedule collections' }, { status: 500 })
  }

  await supabase.from('audit_logs').insert({
    admin_id:  adminUser.user.id,
    action:    'bulk_schedule_collections',
    entity:    'collection',
    entity_id: '00000000-0000-0000-0000-000000000000',
    new_value: { count: rows.length, weeks_ahead, client_count: clients.length },
  })

  return NextResponse.json({ ok: true, data: { scheduled: rows.length } })
}
