import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { format, parseISO, startOfWeek, subWeeks } from 'date-fns'
import { Trash2, TrendingUp, TrendingDown, Percent, PackageCheck } from 'lucide-react'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { WeeklyBagsChart, type WeeklyPoint } from '@/components/admin/statistics/weekly-bags-chart'
import { StatsRangeFilter } from '@/components/admin/statistics/stats-range-filter'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Statistics — RERU Admin' }

interface PageProps {
  searchParams: Promise<{ weeks?: string }>
}

type WeeklyRow = WeeklyPoint & { completed_without_bags: number }
type LocationRow = {
  week_start: string
  location: string
  completed: number
  missed: number
  scheduled_total: number
  bags: number
}

const ALLOWED_RANGES = [12, 26, 52]

export default async function AdminStatisticsPage({ searchParams }: PageProps) {
  const adminUser = await getAdminUser()
  if (!adminUser) redirect('/dashboard')

  const { weeks: weeksParam } = await searchParams
  const parsedWeeks = Number(weeksParam)
  const weeks = ALLOWED_RANGES.includes(parsedWeeks) ? parsedWeeks : 12

  const supabase = await createSupabaseServerClient()

  const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const rangeStart    = subWeeks(thisWeekStart, weeks - 1)
  const rangeStartISO = format(rangeStart, 'yyyy-MM-dd')

  const [{ data: allWeeklyRows }, { data: locationRows }] = await Promise.all([
    supabase.from('collection_weekly_stats').select('*').order('week_start'),
    supabase
      .from('collection_location_weekly_stats')
      .select('*')
      .gte('week_start', rangeStartISO),
  ])

  const allWeekly = (allWeeklyRows ?? []) as WeeklyRow[]
  const locations = (locationRows ?? []) as LocationRow[]

  // All-time headline figures come from the full series; the chart and the
  // location breakdown use the selected range only.
  const totalBags       = allWeekly.reduce((sum, w) => sum + w.bags, 0)
  const totalCompleted  = allWeekly.reduce((sum, w) => sum + w.completed, 0)
  const totalMissed     = allWeekly.reduce((sum, w) => sum + w.missed, 0)
  const totalScheduled  = allWeekly.reduce((sum, w) => sum + w.scheduled_total, 0)
  const missingBagCount = allWeekly.reduce((sum, w) => sum + w.completed_without_bags, 0)

  const inRange = allWeekly.filter((w) => w.week_start >= rangeStartISO)

  // Fill gaps so a week with no collections still occupies a slot on the axis.
  const series: WeeklyPoint[] = Array.from({ length: weeks }, (_, i) => {
    const weekStart = format(subWeeks(thisWeekStart, weeks - 1 - i), 'yyyy-MM-dd')
    const found = inRange.find((w) => w.week_start === weekStart)
    return found ?? { week_start: weekStart, bags: 0, completed: 0, missed: 0, scheduled_total: 0 }
  })

  const thisWeekISO = format(thisWeekStart, 'yyyy-MM-dd')
  const lastWeekISO = format(subWeeks(thisWeekStart, 1), 'yyyy-MM-dd')
  const bagsThisWeek = allWeekly.find((w) => w.week_start === thisWeekISO)?.bags ?? 0
  const bagsLastWeek = allWeekly.find((w) => w.week_start === lastWeekISO)?.bags ?? 0
  const weekDelta    = bagsThisWeek - bagsLastWeek

  const avgPerCollection = totalCompleted > 0 ? totalBags / totalCompleted : 0
  const completionRate   = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0

  // Roll the per-week location rows up to one row per location for the range.
  const byLocation = Object.values(
    locations.reduce<Record<string, { location: string; completed: number; missed: number; scheduled_total: number; bags: number }>>(
      (acc, row) => {
        const entry = acc[row.location] ?? { location: row.location, completed: 0, missed: 0, scheduled_total: 0, bags: 0 }
        entry.completed      += row.completed
        entry.missed         += row.missed
        entry.scheduled_total += row.scheduled_total
        entry.bags           += row.bags
        acc[row.location] = entry
        return acc
      },
      {}
    )
  ).sort((a, b) => b.bags - a.bags)

  const rangeLabel = weeks === 52 ? 'the last year' : `the last ${weeks} weeks`

  const tiles = [
    {
      label: 'Bags this week',
      value: bagsThisWeek.toLocaleString(),
      icon:  weekDelta >= 0 ? TrendingUp : TrendingDown,
      note:  bagsLastWeek === 0 && bagsThisWeek === 0
        ? 'No bags recorded yet'
        : `${weekDelta >= 0 ? '+' : ''}${weekDelta} vs last week`,
      noteClass: weekDelta > 0 ? 'text-green-700' : weekDelta < 0 ? 'text-reru-danger' : 'text-reru-text-muted',
    },
    {
      label: 'Average per collection',
      value: avgPerCollection > 0 ? avgPerCollection.toFixed(1) : '—',
      icon:  PackageCheck,
      note:  `Across ${totalCompleted.toLocaleString()} completed collection${totalCompleted === 1 ? '' : 's'}`,
      noteClass: 'text-reru-text-muted',
    },
    {
      label: 'Completion rate',
      value: totalScheduled > 0 ? `${completionRate}%` : '—',
      icon:  Percent,
      note:  `${totalMissed.toLocaleString()} missed of ${totalScheduled.toLocaleString()} scheduled`,
      noteClass: 'text-reru-text-muted',
    },
  ]

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="reru-h1 text-reru-text-primary">Statistics</h1>
          <p className="reru-body text-reru-text-secondary mt-1">Waste collected and service reliability</p>
        </div>
        <Suspense>
          <StatsRangeFilter currentWeeks={weeks} />
        </Suspense>
      </div>

      {/* Hero figure — the number the page leads with. */}
      <div className="bg-green-900 text-white rounded-xl shadow-card p-6 sm:p-8 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <Trash2 size={20} strokeWidth={1.8} className="text-white" />
          </div>
          <div>
            <p className="reru-overline text-white/50">TOTAL BAGS COLLECTED</p>
            <p className="text-5xl sm:text-6xl font-extrabold tabular-nums mt-1">{totalBags.toLocaleString()}</p>
            <p className="text-sm text-white/70 mt-2">
              All time, across {totalCompleted.toLocaleString()} completed collection{totalCompleted === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {tiles.map(({ label, value, icon: Icon, note, noteClass }) => (
          <div key={label} className="bg-white border border-reru-border rounded-xl p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                <Icon size={17} strokeWidth={1.8} className="text-green-700" />
              </div>
              <p className="reru-overline text-reru-text-muted">{label.toUpperCase()}</p>
            </div>
            <p className="text-3xl font-extrabold text-reru-text-primary tabular-nums">{value}</p>
            <p className={cn('text-sm mt-1', noteClass)}>{note}</p>
          </div>
        ))}
      </div>

      {missingBagCount > 0 && (
        <div className="bg-orange-50 border border-reru-warning/30 rounded-xl p-4 mb-6">
          <p className="text-sm text-reru-text-secondary">
            <span className="font-semibold text-reru-text-primary">{missingBagCount}</span> completed
            collection{missingBagCount === 1 ? ' has' : 's have'} no bag count recorded, so the totals above
            understate what was actually collected. Bag counts are captured when a collection is marked completed.
          </p>
        </div>
      )}

      {/* Weekly chart */}
      <div className="bg-white border border-reru-border rounded-xl shadow-card p-5 sm:p-6 mb-6">
        <div className="mb-5">
          <h2 className="reru-card-title text-reru-text-primary">Bags collected per week</h2>
          <p className="text-sm text-reru-text-secondary mt-0.5">Weeks beginning Monday, over {rangeLabel}</p>
        </div>
        <WeeklyBagsChart data={series} />
      </div>

      {/* Table view — the same data, readable without relying on the chart. */}
      <div className="bg-white border border-reru-border rounded-xl shadow-card overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-reru-border">
          <h2 className="reru-card-title text-reru-text-primary">Weekly breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-reru-border">
                <th className="px-5 py-3 text-left reru-overline text-reru-text-muted">Week starting</th>
                <th className="px-5 py-3 text-right reru-overline text-reru-text-muted">Scheduled</th>
                <th className="px-5 py-3 text-right reru-overline text-reru-text-muted">Completed</th>
                <th className="px-5 py-3 text-right reru-overline text-reru-text-muted">Missed</th>
                <th className="px-5 py-3 text-right reru-overline text-reru-text-muted">Bags</th>
                <th className="px-5 py-3 text-right reru-overline text-reru-text-muted">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {[...series].reverse().map((w, i, arr) => {
                // Running total, oldest to newest, read back out in reverse order.
                const cumulative = arr.slice(i).reduce((sum, row) => sum + row.bags, 0)
                return (
                  <tr key={w.week_start} className="border-b border-reru-border last:border-b-0 hover:bg-green-50 transition-colors">
                    <td className="px-5 py-3 text-sm font-semibold text-reru-text-primary whitespace-nowrap">
                      {format(parseISO(w.week_start), 'd MMM yyyy')}
                    </td>
                    <td className="px-5 py-3 text-sm text-right tabular-nums text-reru-text-secondary">{w.scheduled_total}</td>
                    <td className="px-5 py-3 text-sm text-right tabular-nums text-reru-text-secondary">{w.completed}</td>
                    <td className="px-5 py-3 text-sm text-right tabular-nums text-reru-text-secondary">
                      {w.missed > 0 ? <span className="text-reru-danger font-semibold">{w.missed}</span> : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-right tabular-nums font-bold text-reru-text-primary">{w.bags}</td>
                    <td className="px-5 py-3 text-sm text-right tabular-nums text-reru-text-muted">{cumulative}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-location breakdown */}
      <div className="bg-white border border-reru-border rounded-xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-reru-border">
          <h2 className="reru-card-title text-reru-text-primary">By location</h2>
          <p className="text-sm text-reru-text-secondary mt-0.5">Over {rangeLabel}</p>
        </div>
        {byLocation.length === 0 ? (
          <p className="px-6 py-10 text-center reru-body text-reru-text-secondary">
            No collections in this period.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-reru-border">
                  <th className="px-5 py-3 text-left reru-overline text-reru-text-muted">Location</th>
                  <th className="px-5 py-3 text-right reru-overline text-reru-text-muted">Completed</th>
                  <th className="px-5 py-3 text-right reru-overline text-reru-text-muted">Missed</th>
                  <th className="px-5 py-3 text-right reru-overline text-reru-text-muted">Bags</th>
                  <th className="px-5 py-3 text-right reru-overline text-reru-text-muted">Avg / collection</th>
                </tr>
              </thead>
              <tbody>
                {byLocation.map((l) => (
                  <tr key={l.location} className="border-b border-reru-border last:border-b-0 hover:bg-green-50 transition-colors">
                    <td className="px-5 py-3 text-sm font-semibold text-reru-text-primary">{l.location}</td>
                    <td className="px-5 py-3 text-sm text-right tabular-nums text-reru-text-secondary">{l.completed}</td>
                    <td className="px-5 py-3 text-sm text-right tabular-nums text-reru-text-secondary">
                      {l.missed > 0 ? <span className="text-reru-danger font-semibold">{l.missed}</span> : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-right tabular-nums font-bold text-reru-text-primary">{l.bags}</td>
                    <td className="px-5 py-3 text-sm text-right tabular-nums text-reru-text-secondary">
                      {l.completed > 0 ? (l.bags / l.completed).toFixed(1) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
