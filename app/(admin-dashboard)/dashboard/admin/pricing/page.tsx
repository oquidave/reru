import { getAdminUser } from '@/lib/auth/get-admin-user'
import { redirect } from 'next/navigation'
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server'
import { AdminPricingTable } from '@/components/admin/pricing/admin-pricing-table'
import { AdminAddTierDialog } from '@/components/admin/pricing/admin-add-tier-dialog'
import type { PricingTier } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Pricing Tiers — RERU Admin',
}

export default async function AdminPricingPage() {
  const adminUser = await getAdminUser()
  if (!adminUser) redirect('/auth/login')

  const supabase = createSupabaseServiceRoleClient()
  const { data: tiers } = await supabase
    .from('pricing_tiers')
    .select('*')
    .order('sort_order', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="reru-h1 text-reru-text-primary">Pricing tiers</h1>
          <p className="reru-body text-reru-text-secondary mt-1">
            Manage the plans available to clients. Changes take effect immediately.
          </p>
        </div>
        <AdminAddTierDialog />
      </div>

      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
        <strong>Note:</strong> Deactivating a tier hides it from new clients but does not affect existing subscribers.
        Clients on a custom plan must have a per-client price set in their profile before invoices can be generated.
      </div>

      <AdminPricingTable tiers={(tiers ?? []) as PricingTier[]} />
    </div>
  )
}
