import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentClient } from '@/lib/auth/get-current-client'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import type { Collection } from '@/types'

const querySchema = z.object({
  status: z.enum(['scheduled', 'completed', 'missed']).optional(),
  limit:  z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

type CollectionsData = { data: Collection[]; total: number }

export async function GET(request: Request): Promise<NextResponse<ApiResponse<CollectionsData>>> {
  const current = await getCurrentClient()
  if (!current) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid query' }, { status: 400 })
  }
  const { status, limit, offset } = parsed.data

  const supabase = await createSupabaseServerClient()
  let query = supabase
    .from('reru_collections')
    .select('*', { count: 'exact' })
    .eq('client_id', current.client.id)
    .order('scheduled_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)

  const { data, count, error } = await query

  if (error) {
    console.error('[GET /api/user/collections]', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch collections' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, data: { data: (data ?? []) as Collection[], total: count ?? 0 } })
}
