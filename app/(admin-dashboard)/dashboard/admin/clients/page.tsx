import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { AdminClientFilters } from '@/components/admin/clients/admin-client-filters'
import { AdminClientsTable } from '@/components/admin/clients/admin-clients-table'
import type { Client, Zone, Plan, ClientStatus } from '@/types'

export const metadata = { title: 'Clients — RERU Admin' }

interface PageProps {
  searchParams: Promise<{ q?: string; zone?: string; plan?: string; status?: string }>
}

export default async function AdminClientsPage({ searchParams }: PageProps) {
  const adminUser = await getAdminUser()
  if (!adminUser) redirect('/dashboard')

  const { q, zone, plan, status } = await searchParams
  const supabase = await createSupabaseServerClient()

  type ClientRow = {
    id: string; user_id: string; name: string; phone: string; address: string
    zone: string; collection_day: string; plan: string; status: string
    paid_through: string | null; created_at: string
  }

  let query = supabase
    .from('reru_clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (q)      query = (query as typeof query).ilike('name', `%${q}%`)
  if (zone)   query = (query as typeof query).eq('zone', zone)
  if (plan)   query = (query as typeof query).eq('plan', plan)
  if (status) query = (query as typeof query).eq('status', status)

  const { data: clients } = await query

  const typed = (clients ?? []) as ClientRow[]
  const typedClients: Client[] = typed.map((c) => ({
    ...c,
    zone:           c.zone as Zone,
    collection_day: c.collection_day as Client['collection_day'],
    plan:           c.plan as Plan,
    status:         c.status as ClientStatus,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="reru-h1 text-reru-text-primary">Clients</h1>
          <p className="reru-body text-reru-text-secondary mt-1">{typedClients.length} client{typedClients.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <Suspense>
        <AdminClientFilters />
      </Suspense>

      <AdminClientsTable clients={typedClients} />
    </div>
  )
}
