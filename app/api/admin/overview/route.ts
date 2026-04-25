import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import type { ApiResponse } from '@/types/api'

type OverviewData = {
  clients: {
    total: number
    active: number
    suspended: number
  }
  invoices: {
    paid: number
    pending: number
    overdue: number
  }
  collections: {
    today_total: number
    today_completed: number
    today_missed: number
  }
  recent_overdue: Array<{
    id: string
    date: string
    total: number
    client_name: string
    client_zone: string
  }>
}

export async function GET(request: Request): Promise<NextResponse<ApiResponse<OverviewData>>> {
  const adminUser = await getAdminUser(request)
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]

  const [
    { data: clientStats, error: clientsError },
    { data: invoiceStats, error: invoicesError },
    { data: todayCollections, error: collectionsError },
    { data: recentOverdue, error: overdueError },
  ] = await Promise.all([
    adminUser.supabase
      .from('reru_clients')
      .select('status'),
    adminUser.supabase
      .from('reru_invoices')
      .select('status'),
    adminUser.supabase
      .from('reru_collections')
      .select('status')
      .eq('scheduled_date', today),
    adminUser.supabase
      .from('reru_invoices')
      .select('id, date, total, reru_clients(name, zone)')
      .eq('status', 'overdue')
      .order('date', { ascending: true })
      .limit(5),
  ])

  if (clientsError || invoicesError || collectionsError || overdueError) {
    const err = clientsError ?? invoicesError ?? collectionsError ?? overdueError
    console.error('[GET /api/admin/overview]', err)
    return NextResponse.json({ ok: false, error: 'Failed to fetch overview' }, { status: 500 })
  }

  const clients = clientStats ?? []
  const invoices = invoiceStats ?? []
  const cols = todayCollections ?? []

  type OverdueRow = {
    id: string
    date: string
    total: number
    reru_clients: { name: string; zone: string } | null
  }

  return NextResponse.json({
    ok: true,
    data: {
      clients: {
        total:     clients.length,
        active:    clients.filter(c => c.status === 'active').length,
        suspended: clients.filter(c => c.status === 'suspended').length,
      },
      invoices: {
        paid:    invoices.filter(i => i.status === 'paid').length,
        pending: invoices.filter(i => i.status === 'pending').length,
        overdue: invoices.filter(i => i.status === 'overdue').length,
      },
      collections: {
        today_total:     cols.length,
        today_completed: cols.filter(c => c.status === 'completed').length,
        today_missed:    cols.filter(c => c.status === 'missed').length,
      },
      recent_overdue: (recentOverdue as unknown as OverdueRow[]).map(inv => ({
        id:          inv.id,
        date:        inv.date,
        total:       inv.total,
        client_name: inv.reru_clients?.name ?? '',
        client_zone: inv.reru_clients?.zone ?? '',
      })),
    },
  })
}
