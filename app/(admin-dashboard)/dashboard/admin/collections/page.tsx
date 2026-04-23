import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { format } from 'date-fns'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { AdminDatePicker } from '@/components/admin/collections/admin-date-picker'
import { AdminCollectionRow } from '@/components/admin/collections/admin-collection-row'
import { AdminBulkScheduleButton } from '@/components/admin/collections/admin-bulk-schedule-button'
import type { Zone } from '@/types'

export const metadata = { title: 'Collections — RERU Admin' }

const ZONES: Zone[] = ['Zone A', 'Zone B', 'Zone C']

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
    reru_clients: { id: string; name: string; address: string; phone: string; zone: string } | null
  }

  const { data: rows } = await supabase
    .from('reru_collections')
    .select('id, status, notes, reru_clients(id, name, address, phone, zone)')
    .eq('scheduled_date', selectedDate)
    .order('status')

  const collections = (rows ?? []) as unknown as CollectionWithClient[]

  const total     = collections.length
  const completed = collections.filter((c) => c.status === 'completed').length
  const missed    = collections.filter((c) => c.status === 'missed').length
  const scheduled = collections.filter((c) => c.status === 'scheduled').length

  const byZone = ZONES.map((zone) => ({
    zone,
    items: collections
      .filter((c) => c.reru_clients?.zone === zone)
      .map((c) => ({
        id:             c.id,
        status:         c.status,
        notes:          c.notes,
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
        </div>
      </div>

      {/* Summary strip */}
      <div className="flex flex-wrap gap-4 mb-8">
        {[
          { label: 'Total',     value: total,     color: 'text-reru-text-primary' },
          { label: 'Scheduled', value: scheduled, color: 'text-blue-600' },
          { label: 'Completed', value: completed, color: 'text-green-700' },
          { label: 'Missed',    value: missed,    color: 'text-reru-danger' },
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
          <p className="reru-body text-reru-text-secondary">No collection records for {selectedDate}. Use &quot;Bulk schedule&quot; to create them.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {byZone.map(({ zone, items }) =>
            items.length === 0 ? null : (
              <div key={zone} className="bg-white border border-reru-border rounded-xl shadow-card overflow-hidden">
                <div className="px-6 py-4 border-b border-reru-border flex items-center justify-between">
                  <h2 className="reru-card-title text-reru-text-primary">{zone}</h2>
                  <span className="text-sm text-reru-text-muted">{items.length} collection{items.length !== 1 ? 's' : ''}</span>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-reru-border">
                      <th className="px-5 py-3 text-left reru-overline text-reru-text-muted">Client</th>
                      <th className="px-5 py-3 text-left reru-overline text-reru-text-muted">Phone</th>
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
