import { NextResponse } from 'next/server'
import { z } from 'zod'
import { format, startOfWeek, subWeeks } from 'date-fns'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import type { ApiResponse } from '@/types'

const querySchema = z.object({
  weeks: z.coerce.number().int().min(1).max(104).default(12),
})

type WeeklyRow = {
  week_start: string
  scheduled_total: number
  completed: number
  missed: number
  bags: number
  completed_without_bags: number
}

type LocationRow = {
  week_start: string
  location: string
  scheduled_total: number
  completed: number
  missed: number
  bags: number
}

type StatisticsData = {
  totals: {
    bags: number
    completed: number
    missed: number
    scheduled: number
    completion_rate: number
    average_bags_per_collection: number
    completed_without_bags: number
  }
  current_week: { week_start: string; bags: number; change_vs_previous_week: number }
  weekly: { week_start: string; scheduled_total: number; completed: number; missed: number; bags: number }[]
  by_location: { location: string; scheduled_total: number; completed: number; missed: number; bags: number }[]
}

/** Collection and bag-volume statistics. `weeks` bounds the weekly series and the location breakdown; totals are all-time. */
export async function GET(request: Request): Promise<NextResponse<ApiResponse<StatisticsData>>> {
  const adminUser = await getAdminUser(request)
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid query' },
      { status: 400 }
    )
  }

  const { weeks } = parsed.data
  const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const rangeStartISO = format(subWeeks(thisWeekStart, weeks - 1), 'yyyy-MM-dd')

  const [weeklyResult, locationResult] = await Promise.all([
    adminUser.supabase.from('collection_weekly_stats').select('*').order('week_start'),
    adminUser.supabase.from('collection_location_weekly_stats').select('*').gte('week_start', rangeStartISO),
  ])

  if (weeklyResult.error || locationResult.error) {
    console.error('[GET /api/admin/statistics]', weeklyResult.error ?? locationResult.error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch statistics' }, { status: 500 })
  }

  const allWeekly = (weeklyResult.data ?? []) as WeeklyRow[]
  const locations = (locationResult.data ?? []) as LocationRow[]

  const bags      = allWeekly.reduce((s, w) => s + w.bags, 0)
  const completed = allWeekly.reduce((s, w) => s + w.completed, 0)
  const missed    = allWeekly.reduce((s, w) => s + w.missed, 0)
  const scheduled = allWeekly.reduce((s, w) => s + w.scheduled_total, 0)
  const withoutBags = allWeekly.reduce((s, w) => s + w.completed_without_bags, 0)

  const inRange = allWeekly.filter((w) => w.week_start >= rangeStartISO)
  // Emit an entry for every week in the range so gaps are explicit zeros, not holes.
  const weekly = Array.from({ length: weeks }, (_, i) => {
    const weekStart = format(subWeeks(thisWeekStart, weeks - 1 - i), 'yyyy-MM-dd')
    const found = inRange.find((w) => w.week_start === weekStart)
    return {
      week_start:      weekStart,
      scheduled_total: found?.scheduled_total ?? 0,
      completed:       found?.completed ?? 0,
      missed:          found?.missed ?? 0,
      bags:            found?.bags ?? 0,
    }
  })

  const thisWeekISO = format(thisWeekStart, 'yyyy-MM-dd')
  const lastWeekISO = format(subWeeks(thisWeekStart, 1), 'yyyy-MM-dd')
  const bagsThisWeek = allWeekly.find((w) => w.week_start === thisWeekISO)?.bags ?? 0
  const bagsLastWeek = allWeekly.find((w) => w.week_start === lastWeekISO)?.bags ?? 0

  const byLocation = Object.values(
    locations.reduce<Record<string, StatisticsData['by_location'][number]>>((acc, row) => {
      const entry = acc[row.location] ?? { location: row.location, scheduled_total: 0, completed: 0, missed: 0, bags: 0 }
      entry.scheduled_total += row.scheduled_total
      entry.completed       += row.completed
      entry.missed          += row.missed
      entry.bags            += row.bags
      acc[row.location] = entry
      return acc
    }, {})
  ).sort((a, b) => b.bags - a.bags)

  return NextResponse.json({
    ok: true,
    data: {
      totals: {
        bags,
        completed,
        missed,
        scheduled,
        completion_rate: scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0,
        average_bags_per_collection: completed > 0 ? Number((bags / completed).toFixed(2)) : 0,
        completed_without_bags: withoutBags,
      },
      current_week: {
        week_start: thisWeekISO,
        bags: bagsThisWeek,
        change_vs_previous_week: bagsThisWeek - bagsLastWeek,
      },
      weekly,
      by_location: byLocation,
    },
  })
}
