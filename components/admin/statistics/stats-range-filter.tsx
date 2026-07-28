'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const RANGES = [
  { weeks: 12, label: '12 weeks' },
  { weeks: 26, label: '26 weeks' },
  { weeks: 52, label: '1 year' },
] as const

interface StatsRangeFilterProps {
  currentWeeks: number
}

export function StatsRangeFilter({ currentWeeks }: StatsRangeFilterProps) {
  const router = useRouter()

  return (
    <div className="inline-flex rounded-lg border border-reru-border bg-white p-0.5" role="group" aria-label="Time range">
      {RANGES.map(({ weeks, label }) => (
        <button
          key={weeks}
          onClick={() => router.push(`/dashboard/admin/statistics?weeks=${weeks}`)}
          aria-pressed={currentWeeks === weeks}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            currentWeeks === weeks
              ? 'bg-green-700 text-white'
              : 'text-reru-text-secondary hover:text-reru-text-primary hover:bg-green-50'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
