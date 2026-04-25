import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import type { ApiResponse } from '@/types/api'

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  zone: z.enum(['Zone A', 'Zone B', 'Zone C']).optional(),
})

type ScheduleEntry = {
  id: string
  client_id: string
  scheduled_date: string
  status: string
  bags_collected: number | null
  notes: string | null
  completed_at: string | null
  reru_clients: { name: string; zone: string; address: string; phone: string } | null
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
  const zone = parsed.data.zone

  let query = adminUser.supabase
    .from('reru_collections')
    .select('id, client_id, scheduled_date, status, bags_collected, notes, completed_at, reru_clients(name, zone, address, phone)')
    .eq('scheduled_date', targetDate)
    .order('reru_clients(zone)', { ascending: true })

  if (zone) query = query.eq('reru_clients.zone', zone)

  const { data, error } = await query

  if (error) {
    console.error('[GET /api/admin/schedule]', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch schedule' }, { status: 500 })
  }

  const entries = (data ?? []) as unknown as ScheduleEntry[]

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
