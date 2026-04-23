import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { AdminInvoicesTable } from '@/components/admin/invoices/admin-invoices-table'
import { AdminGenerateInvoicesDialog } from '@/components/admin/invoices/admin-generate-invoices-dialog'
import { AdminExportCsvButton } from '@/components/admin/invoices/admin-export-csv-button'
import { formatUGX } from '@/lib/utils'
import type { Invoice, InvoiceStatus } from '@/types'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Invoices — RERU Admin' }

const FILTER_TABS = [
  { label: 'All',     value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Paid',    value: 'paid' },
]

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function AdminInvoicesPage({ searchParams }: PageProps) {
  const adminUser = await getAdminUser()
  if (!adminUser) redirect('/dashboard')

  const { status } = await searchParams
  const supabase = await createSupabaseServerClient()

  type InvoiceWithClient = Invoice & { reru_clients: { id: string; name: string; zone: string } | null }

  let query = supabase
    .from('reru_invoices')
    .select('*, reru_clients(id, name, zone)')
    .order('date', { ascending: false })

  if (status && ['pending', 'paid', 'overdue'].includes(status)) {
    query = (query as typeof query).eq('status', status)
  }

  const { data: rows } = await query
  const invoices = (rows ?? []) as InvoiceWithClient[]

  const invoicesForTable = invoices.map((inv) => ({
    ...inv,
    payment_method: inv.payment_method ?? null,
    payment_ref:    inv.payment_ref ?? null,
    client_name:    inv.reru_clients?.name ?? 'Unknown',
    client_id:      inv.reru_clients?.id ?? '',
    status:         inv.status as InvoiceStatus,
  }))

  const outstanding = invoices
    .filter((inv) => ['pending', 'overdue'].includes(inv.status as string))
    .reduce((sum, inv) => sum + (inv.total as number), 0)

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="reru-h1 text-reru-text-primary">Invoices</h1>
          {outstanding > 0 && (
            <p className="reru-body text-reru-text-secondary mt-1">
              {formatUGX(outstanding)} outstanding
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <AdminExportCsvButton statusFilter={status} />
          <AdminGenerateInvoicesDialog />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-reru-border">
        {FILTER_TABS.map((tab) => {
          const href = tab.value
            ? `/dashboard/admin/invoices?status=${tab.value}`
            : '/dashboard/admin/invoices'
          const isActive = (status ?? '') === tab.value
          return (
            <Link
              key={tab.value}
              href={href}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors duration-150',
                isActive
                  ? 'border-green-700 text-green-700'
                  : 'border-transparent text-reru-text-secondary hover:text-reru-text-primary'
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      <AdminInvoicesTable invoices={invoicesForTable} />
    </div>
  )
}
