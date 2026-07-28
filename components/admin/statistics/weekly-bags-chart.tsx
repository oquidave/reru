'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'

export interface WeeklyPoint {
  week_start: string
  bags: number
  completed: number
  missed: number
  scheduled_total: number
}

interface WeeklyBagsChartProps {
  data: WeeklyPoint[]
}

/**
 * Pick a tick step of 1 / 2 / 5 × 10ⁿ, then round the axis top up to a multiple of
 * it. Choosing the step first (rather than the max) is what keeps every tick a
 * whole round number — deriving ticks by quartering a "nice" max yields 6/13/19.
 */
function niceScale(peak: number): { axisMax: number; ticks: number[] } {
  const target = peak <= 0 ? 4 : peak
  const magnitude = 10 ** Math.floor(Math.log10(target / 4 || 1))
  // Bags are whole numbers, so never step by a fraction — that would repeat ticks.
  const step = Math.max(
    1,
    [1, 2, 5, 10].map((m) => m * magnitude).find((s) => Math.ceil(target / s) <= 5) ?? 10 * magnitude
  )

  const axisMax = Math.max(step, Math.ceil(target / step) * step)
  const ticks: number[] = []
  for (let t = 0; t <= axisMax; t += step) ticks.push(Math.round(t))
  return { axisMax, ticks }
}

export function WeeklyBagsChart({ data }: WeeklyBagsChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="reru-body text-reru-text-secondary">No collections recorded in this period.</p>
      </div>
    )
  }

  const peak = Math.max(...data.map((d) => d.bags))
  const { axisMax, ticks } = niceScale(peak)
  // Label only the peak week — a value on every column reads as noise; the axis
  // and the hover tooltip carry the rest.
  const peakIndex = peak > 0 ? data.findIndex((d) => d.bags === peak) : -1
  const active = hovered === null ? null : data[hovered]

  return (
    // No overflow on this subtree: `overflow-x-auto` would compute overflow-y to
    // `auto` and clip the peak label and tooltip, which sit above the plot.
    <div className="w-full">
      {/* Headroom for the peak label above a full-height column. */}
      <div className="flex gap-3 pt-6">
        {/* Y axis */}
        <div className="relative w-8 h-56 flex-shrink-0">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-0 -translate-y-1/2 text-xs tabular-nums text-reru-text-muted"
              style={{ bottom: `${(t / axisMax) * 100}%` }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Plot */}
        <div className="relative flex-1 min-w-0">
          {/* Gridlines sit behind the marks, hairline and solid. */}
          <div className="absolute inset-x-0 top-0 h-56 pointer-events-none">
            {ticks.map((t) => (
              <div
                key={t}
                className="absolute left-0 right-0 border-t border-reru-border"
                style={{ bottom: `${(t / axisMax) * 100}%` }}
              />
            ))}
          </div>

          <div className="relative h-56 flex items-end gap-0.5">
            {data.map((d, i) => {
              const heightPct = (d.bags / axisMax) * 100
              const isHovered = hovered === i
              return (
                <div
                  key={d.week_start}
                  className="relative flex-1 h-full flex items-end justify-center"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                  tabIndex={0}
                  role="img"
                  aria-label={`Week of ${format(parseISO(d.week_start), 'd MMM yyyy')}: ${d.bags} bags, ${d.completed} of ${d.scheduled_total} collections completed`}
                >
                  {i === peakIndex && hovered === null && (
                    <span
                      className="absolute text-xs font-bold tabular-nums text-reru-text-primary whitespace-nowrap"
                      style={{ bottom: `calc(${heightPct}% + 4px)` }}
                    >
                      {d.bags}
                    </span>
                  )}

                  <div
                    className="w-full max-w-[24px] rounded-t bg-green-700 transition-opacity duration-150"
                    style={{
                      height:  `${heightPct}%`,
                      opacity: hovered === null || isHovered ? 1 : 0.4,
                    }}
                  />
                </div>
              )
            })}
          </div>

          {/* One tooltip anchored to the top of the plot, tracking the hovered column.
              Anchoring above the mark would overflow the card for tall columns; the
              hovered bar stays identifiable because every other bar dims. */}
          {active && hovered !== null && (
            <div
              className="absolute -top-1 z-10 -translate-x-1/2 w-max max-w-[190px] rounded-lg bg-green-900 px-3 py-2 text-white shadow-card pointer-events-none"
              style={{
                // Keep the centred tooltip inside the plot: clamp by half its max width
                // so the first and last columns don't push it past the card edge.
                left: `clamp(95px, ${((hovered + 0.5) / data.length) * 100}%, calc(100% - 95px))`,
              }}
            >
              <p className="text-xs font-semibold">
                Week of {format(parseISO(active.week_start), 'd MMM yyyy')}
              </p>
              <p className="text-sm font-bold tabular-nums mt-0.5">
                {active.bags} bag{active.bags === 1 ? '' : 's'}
              </p>
              <p className="text-xs text-white/70">
                {active.completed} of {active.scheduled_total} completed
                {active.missed > 0 ? ` · ${active.missed} missed` : ''}
              </p>
            </div>
          )}

          {/* X axis — label the ends and roughly every fourth week so ticks never collide. */}
          <div className="flex gap-0.5 mt-2">
            {data.map((d, i) => {
              const showLabel = i === 0 || i === data.length - 1 || i % 4 === 0
              return (
                <div key={d.week_start} className="flex-1 min-w-0 text-center">
                  {showLabel && (
                    <span className="text-[10px] text-reru-text-muted whitespace-nowrap">
                      {format(parseISO(d.week_start), 'd MMM')}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
