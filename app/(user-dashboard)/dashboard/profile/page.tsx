import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile/profile-form'
import type { Client, ServiceLocation } from '@/types'

export const metadata = { title: 'Profile — RERU' }

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: clientRow }, { data: locationRows }] = await Promise.all([
    supabase.from('reru_clients').select('*, service_locations(name)').eq('user_id', user.id).maybeSingle(),
    supabase.from('service_locations').select('id, name, active, created_at').eq('active', true).order('name'),
  ])

  // Onboarding-incomplete clients are pushed to /onboarding by middleware.
  if (!clientRow) redirect('/onboarding')

  const { service_locations, ...rest } = clientRow as typeof clientRow & { service_locations: { name: string } | null }
  const client = { ...rest, location: service_locations?.name ?? null } as unknown as Client
  const locations = (locationRows ?? []) as ServiceLocation[]

  return (
    <div>
      <div className="mb-6">
        <h1 className="reru-h1 text-reru-text-primary">Profile</h1>
        <p className="reru-body text-reru-text-secondary mt-1">Update your details, contact, and sign-in.</p>
      </div>
      <ProfileForm client={client} locations={locations} currentEmail={user.email ?? ''} phone={client.phone} />
    </div>
  )
}
