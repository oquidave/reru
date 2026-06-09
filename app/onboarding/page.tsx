import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { OnboardingForm } from '@/components/onboarding/onboarding-form'
import type { ServiceLocation } from '@/types'

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Already onboarded → straight to the dashboard.
  const { data: existing } = await supabase
    .from('reru_clients')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (existing) redirect('/dashboard')

  const { data: locations } = await supabase
    .from('service_locations')
    .select('id, name, active, created_at')
    .eq('active', true)
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-reru-bg flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <OnboardingForm locations={(locations ?? []) as ServiceLocation[]} />
      </div>
    </div>
  )
}
