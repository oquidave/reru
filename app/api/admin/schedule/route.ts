import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import type { ApiResponse } from '@/types/api'

const querySchema = z.object({
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  location_id: z.string().uuid().optional(),
})

type ScheduleEntry = {
  id: string
  client_id: string
  scheduled_date: string
  status: string
  bags_collected: number | null
  notes: string | null
  completed_at: string | null
  reru_clients: { name: string; location: string | null; address: string; phone: string } | null
}

type ScheduleData = {
  date: string
  total: number
  completed: number
  missed: number
  pending: number
  entries: ScheduleEntry[]
}

export async function GET(request: Request): Promise<NextResponse<ApiResponse<ScheduleData>>> {
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

  const targetDate = parsed.data.date ?? new Date().toISOString().split('T')[0]
  const locationId = parsed.data.location_id

  let query = adminUser.supabase
    .from('reru_collections')
    .select('id, client_id, scheduled_date, status, bags_collected, notes, completed_at, reru_clients(name, address, phone, service_locations(name))')
    .eq('scheduled_date', targetDate)
    .order('reru_clients(name)', { ascending: true })

  if (locationId) query = query.eq('reru_clients.location_id', locationId)

  const { data, error } = await query

  if (error) {
    console.error('[GET /api/admin/schedule]', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch schedule' }, { status: 500 })
  }

  type Row = Omit<ScheduleEntry, 'reru_clients'> & {
    reru_clients: { name: string; address: string; phone: string; service_locations: { name: string } | null } | null
  }
  const entries: ScheduleEntry[] = ((data ?? []) as unknown as Row[]).map((r) => ({
    ...r,
    reru_clients: r.reru_clients
      ? {
          name: r.reru_clients.name,
          address: r.reru_clients.address,
          phone: r.reru_clients.phone,
          location: r.reru_clients.service_locations?.name ?? null,
        }
      : null,
  }))

  return NextResponse.json({
    ok: true,
    data: {
      date:      targetDate,
      total:     entries.length,
      completed: entries.filter(e => e.status === 'completed').length,
      missed:    entries.filter(e => e.status === 'missed').length,
      pending:   entries.filter(e => e.status === 'scheduled').length,
      entries,
    },
  })
}
