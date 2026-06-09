'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import type { ServiceLocation } from '@/types'

export function AdminLocationsTable({ locations }: { locations: ServiceLocation[] }) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function toggleActive(loc: ServiceLocation) {
    setPendingId(loc.id)
    try {
      const res = await fetch(`/api/admin/locations/${loc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !loc.active }),
      })
      const json = await res.json() as { ok: boolean; error?: string }
      if (!json.ok) {
        toast.error(json.error ?? 'Failed to update location')
        return
      }
      toast.success(loc.active ? `${loc.name} disabled` : `${loc.name} enabled`)
      router.refresh()
    } finally {
      setPendingId(null)
    }
  }

  if (locations.length === 0) {
    return (
      <div className="bg-white border border-reru-border rounded-xl shadow-card p-12 text-center">
        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-4">
          <MapPin size={20} strokeWidth={1.8} className="text-green-700" />
        </div>
        <p className="reru-card-title text-reru-text-primary mb-1">No locations yet</p>
        <p className="reru-body text-reru-text-secondary">Add the towns and areas you serve.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-reru-border rounded-xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px]">
          <thead>
            <tr className="border-b border-reru-border">
              <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Location</th>
              <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Status</th>
              <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Added</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {locations.map((loc, i) => (
              <tr
                key={loc.id}
                className={`hover:bg-green-50 transition-colors duration-150 ${i < locations.length - 1 ? 'border-b border-reru-border' : ''}`}
              >
                <td className="px-6 py-4 text-md font-semibold text-reru-text-primary">{loc.name}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={loc.active ? 'active' : 'suspended'} label={loc.active ? 'Active' : 'Disabled'} />
                </td>
                <td className="px-6 py-4 text-md text-reru-text-secondary whitespace-nowrap">{formatDate(loc.created_at)}</td>
                <td className="px-6 py-4 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(loc)}
                    disabled={pendingId === loc.id}
                  >
                    {pendingId === loc.id ? '…' : loc.active ? 'Disable' : 'Enable'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
