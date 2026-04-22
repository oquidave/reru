import { Calendar } from 'lucide-react'
import { formatDate, daysUntil } from '@/lib/utils'
import type { Collection } from '@/types'

interface NextCollectionCardProps {
  nextCollection: Collection | null
}

export function NextCollectionCard({ nextCollection }: NextCollectionCardProps) {
  const days = nextCollection ? daysUntil(nextCollection.scheduled_date) : null

  const daysLabel =
    days === null ? 'No upcoming collection'
    : days === 0 ? 'TODAY'
    : days < 0 ? 'Overdue'
    : `${days} day${days === 1 ? '' : 's'} away`

  return (
    <div
      className="relative overflow-hidden rounded-2xl text-white p-8 mb-6"
      style={{ background: 'linear-gradient(135deg, var(--color-green-900), var(--color-green-700), var(--color-green-500))' }}
    >
      {/* Decorative */}
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/[0.04] pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/[0.03] pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} strokeWidth={1.8} className="text-white/60" />
          <span className="text-sm font-semibold text-white/60 uppercase tracking-wider">Next collection</span>
        </div>
        {nextCollection ? (
          <>
            <p className="text-4xl font-extrabold tracking-tight mb-1">
              {formatDate(nextCollection.scheduled_date)}
            </p>
            <p className="text-lg font-semibold text-white/70 mb-4">{daysLabel}</p>
          </>
        ) : (
          <p className="text-2xl font-bold text-white/70 mb-4">No scheduled collection</p>
        )}
        <p className="text-sm text-white/60">
          Place your bags at the gate by <span className="font-semibold text-white/80">8:00 AM</span>
        </p>
      </div>
    </div>
  )
}
