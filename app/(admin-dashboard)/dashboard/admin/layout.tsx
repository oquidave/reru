import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { AdminSidebar } from '@/components/admin/layout/admin-sidebar'
import { AdminMobileNav } from '@/components/admin/layout/admin-mobile-nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminUser = await getAdminUser()
  if (!adminUser) redirect('/auth/login')

  return (
    <div className="flex min-h-screen bg-reru-bg">
      <AdminSidebar profile={adminUser.profile} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminMobileNav profile={adminUser.profile} />
        <main className="flex-1 pt-14 md:pt-0">
          <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
