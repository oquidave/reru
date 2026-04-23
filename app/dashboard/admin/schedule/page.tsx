import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { AdminCollectionRow } from '@/components/admin/collections/admin-collection-row'
import { AdminBulkScheduleButton } from '@/components/admin/collections/admin-bulk-schedule-button'
import type { Zone } from '@/types'

export const metadata = { title: "Today's Schedule — RERU Admin" }

const ZONES: Zone[] = ['Zone A', 'Zone B', 'Zone C']

export default async function AdminSchedulePage() {
  const adminUser = await getAdminUser()
  if (!adminUser) redirect('/dashboard')

  const supabase = await createSupabaseServerClient()
  const todayISO = format(new Date(), 'yyyy-MM-dd')

  type CollectionWithClient = {
    id: string
    status: string
    notes: string | null
    reru_clients: { id: string; name: string; address: string; phone: string; zone: string } | null
  }

  const { data: rows } = await supabase
    .from('reru_collections')
    .select('id, status, notes, reru_clients(id, name, address, phone, zone)')
    .eq('scheduled_date', todayISO)
    .order('status')

  const collections = (rows ?? []) as unknown as CollectionWithClient[]
  const total     = collections.length
  const completed = collections.filter((c) => c.status === 'completed').length
  const progress  = total > 0 ? Math.round((completed / total) * 100) : 0

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

  const dateDisplay = format(new Date(), 'EEEE, d MMM yyyy')

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="reru-h1 text-reru-text-primary">Today&apos;s Schedule</h1>
          <p className="reru-body text-reru-text-secondary mt-1">{dateDisplay}</p>
        </div>
        <AdminBulkScheduleButton />
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="bg-white border border-reru-border rounded-xl shadow-card p-5 mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-reru-text-primary">
              {completed} of {total} completed
            </p>
            <p className="text-sm font-bold text-green-700">{progress}%</p>
          </div>
          <div className="h-2.5 bg-green-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-700 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {total === 0 ? (
        <div className="bg-white border border-reru-border rounded-xl shadow-card p-12 text-center">
          <p className="reru-card-title text-reru-text-primary mb-1">No collections scheduled today</p>
          <p className="reru-body text-reru-text-secondary">Use &quot;Bulk schedule&quot; to create collection records.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {byZone.map(({ zone, items }) =>
            items.length === 0 ? null : (
              <div key={zone} className="bg-white border border-reru-border rounded-xl shadow-card overflow-hidden">
                <div className="px-6 py-4 border-b border-reru-border flex items-center justify-between">
                  <h2 className="reru-card-title text-reru-text-primary">{zone}</h2>
                  <span className="text-sm text-reru-text-muted">
                    {items.filter((i) => i.status === 'completed').length}/{items.length} done
                  </span>
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
