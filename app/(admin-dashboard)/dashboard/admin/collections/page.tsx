import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { format } from 'date-fns'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { AdminDatePicker } from '@/components/admin/collections/admin-date-picker'
import { AdminCollectionRow } from '@/components/admin/collections/admin-collection-row'
import { AdminBulkScheduleButton } from '@/components/admin/collections/admin-bulk-schedule-button'
import { AdminScheduleCollectionDialog, type SchedulableClient } from '@/components/admin/collections/admin-schedule-collection-dialog'
import type { ServiceLocation } from '@/types'

export const metadata = { title: 'Collections — RERU Admin' }

interface PageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function AdminCollectionsPage({ searchParams }: PageProps) {
  const adminUser = await getAdminUser()
  if (!adminUser) redirect('/dashboard')

  const { date: dateParam } = await searchParams
  const todayISO = format(new Date(), 'yyyy-MM-dd')
  const selectedDate = dateParam ?? todayISO

  const supabase = await createSupabaseServerClient()

  type CollectionWithClient = {
    id: string
    status: string
    notes: string | null
    bags_collected: number | null
    reru_clients: { id: string; name: string; address: string; phone: string; service_locations: { name: string } | null } | null
  }

  const [{ data: rows }, { data: locationRows }, { data: clientRows }] = await Promise.all([
    supabase
      .from('reru_collections')
      .select('id, status, notes, bags_collected, reru_clients(id, name, address, phone, service_locations(name))')
      .eq('scheduled_date', selectedDate)
      .order('status'),
    supabase.from('service_locations').select('name').eq('active', true).order('name'),
    supabase
      .from('reru_clients')
      .select('id, name, address, collection_day')
      .eq('status', 'active')
      .order('name'),
  ])

  const collections = (rows ?? []) as unknown as CollectionWithClient[]
  const locationNames = ((locationRows ?? []) as Pick<ServiceLocation, 'name'>[]).map((l) => l.name)
  const schedulableClients = (clientRows ?? []) as SchedulableClient[]

  const total     = collections.length
  const completed = collections.filter((c) => c.status === 'completed').length
  const missed    = collections.filter((c) => c.status === 'missed').length
  const scheduled = collections.filter((c) => c.status === 'scheduled').length
  const bagsToday = collections.reduce((sum, c) => sum + (c.bags_collected ?? 0), 0)

  // Group collections by location; include any locations that have collections plus an
  // "Unassigned" bucket for clients without a location set.
  const groupNames = [...locationNames, 'Unassigned']
  const byLocation = groupNames.map((location) => ({
    location,
    items: collections
      .filter((c) => (c.reru_clients?.service_locations?.name ?? 'Unassigned') === location)
      .map((c) => ({
        id:             c.id,
        status:         c.status,
        notes:          c.notes,
        bags_collected: c.bags_collected,
        client_name:    c.reru_clients?.name    ?? 'Unknown',
        client_address: c.reru_clients?.address ?? '',
        client_phone:   c.reru_clients?.phone   ?? '',
      })),
  }))

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <h1 className="reru-h1 text-reru-text-primary">Collections</h1>
        <div className="flex items-center gap-3">
          <Suspense>
            <AdminDatePicker currentDate={selectedDate} />
          </Suspense>
          <AdminBulkScheduleButton />
          <AdminScheduleCollectionDialog clients={schedulableClients} defaultDate={selectedDate} />
        </div>
      </div>

      {/* Summary strip */}
      <div className="flex flex-wrap gap-4 mb-8">
        {[
          { label: 'Total',     value: total,     color: 'text-reru-text-primary' },
          { label: 'Scheduled', value: scheduled, color: 'text-blue-600' },
          { label: 'Completed', value: completed, color: 'text-green-700' },
          { label: 'Missed',    value: missed,    color: 'text-reru-danger' },
          { label: 'Bags',      value: bagsToday, color: 'text-green-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-reru-border rounded-xl px-5 py-3 shadow-card flex items-center gap-3">
            <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
            <p className="reru-overline text-reru-text-muted">{label.toUpperCase()}</p>
          </div>
        ))}
      </div>

      {total === 0 ? (
        <div className="bg-white border border-reru-border rounded-xl shadow-card p-12 text-center">
          <p className="reru-card-title text-reru-text-primary mb-1">No collections scheduled</p>
          <p className="reru-body text-reru-text-secondary">
            No collection records for {selectedDate}. Use &quot;Schedule collection&quot; to add specific clients for this
            date, or &quot;Bulk schedule&quot; to generate the next 4 weeks from everyone&apos;s usual collection day.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {byLocation.map(({ location, items }) =>
            items.length === 0 ? null : (
              <div key={location} className="bg-white border border-reru-border rounded-xl shadow-card overflow-hidden">
                <div className="px-6 py-4 border-b border-reru-border flex items-center justify-between">
                  <h2 className="reru-card-title text-reru-text-primary">{location}</h2>
                  <span className="text-sm text-reru-text-muted">{items.length} collection{items.length !== 1 ? 's' : ''}</span>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-reru-border">
                      <th className="px-5 py-3 text-left reru-overline text-reru-text-muted">Client</th>
                      <th className="px-5 py-3 text-left reru-overline text-reru-text-muted">Phone</th>
                      <th className="px-5 py-3 text-left reru-overline text-reru-text-muted">Bags</th>
                      <th className="px-5 py-3 text-left reru-overline text-reru-text-muted">Notes</th>
                      <th className="px-5 py-3 text-left reru-overline text-reru-text-muted">Status</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <AdminCollectionRow key={item.id} collection={item} />
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
