import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import type { Client } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''

  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Admin routes have their own layout — pass through without the client shell.
  // The admin layout (app/dashboard/admin/layout.tsx) handles auth and rendering.
  if (pathname.startsWith('/dashboard/admin')) {
    return <>{children}</>
  }

  const { data: client } = await supabase
    .from('reru_clients')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!client) {
    // Admin-only users have no client record — send them to the admin dashboard
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
