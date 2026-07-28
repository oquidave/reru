import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { MapPinOff } from 'lucide-react'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { AdminCollectionMap, type MappedClient } from '@/components/admin/map/admin-collection-map'

export const metadata = { title: 'Map — RERU Admin' }

interface PageProps {
  searchParams: Promise<{ date?: string }>
}

type ClientRow = {
  id: string
  name: string
  address: string | null
  collection_day: string | null
  latitude: number | null
  longitude: number | null
  service_locations: { name: string } | null
}

type CollectionRow = { client_id: string; status: string }

export default async function AdminMapPage({ searchParams }: PageProps) {
  const adminUser = await getAdminUser()
  if (!adminUser) redirect('/dashboard')

  const { date: dateParam } = await searchParams
  const todayISO = format(new Date(), 'yyyy-MM-dd')
  const selectedDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayISO

  const supabase = await createSupabaseServerClient()

  const [{ data: clientRows }, { data: collectionRows }, { count: totalClients }] = await Promise.all([
    supabase
      .from('reru_clients')
      .select('id, name, address, collection_day, latitude, longitude, service_locations(name)')
      .not('latitude', 'is', null)
      .neq('status', 'cancelled')
      .order('name'),
    supabase.from('reru_collections').select('client_id, status').eq('scheduled_date', selectedDate),
    supabase.from('reru_clients').select('*', { count: 'exact', head: true }).neq('status', 'cancelled'),
  ])

  const collections = (collectionRows ?? []) as CollectionRow[]
  const statusByClient = new Map(collections.map((c) => [c.client_id, c.status]))

  const clients: MappedClient[] = ((clientRows ?? []) as unknown as ClientRow[])
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => ({
      id:             c.id,
      name:           c.name,
      address:        c.address,
      location:       c.service_locations?.name ?? null,
      collection_day: c.collection_day,
      latitude:       Number(c.latitude),
      longitude:      Number(c.longitude),
      today_status:   (statusByClient.get(c.id) as MappedClient['today_status']) ?? null,
    }))

  const located = clients.length
  const missing = Math.max(0, (totalClients ?? 0) - located)
  const dateLabel = format(new Date(`${selectedDate}T00:00:00`), 'd MMM yyyy')

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="reru-h1 text-reru-text-primary">Map</h1>
          <p className="reru-body text-reru-text-secondary mt-1">
            {located} of {totalClients ?? 0} client{(totalClients ?? 0) === 1 ? '' : 's'} have a saved pickup location
          </p>
        </div>
      </div>

      {missing > 0 && (
        <div className="bg-orange-50 border border-reru-warning/30 rounded-xl p-4 mb-6 flex items-start gap-3">
          <MapPinOff size={18} strokeWidth={1.8} className="text-reru-warning flex-shrink-0 mt-0.5" />
          <p className="text-sm text-reru-text-secondary">
            <span className="font-semibold text-reru-text-primary">{missing}</span> client
            {missing === 1 ? ' has' : 's have'} no pickup location yet, so they are not on the map. Households can pin
            their own gate from their profile, or staff can set it on the{' '}
            <Link href="/dashboard/admin/clients" className="text-green-700 font-medium hover:underline">
              client
            </Link>{' '}
            record.
          </p>
        </div>
      )}

      <AdminCollectionMap clients={clients} dateLabel={dateLabel} />
    </div>
  )
}
