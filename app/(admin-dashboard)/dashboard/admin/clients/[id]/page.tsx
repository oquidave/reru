import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/shared/status-badge'
import { AdminEditClientDialog } from '@/components/admin/clients/admin-edit-client-dialog'
import { AdminSuspendDialog } from '@/components/admin/clients/admin-suspend-dialog'
import { AdminClientInvoicesTable } from '@/components/admin/clients/admin-client-invoices-table'
import { AdminClientCollectionsTable } from '@/components/admin/clients/admin-client-collections-table'
import { formatDate } from '@/lib/utils'
import type { Client, Invoice, Collection } from '@/types'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('reru_clients').select('name').eq('id', id).single()
  return { title: data ? `${data.name} — RERU Admin` : 'Client — RERU Admin' }
}

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const adminUser = await getAdminUser()
  if (!adminUser) redirect('/dashboard')

  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const [{ data: clientRow }, { data: invoiceRows }, { data: collectionRows }] = await Promise.all([
    supabase.from('reru_clients').select('*').eq('id', id).single(),
    supabase.from('reru_invoices').select('*').eq('client_id', id).order('date', { ascending: false }),
    supabase.from('reru_collections').select('*').eq('client_id', id).order('scheduled_date', { ascending: false }),
  ])

  if (!clientRow) notFound()

  const client   = clientRow   as Client
  const invoices = (invoiceRows   ?? []) as Invoice[]
  const collections = (collectionRows ?? []) as Collection[]

  return (
    <div>
      <Link
        href="/dashboard/admin/clients"
        className="inline-flex items-center gap-1 text-sm font-medium text-reru-text-secondary hover:text-reru-text-primary transition-colors mb-6"
      >
        <ChevronLeft size={15} /> All clients
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="reru-h1 text-reru-text-primary">{client.name}</h1>
            <StatusBadge status={client.status} />
          </div>
          <p className="reru-body text-reru-text-secondary">{client.phone}</p>
        </div>
        <div className="flex items-center gap-2">
          <AdminEditClientDialog client={client} />
          <AdminSuspendDialog client={client} />
        </div>
      </div>

      {/* Info card */}
      <div className="bg-white border border-reru-border rounded-xl shadow-card p-6 mb-8">
        <h2 className="reru-card-title text-reru-text-primary mb-4">Account details</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          {[
            { label: 'Address',        value: client.address },
            { label: 'Zone',           value: client.zone },
            { label: 'Collection day', value: client.collection_day },
            { label: 'Plan',           value: client.plan.charAt(0).toUpperCase() + client.plan.slice(1) },
            { label: 'Paid through',   value: client.paid_through ? formatDate(client.paid_through) : 'Not paid' },
            { label: 'Member since',   value: formatDate(client.created_at) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="reru-overline text-reru-text-muted mb-0.5">{label.toUpperCase()}</p>
              <p className="text-md font-semibold text-reru-text-primary">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Invoices */}
      <div className="mb-8">
        <h2 className="reru-h2 text-reru-text-primary mb-4">Invoices</h2>
        <AdminClientInvoicesTable invoices={invoices} clientId={client.id} />
      </div>

      {/* Collections */}
      <div>
        <h2 className="reru-h2 text-reru-text-primary mb-4">Collection history</h2>
        <AdminClientCollectionsTable collections={collections} />
      </div>
    </div>
  )
}
