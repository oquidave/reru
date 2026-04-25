import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentClient } from '@/lib/auth/get-current-client'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import type { Collection } from '@/types'

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(10).default(1),
})

export async function GET(request: Request): Promise<NextResponse<ApiResponse<Collection[]>>> {
  const current = await getCurrentClient()
  if (!current) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid query' }, { status: 400 })
  }
  const { limit } = parsed.data

  const today = new Date().toISOString().split('T')[0]
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('reru_collections')
    .select('*')
    .eq('client_id', current.client.id)
    .eq('status', 'scheduled')
    .gte('scheduled_date', today)
    .order('scheduled_date', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('[GET /api/user/collections/upcoming]', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch upcoming collections' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, data: (data ?? []) as Collection[] })
}
