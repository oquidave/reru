'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, ToggleLeft, ToggleRight, Globe, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatUGX } from '@/lib/utils'
import { AdminEditTierDialog } from './admin-edit-tier-dialog'
import type { PricingTier } from '@/types'

interface AdminPricingTableProps {
  tiers: PricingTier[]
}

export function AdminPricingTable({ tiers }: AdminPricingTableProps) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  async function toggleActive(tier: PricingTier) {
    setBusy(tier.id)
    try {
      const res = await fetch(`/api/admin/pricing/${tier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !tier.is_active }),
      })
      const json = await res.json() as { ok: boolean; error?: string }
      if (!json.ok) { toast.error(json.error ?? 'Failed to update tier'); return }
      toast.success(tier.is_active ? 'Tier deactivated' : 'Tier activated')
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  if (tiers.length === 0) {
    return (
      <div className="bg-white border border-reru-border rounded-xl shadow-card p-12 text-center">
        <p className="reru-card-title text-reru-text-primary mb-1">No pricing tiers yet</p>
        <p className="reru-body text-reru-text-secondary">Add your first tier to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-reru-border rounded-xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-reru-border">
              <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Name</th>
              <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Slug</th>
              <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Price</th>
              <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Period</th>
              <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Visibility</th>
              <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Status</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier, i) => (
              <tr
                key={tier.id}
                className={`hover:bg-green-50 transition-colors duration-150 ${i < tiers.length - 1 ? 'border-b border-reru-border' : ''}`}
              >
                <td className="px-6 py-4">
                  <p className="text-md font-semibold text-reru-text-primary">{tier.name}</p>
                  {tier.description && (
                    <p className="text-sm text-reru-text-muted mt-0.5 max-w-xs truncate">{tier.description}</p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <code className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-mono">{tier.slug}</code>
                </td>
                <td className="px-6 py-4 text-md text-reru-text-secondary">
                  {tier.price !== null ? formatUGX(tier.price) : <span className="text-reru-text-muted italic">per client</span>}
                </td>
                <td className="px-6 py-4 text-md text-reru-text-secondary capitalize">{tier.billing_period}</td>
                <td className="px-6 py-4">
                  {tier.is_public ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      <Globe size={11} /> Public
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-reru-text-muted bg-reru-bg px-2 py-0.5 rounded-full border border-reru-border">
                      <Lock size={11} /> Admin only
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${
                    tier.is_active
                      ? 'text-green-700 bg-green-50 border-green-200'
                      : 'text-reru-text-muted bg-reru-bg border-reru-border'
                  }`}>
                    {tier.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <AdminEditTierDialog tier={tier} />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={busy === tier.id}
                      onClick={() => toggleActive(tier)}
                    >
                      {tier.is_active
                        ? <><ToggleRight size={14} /> Deactivate</>
                        : <><ToggleLeft size={14} /> Activate</>}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
