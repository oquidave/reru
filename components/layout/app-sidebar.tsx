'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Truck, FileText, ScrollText, LogOut } from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Client } from '@/types'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',             label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/dashboard/collections', label: 'Collections', icon: Truck },
  { href: '/dashboard/invoices',    label: 'Invoices',   icon: FileText },
  { href: '/dashboard/agreement',   label: 'Agreement',  icon: ScrollText },
]

interface AppSidebarProps {
  client: Client
}

export function AppSidebar({ client }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/home')
    toast.success('Signed out successfully')
  }

  const initials = client.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <aside className="hidden md:flex flex-col w-[220px] min-h-screen bg-green-900 text-white">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <Logo size="md" white />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(href)
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

      {/* User card + sign out */}
      <div className="px-3 pb-5 space-y-2">
        <div className="flex items-center gap-3 px-3 py-3 rounded-md bg-white/6">
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{client.name}</p>
            <p className="text-xs text-white/50 truncate">{client.zone}</p>
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
