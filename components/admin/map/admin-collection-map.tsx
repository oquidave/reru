'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import type { MapMarker } from '@/components/shared/location-map'

const LocationMap = dynamic(
  () => import('@/components/shared/location-map').then((m) => m.LocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[520px] rounded-xl bg-green-50 border border-reru-border flex items-center justify-center">
        <p className="reru-body text-reru-text-secondary">Loading map…</p>
      </div>
    ),
  }
)

export interface MappedClient {
  id: string
  name: string
  address: string | null
  location: string | null
  collection_day: string | null
  latitude: number
  longitude: number
  /** Status of this client's collection on the selected date, if any. */
  today_status: 'scheduled' | 'completed' | 'missed' | null
}

interface AdminCollectionMapProps {
  clients: MappedClient[]
  /** Human-readable date the statuses belong to. */
  dateLabel: string
}

type Filter = 'all' | 'scheduled' | 'completed' | 'missed'

const FILTERS: { key: Filter; label: string; tone: string }[] = [
  { key: 'all',       label: 'All',       tone: 'bg-reru-text-primary' },
  { key: 'scheduled', label: 'Scheduled', tone: 'bg-reru-warning' },
  { key: 'completed', label: 'Completed', tone: 'bg-green-700' },
  { key: 'missed',    label: 'Missed',    tone: 'bg-reru-danger' },
]

function toneFor(status: MappedClient['today_status']): MapMarker['tone'] {
  if (status === 'completed') return 'success'
  if (status === 'missed')    return 'danger'
  if (status === 'scheduled') return 'warning'
  return 'default'
}

export function AdminCollectionMap({ clients, dateLabel }: AdminCollectionMapProps) {
  const [filter, setFilter] = useState<Filter>('all')

  const visible = useMemo(
    () => (filter === 'all' ? clients : clients.filter((c) => c.today_status === filter)),
    [clients, filter]
  )

  const markers: MapMarker[] = useMemo(
    () =>
      visible.map((c) => ({
        id:        c.id,
        latitude:  c.latitude,
        longitude: c.longitude,
        label:     c.name,
        sublabel:  [c.address, c.location, c.collection_day].filter(Boolean).join(' · ') || undefined,
        tone:      toneFor(c.today_status),
      })),
    [visible]
  )

  const counts = useMemo(
    () => ({
      all:       clients.length,
      scheduled: clients.filter((c) => c.today_status === 'scheduled').length,
      completed: clients.filter((c) => c.today_status === 'completed').length,
      missed:    clients.filter((c) => c.today_status === 'missed').length,
    }),
    [clients]
  )

  return (
    <div className="space-y-4">
      {/* Filters double as the legend — pin colour is never the only cue. */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(({ key, label, tone }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            aria-pressed={filter === key}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors',
              filter === key
                ? 'border-green-700 bg-green-50 text-reru-text-primary'
                : 'border-reru-border bg-white text-reru-text-secondary hover:text-reru-text-primary'
            )}
          >
            <span className={cn('w-2.5 h-2.5 rounded-full', tone)} />
            {label}
            <span className="tabular-nums text-reru-text-muted">{counts[key]}</span>
          </button>
        ))}
        <p className="text-sm text-reru-text-muted ml-1">Status shown for {dateLabel}</p>
      </div>

      {markers.length === 0 ? (
        <div className="h-[520px] rounded-xl border border-reru-border bg-white shadow-card flex items-center justify-center">
          <p className="reru-body text-reru-text-secondary text-center px-6">
            {clients.length === 0
              ? 'No clients have a saved pickup location yet.'
              : `No clients match "${FILTERS.find((f) => f.key === filter)?.label}".`}
          </p>
        </div>
      ) : (
        <LocationMap
          markers={markers}
          className="h-[520px] w-full rounded-xl border border-reru-border overflow-hidden shadow-card z-0"
        />
      )}
    </div>
  )
}
