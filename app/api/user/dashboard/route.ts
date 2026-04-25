import { NextResponse } from 'next/server'
import { getCurrentClient } from '@/lib/auth/get-current-client'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import type { Client, Collection, Invoice } from '@/types'

type DashboardData = {
  client: Client
  next_collection: Collection | null
  recent_collections: Collection[]
  pending_invoice: Invoice | null
  overdue_invoice_count: number
}

export async function GET(): Promise<NextResponse<ApiResponse<DashboardData>>> {
  const current = await getCurrentClient()
  if (!current) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createSupabaseServerClient()

  const [
    { data: collections, error: collectionsError },
    { data: pendingInvoice, error: pendingError },
    { count: overdueCount, error: overdueError },
  ] = await Promise.all([
    supabase
      .from('reru_collections')
      .select('*')
      .eq('client_id', current.client.id)
      .order('scheduled_date', { ascending: false })
      .limit(5),
    supabase
      .from('reru_invoices')
      .select('*')
      .eq('client_id', current.client.id)
      .eq('status', 'pending')
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('reru_invoices')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', current.client.id)
      .eq('status', 'overdue'),
  ])

  if (collectionsError || pendingError || overdueError) {
    const err = collectionsError ?? pendingError ?? overdueError
    console.error('[GET /api/user/dashboard]', err)
    return NextResponse.json({ ok: false, error: 'Failed to fetch dashboard data' }, { status: 500 })
  }

  const typedCollections = (collections ?? []) as Collection[]
  const nextCollection = typedCollections.find(c => c.status === 'scheduled') ?? null

  return NextResponse.json({
    ok: true,
    data: {
      client: current.client,
      next_collection: nextCollection,
      recent_collections: typedCollections,
      pending_invoice: pendingInvoice as Invoice | null,
      overdue_invoice_count: overdueCount ?? 0,
    },
  })
}
