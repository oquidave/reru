'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const ZONES = ['Zone A', 'Zone B', 'Zone C']
const PLANS = ['monthly', 'annual']
const STATUSES = ['active', 'suspended', 'cancelled']

export function AdminClientFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const zone   = searchParams.get('zone') ?? ''
  const plan   = searchParams.get('plan') ?? ''
  const status = searchParams.get('status') ?? ''

  const buildUrl = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams()
      const merged = { q: search, zone, plan, status, ...overrides }
      Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v) })
      return `/dashboard/admin/clients?${params.toString()}`
    },
    [search, zone, plan, status]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(buildUrl({ q: search }))
    }, 250)
    return () => clearTimeout(timer)
  }, [search, buildUrl, router])

  const hasFilters = !!(search || zone || plan || status)

  function selectStyle(active: boolean) {
    return cn(
      'h-9 rounded-lg border px-3 text-sm font-medium bg-white text-reru-text-primary transition-colors duration-150 cursor-pointer',
      active
        ? 'border-green-600 ring-1 ring-green-600'
        : 'border-reru-border hover:border-green-300'
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-reru-text-muted" />
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-reru-border text-sm bg-white text-reru-text-primary placeholder:text-reru-text-muted focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 transition-colors duration-150"
        />
      </div>

      {/* Zone */}
      <select
        value={zone}
        onChange={(e) => router.push(buildUrl({ zone: e.target.value }))}
        className={selectStyle(!!zone)}
      >
        <option value="">All zones</option>
        {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
      </select>

      {/* Plan */}
      <select
        value={plan}
        onChange={(e) => router.push(buildUrl({ plan: e.target.value }))}
        className={selectStyle(!!plan)}
      >
        <option value="">All plans</option>
        {PLANS.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
      </select>

      {/* Status */}
      <select
        value={status}
        onChange={(e) => router.push(buildUrl({ status: e.target.value }))}
        className={selectStyle(!!status)}
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
      </select>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={() => { setSearch(''); router.push('/dashboard/admin/clients') }}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-reru-border text-sm font-medium text-reru-text-secondary hover:text-reru-text-primary hover:border-green-300 transition-colors duration-150"
        >
          <X size={13} /> Clear
        </button>
      )}
    </div>
  )
}
