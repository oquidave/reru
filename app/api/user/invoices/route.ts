import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentClient } from '@/lib/auth/get-current-client'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import type { Invoice } from '@/types'

const querySchema = z.object({
  status: z.enum(['pending', 'paid', 'overdue']).optional(),
})

export async function GET(request: Request): Promise<NextResponse<ApiResponse<Invoice[]>>> {
  const current = await getCurrentClient(request)
  if (!current) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid query' }, { status: 400 })
  }
  const { status } = parsed.data

  const supabase = await createSupabaseServerClient()
  let query = supabase
    .from('reru_invoices')
    .select('*')
    .eq('client_id', current.client.id)
    .order('date', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) {
    console.error('[GET /api/user/invoices]', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch invoices' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, data: (data ?? []) as Invoice[] })
}
