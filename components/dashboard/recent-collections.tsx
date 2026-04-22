import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'
import type { Collection } from '@/types'

interface RecentCollectionsProps {
  collections: Collection[]
}

export function RecentCollections({ collections }: RecentCollectionsProps) {
  return (
    <div className="bg-white border border-reru-border rounded-xl shadow-card mb-6">
      <div className="flex items-center justify-between px-6 py-4 border-b border-reru-border">
        <h2 className="reru-card-title text-reru-text-primary">Recent collections</h2>
        <Link
          href="/dashboard/collections"
          className="flex items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-600 transition-colors"
        >
          View all <ChevronRight size={14} />
        </Link>
      </div>
      {collections.length === 0 ? (
        <p className="px-6 py-8 text-center reru-body text-reru-text-muted">No collections yet</p>
      ) : (
        <ul>
          {collections.map((c, i) => (
            <li
              key={c.id}
              className={`flex items-center justify-between px-6 py-4 hover:bg-green-50 transition-colors duration-150 ${i < collections.length - 1 ? 'border-b border-reru-border' : ''}`}
            >
              <div>
                <p className="text-md font-semibold text-reru-text-primary">{formatDate(c.scheduled_date)}</p>
                {c.notes && <p className="text-sm text-reru-text-muted">{c.notes}</p>}
              </div>
              <StatusBadge status={c.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
