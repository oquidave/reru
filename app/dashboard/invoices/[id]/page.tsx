import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { InvoiceDetail } from '@/components/invoices/invoice-detail'
import type { Invoice, Client } from '@/types'

export const metadata = { title: 'Invoice — RERU' }

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: client } = await supabase
    .from('reru_clients')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!client) redirect('/auth/login')

  const { data: invoice } = await supabase
    .from('reru_invoices')
    .select('*')
    .eq('id', id)
    .eq('client_id', client.id)
    .single()

  if (!invoice) notFound()

  return <InvoiceDetail invoice={invoice as Invoice} client={client as Client} />
}
