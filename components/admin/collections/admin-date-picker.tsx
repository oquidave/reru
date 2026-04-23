'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, subDays, parseISO } from 'date-fns'

interface AdminDatePickerProps {
  currentDate: string
}

export function AdminDatePicker({ currentDate }: AdminDatePickerProps) {
  const router = useRouter()
  const parsed = parseISO(currentDate)
  const todayISO = format(new Date(), 'yyyy-MM-dd')

  function navigate(date: Date) {
    const iso = format(date, 'yyyy-MM-dd')
    router.push(`/dashboard/admin/collections?date=${iso}`)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate(subDays(parsed, 1))}
        className="p-1.5 rounded-md border border-reru-border text-reru-text-secondary hover:border-green-300 hover:text-reru-text-primary transition-colors"
      >
        <ChevronLeft size={16} />
      </button>
      <input
        type="date"
        value={currentDate}
        onChange={(e) => { if (e.target.value) router.push(`/dashboard/admin/collections?date=${e.target.value}`) }}
        className="h-9 rounded-lg border border-reru-border px-3 text-sm font-medium bg-white text-reru-text-primary focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 transition-colors"
      />
      <button
        onClick={() => navigate(addDays(parsed, 1))}
        className="p-1.5 rounded-md border border-reru-border text-reru-text-secondary hover:border-green-300 hover:text-reru-text-primary transition-colors"
      >
        <ChevronRight size={16} />
      </button>
      {currentDate !== todayISO && (
        <button
          onClick={() => router.push('/dashboard/admin/collections')}
          className="text-sm font-medium text-green-700 hover:text-green-600 transition-colors"
        >
          Today
        </button>
      )}
    </div>
  )
}
