import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import type { ApiResponse } from '@/types/api'

const querySchema = z.object({
  date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  status: z.enum(['scheduled', 'completed', 'missed']).optional(),
  zone:   z.enum(['Zone A', 'Zone B', 'Zone C']).optional(),
  limit:  z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

type CollectionWithClient = {
  id: string
  client_id: string
  scheduled_date: string
  status: string
  bags_collected: number | null
  notes: string | null
  completed_at: string | null
  reru_clients: { name: string; zone: string; address: string } | null
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

  const { date, status, zone, limit, offset } = parsed.data

  let query = adminUser.supabase
    .from('reru_collections')
    .select('id, client_id, scheduled_date, status, bags_collected, notes, completed_at, reru_clients(name, zone, address)', { count: 'exact' })
    .order('scheduled_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (date)   query = query.eq('scheduled_date', date)
  if (status) query = query.eq('status', status)
  if (zone)   query = query.eq('reru_clients.zone', zone)

  const { data, count, error } = await query

  if (error) {
    console.error('[GET /api/admin/collections]', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch collections' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    data: { data: (data ?? []) as unknown as CollectionWithClient[], total: count ?? 0 },
  })
}
