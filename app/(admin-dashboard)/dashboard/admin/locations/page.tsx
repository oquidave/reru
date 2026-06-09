import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { AdminLocationsTable } from '@/components/admin/locations/admin-locations-table'
import { AdminAddLocationDialog } from '@/components/admin/locations/admin-add-location-dialog'
import type { ServiceLocation } from '@/types'

export const metadata = { title: 'Locations — RERU Admin' }

export default async function AdminLocationsPage() {
  const adminUser = await getAdminUser()
  if (!adminUser) redirect('/dashboard')

  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('service_locations')
    .select('id, name, active, created_at')
    .order('name', { ascending: true })

  const locations = (data ?? []) as ServiceLocation[]
  const activeCount = locations.filter((l) => l.active).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="reru-h1 text-reru-text-primary">Service locations</h1>
          <p className="reru-body text-reru-text-secondary mt-1">
            {activeCount} active · {locations.length} total
          </p>
        </div>
        <AdminAddLocationDialog />
      </div>

      <AdminLocationsTable locations={locations} />
    </div>
  )
}
