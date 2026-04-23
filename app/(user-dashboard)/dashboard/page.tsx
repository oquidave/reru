import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextCollectionCard } from '@/components/dashboard/next-collection-card'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentCollections } from '@/components/dashboard/recent-collections'
import Link from 'next/link'
import { FileText, ScrollText, Bell } from 'lucide-react'
import { formatDate, formatUGX } from '@/lib/utils'
import type { Client, Collection } from '@/types'

export const metadata = { title: 'Dashboard — RERU' }

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: client }, { data: collections }, { data: pendingInvoice }] = await Promise.all([
    supabase.from('reru_clients').select('*').eq('user_id', user.id).single(),
    supabase
      .from('reru_collections')
      .select('*')
      .eq('client_id', (await supabase.from('reru_clients').select('id').eq('user_id', user.id).single()).data?.id ?? '')
      .order('scheduled_date', { ascending: false })
      .limit(5),
    supabase
      .from('reru_invoices')
      .select('*')
      .eq('status', 'pending')
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  if (!client) redirect('/auth/login')

  const typedClient = client as Client
  const typedCollections = (collections ?? []) as Collection[]

  const firstName = typedClient.name.split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const nextCollection = typedCollections.find(c => c.status === 'scheduled') ?? null

  return (
    <div>
      <h1 className="reru-h1 text-reru-text-primary mb-2">
        {greeting}, {firstName} 👋
      </h1>
      <p className="reru-body text-reru-text-secondary mb-8">
        Here&apos;s your waste collection summary.
      </p>

      <NextCollectionCard nextCollection={nextCollection} />
      <StatsCards client={typedClient} />
      <RecentCollections collections={typedCollections} />

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/dashboard/invoices"
          className="flex items-center gap-4 bg-white border border-reru-border rounded-xl p-5 shadow-card hover:border-green-200 hover:shadow-card-hover transition-all duration-150"
        >
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <FileText size={18} strokeWidth={1.8} className="text-green-600" />
          </div>
          <div>
            <p className="reru-card-title text-reru-text-primary">View invoices</p>
            <p className="text-sm text-reru-text-muted">Payment history</p>
          </div>
        </Link>

        <Link
          href="/dashboard/agreement"
          className="flex items-center gap-4 bg-white border border-reru-border rounded-xl p-5 shadow-card hover:border-green-200 hover:shadow-card-hover transition-all duration-150"
        >
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <ScrollText size={18} strokeWidth={1.8} className="text-green-600" />
          </div>
          <div>
            <p className="reru-card-title text-reru-text-primary">Service agreement</p>
            <p className="text-sm text-reru-text-muted">Terms &amp; conditions</p>
          </div>
        </Link>

        {pendingInvoice ? (
          <div className="flex items-center gap-4 bg-orange-50 border border-orange-200 rounded-xl p-5">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Bell size={18} strokeWidth={1.8} className="text-orange-600" />
            </div>
            <div>
              <p className="reru-card-title text-reru-text-primary">Payment due</p>
              <p className="text-sm text-reru-text-muted">
                {formatUGX(pendingInvoice.total)} due {formatDate(pendingInvoice.date)}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <Bell size={18} strokeWidth={1.8} className="text-green-600" />
            </div>
            <div>
              <p className="reru-card-title text-reru-text-primary">All paid up</p>
              <p className="text-sm text-reru-text-muted">No pending payments</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
