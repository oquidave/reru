'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarPlus } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

export function AdminBulkScheduleButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSchedule() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/collections/bulk-schedule', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ weeks_ahead: 4 }),
      })
      const json = await res.json() as { ok: boolean; data?: { scheduled: number }; error?: string }
      if (!json.ok) {
        toast.error(json.error ?? 'Failed to schedule collections')
        return
      }
      toast.success(`${json.data?.scheduled ?? 0} collections scheduled for the next 4 weeks`)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CalendarPlus size={14} /> Bulk schedule (4 weeks)
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Schedule collections for 4 weeks</AlertDialogTitle>
          <AlertDialogDescription>
            This will create scheduled collection records for all active clients for the next 4 weeks
            based on their preferred collection day. Existing records are not overwritten.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSchedule} disabled={loading}>
            {loading ? 'Scheduling…' : 'Schedule'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
