import { notFound, redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { InvoiceDetail } from '@/components/invoices/invoice-detail'
import { AdminMarkPaidDialog } from '@/components/admin/invoices/admin-mark-paid-dialog'
import type { Invoice, Client } from '@/types'

export const metadata = { title: 'Invoice — RERU Admin' }

/**
 * Staff-facing view of a single invoice, so a household that paid in cash can be
 * handed its receipt on the spot. Renders the same document the client sees —
 * minus the client's own payment action.
 */
export default async function AdminInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUser()
  if (!adminUser) redirect('/dashboard')

  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: invoice } = await supabase
    .from('reru_invoices')
    .select('*')
    .eq('id', id)
    .single()

  if (!invoice) notFound()

  const { data: client } = await supabase
    .from('reru_clients')
    .select('*, service_locations(name)')
    .eq('id', (invoice as Invoice).client_id)
    .single()

  if (!client) notFound()

  const { service_locations, ...clientRest } = client as typeof client & {
    service_locations: { name: string } | null
  }

  return (
    <InvoiceDetail
      invoice={invoice as Invoice}
      client={{ ...clientRest, location: service_locations?.name ?? null } as unknown as Client}
      viewer="admin"
      adminAction={<AdminMarkPaidDialog invoice={invoice as Invoice} />}
    />
  )
}
