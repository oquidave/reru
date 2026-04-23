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
    .select('*')
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

  return (
    <div className="flex min-h-screen bg-reru-bg">
      <AppSidebar client={client as Client} />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav client={client as Client} />
        <main className="flex-1 pt-14 md:pt-0">
          <div className="max-w-[900px] mx-auto px-4 md:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
