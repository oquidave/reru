import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarCheck, FileText, AlertTriangle } from 'lucide-react'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { AdminStatsGrid } from '@/components/admin/stats-grid'
import { AdminOverdueTable } from '@/components/admin/overview/admin-overdue-table'
import { formatDate } from '@/lib/utils'
import type { Invoice } from '@/types'

export const metadata = { title: 'Admin Overview — RERU' }

export default async function AdminOverviewPage() {
  const adminUser = await getAdminUser()
  if (!adminUser) redirect('/dashboard')

  const supabase = await createSupabaseServerClient()
  const todayISO = new Date().toISOString().split('T')[0]!

  const [
    { count: totalClients },
    { count: activeClients },
    { count: suspendedClients },
    { count: paidInvoices },
    { count: pendingInvoices },
    { count: overdueInvoices },
    { count: collectionsToday },
    { count: completedToday },
    { data: overdueRows },
  ] = await Promise.all([
    supabase.from('reru_clients').select('*', { count: 'exact', head: true }),
    supabase.from('reru_clients').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('reru_clients').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
    supabase.from('reru_invoices').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
    supabase.from('reru_invoices').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('reru_invoices').select('*', { count: 'exact', head: true }).eq('status', 'overdue'),
    supabase.from('reru_collections').select('*', { count: 'exact', head: true }).eq('scheduled_date', todayISO),
    supabase.from('reru_collections').select('*', { count: 'exact', head: true }).eq('scheduled_date', todayISO).eq('status', 'completed'),
    supabase
      .from('reru_invoices')
      .select('*, reru_clients(id, name)')
      .eq('status', 'overdue')
      .order('date', { ascending: true })
      .limit(10),
  ])

  type OverdueRow = Invoice & { reru_clients: { id: string; name: string } | null }
  const overdueInvoiceRows = (overdueRows ?? []) as OverdueRow[]
  const overdueForTable = overdueInvoiceRows.map((inv) => ({
    ...inv,
    client_name: inv.reru_clients?.name ?? 'Unknown',
    client_id:   inv.reru_clients?.id ?? '',
  }))

  const adminName = adminUser.profile.full_name
    ? adminUser.profile.full_name.split(' ')[0]
    : 'Admin'

  return (
    <div>
      <div className="mb-8">
        <h1 className="reru-h1 text-reru-text-primary">
          Welcome, {adminName}
        </h1>
        <p className="reru-body text-reru-text-secondary mt-1">
          {formatDate(todayISO)} — operations overview
        </p>
      </div>

      <AdminStatsGrid
        totalClients={totalClients ?? 0}
        activeClients={activeClients ?? 0}
        suspendedClients={suspendedClients ?? 0}
        paidInvoices={paidInvoices ?? 0}
        pendingInvoices={pendingInvoices ?? 0}
        overdueInvoices={overdueInvoices ?? 0}
        collectionsToday={collectionsToday ?? 0}
        completedToday={completedToday ?? 0}
      />

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link
          href="/dashboard/admin/schedule"
          className="bg-white border border-reru-border rounded-xl p-5 shadow-card hover:shadow-card-hover hover:border-green-200 transition-all duration-150 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <CalendarCheck size={18} strokeWidth={1.8} className="text-green-700" />
          </div>
          <div>
            <p className="text-md font-semibold text-reru-text-primary">Today&apos;s schedule</p>
            <p className="text-sm text-reru-text-secondary">{completedToday ?? 0} of {collectionsToday ?? 0} completed</p>
          </div>
        </Link>

        <Link
          href="/dashboard/admin/invoices?status=overdue"
          className="bg-white border border-reru-border rounded-xl p-5 shadow-card hover:shadow-card-hover hover:border-green-200 transition-all duration-150 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} strokeWidth={1.8} className="text-reru-danger" />
          </div>
          <div>
            <p className="text-md font-semibold text-reru-text-primary">Overdue accounts</p>
            <p className="text-sm text-reru-text-secondary">{overdueInvoices ?? 0} invoices overdue</p>
          </div>
        </Link>

        <Link
          href="/dashboard/admin/invoices"
          className="bg-white border border-reru-border rounded-xl p-5 shadow-card hover:shadow-card-hover hover:border-green-200 transition-all duration-150 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
            <FileText size={18} strokeWidth={1.8} className="text-reru-warning" />
          </div>
          <div>
            <p className="text-md font-semibold text-reru-text-primary">Pending invoices</p>
            <p className="text-sm text-reru-text-secondary">{pendingInvoices ?? 0} awaiting payment</p>
          </div>
        </Link>
      </div>

      <AdminOverdueTable invoices={overdueForTable} />
    </div>
  )
}
