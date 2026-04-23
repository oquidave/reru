import { Truck } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'
import type { Collection } from '@/types'

interface AdminClientCollectionsTableProps {
  collections: Collection[]
}

export function AdminClientCollectionsTable({ collections }: AdminClientCollectionsTableProps) {
  if (collections.length === 0) {
    return (
      <div className="bg-white border border-reru-border rounded-xl shadow-card p-8 text-center">
        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-3">
          <Truck size={18} strokeWidth={1.8} className="text-green-700" />
        </div>
        <p className="reru-body text-reru-text-secondary">No collection records for this client yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-reru-border rounded-xl shadow-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-reru-border">
            <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Scheduled</th>
            <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Notes</th>
            <th className="px-6 py-3 text-left reru-overline text-reru-text-muted">Bags</th>
            <th className="px-6 py-3 text-right reru-overline text-reru-text-muted">Status</th>
          </tr>
        </thead>
        <tbody>
          {collections.map((c, i) => (
            <tr
              key={c.id}
              className={`hover:bg-green-50 transition-colors duration-150 ${i < collections.length - 1 ? 'border-b border-reru-border' : ''}`}
            >
              <td className="px-6 py-4 text-md font-semibold text-reru-text-primary whitespace-nowrap">
                {formatDate(c.scheduled_date)}
              </td>
              <td className="px-6 py-4 text-md text-reru-text-secondary">{c.notes ?? '—'}</td>
              <td className="px-6 py-4 text-md text-reru-text-secondary">{c.bags_collected ?? '—'}</td>
              <td className="px-6 py-4 text-right"><StatusBadge status={c.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
