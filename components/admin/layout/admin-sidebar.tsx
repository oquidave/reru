'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Truck, FileText, CalendarCheck, LogOut } from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Profile } from '@/types'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard/admin',             label: 'Overview',    icon: LayoutDashboard, exact: true },
  { href: '/dashboard/admin/clients',     label: 'Clients',     icon: Users,           exact: false },
  { href: '/dashboard/admin/collections', label: 'Collections', icon: Truck,           exact: false },
  { href: '/dashboard/admin/invoices',    label: 'Invoices',    icon: FileText,        exact: false },
  { href: '/dashboard/admin/schedule',    label: 'Today',       icon: CalendarCheck,   exact: false },
]

interface AdminSidebarProps {
  profile: Profile
}

export function AdminSidebar({ profile }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/home')
    toast.success('Signed out successfully')
  }

  const initials = profile.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AD'

  return (
    <aside className="hidden md:flex flex-col w-[220px] min-h-screen bg-green-900 text-white">
      <div className="px-5 py-6 border-b border-white/10">
        <Logo size="md" white />
        <p className="mt-2 text-xs font-semibold text-white/40 uppercase tracking-widest">Admin</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-medium transition-all duration-150',
                isActive
                  ? 'bg-white/12 text-white'
                  : 'text-white/55 hover:bg-white/8 hover:text-white/80'
              )}
            >
              <Icon
                size={17}
                strokeWidth={isActive ? 2 : 1.8}
                className={isActive ? 'text-white' : 'text-white/50'}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pb-5 space-y-2">
        <div className="flex items-center gap-3 px-3 py-3 rounded-md bg-white/6">
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {profile.full_name || 'Admin'}
            </p>
            <p className="text-xs text-white/50 capitalize truncate">{profile.role}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-base font-medium text-white/55 hover:text-white hover:bg-white/8 transition-all duration-150"
        >
          <LogOut size={17} strokeWidth={1.8} className="text-white/50" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
