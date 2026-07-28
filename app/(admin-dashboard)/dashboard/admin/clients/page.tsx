import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { AdminClientFilters } from '@/components/admin/clients/admin-client-filters'
import { AdminClientsTable } from '@/components/admin/clients/admin-clients-table'
import { AdminAddClientDialog } from '@/components/admin/clients/admin-add-client-dialog'
import type { Client, Plan, ClientStatus, ServiceLocation } from '@/types'

export const metadata = { title: 'Clients — RERU Admin' }

interface PageProps {
  searchParams: Promise<{ q?: string; location_id?: string; plan?: string; status?: string }>
}

export default async function AdminClientsPage({ searchParams }: PageProps) {
  const adminUser = await getAdminUser()
  if (!adminUser) redirect('/dashboard')

  const { q, location_id, plan, status } = await searchParams
  const supabase = await createSupabaseServerClient()

  type ClientRow = {
    id: string; user_id: string; name: string; phone: string; address: string | null
    location_id: string | null; other_location: string | null
    collection_day: string | null; plan: string | null; custom_price: number | null; status: string
    paid_through: string | null; created_at: string
    landmark: string | null; property_type: string | null; bin_count: number | null
    alt_phone: string | null; alt_phone_is_whatsapp: boolean
    service_locations: { name: string } | null
  }

  let query = supabase
    .from('reru_clients')
    .select('*, service_locations(name)')
    .order('created_at', { ascending: false })

  if (q)           query = (query as typeof query).ilike('name', `%${q}%`)
  if (location_id) query = (query as typeof query).eq('location_id', location_id)
  if (plan)        query = (query as typeof query).eq('plan', plan)
  if (status)      query = (query as typeof query).eq('status', status)

  const { data: clients } = await query

  // Active locations power the filter dropdown.
  const { data: locationRows } = await supabase
    .from('service_locations')
    .select('id, name, active, created_at')
    .eq('active', true)
    .order('name')
  const locations = (locationRows ?? []) as ServiceLocation[]

  const typed = (clients ?? []) as ClientRow[]
  const typedClients: Client[] = typed.map((c) => {
    const { service_locations, ...rest } = c
    return {
      ...rest,
      location:       service_locations?.name ?? null,
      collection_day: rest.collection_day as Client['collection_day'],
      plan:           rest.plan as Plan | null,
      status:         rest.status as ClientStatus,
      property_type:  rest.property_type as Client['property_type'],
    }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="reru-h1 text-reru-text-primary">Clients</h1>
          <p className="reru-body text-reru-text-secondary mt-1">{typedClients.length} client{typedClients.length !== 1 ? 's' : ''}</p>
        </div>
        <AdminAddClientDialog />
      </div>

      <Suspense>
        <AdminClientFilters locations={locations} />
      </Suspense>

      <AdminClientsTable clients={typedClients} />
    </div>
  )
}
