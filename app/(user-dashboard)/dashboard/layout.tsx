import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import type { Client } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: client, error: clientError } = await supabase
    .from('reru_clients')
    .select('*, service_locations(name)')
    .eq('user_id', user.id)
    .single()

  if (!client) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profile && ['admin', 'superadmin'].includes(profile.role as string)) {
      redirect('/dashboard/admin')
    }

    redirect('/auth/login')
  }

  const { service_locations, ...clientRest } = client as typeof client & { service_locations: { name: string } | null }
  const clientData = { ...clientRest, location: service_locations?.name ?? null } as unknown as Client

  return (
    <div className="flex min-h-screen bg-reru-bg">
      <AppSidebar client={clientData} />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav client={clientData} />
        <main className="flex-1 pt-14 md:pt-0">
          <div className="max-w-[900px] mx-auto px-4 md:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
