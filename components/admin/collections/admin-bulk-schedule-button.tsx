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
      // A crashed route returns an empty body, so never assume the response is JSON.
      const json = await res.json().catch(() => null) as
        | { ok: boolean; data?: { scheduled: number; already_scheduled: number; skipped_clients: number }; error?: string }
        | null

      if (!json || !json.ok) {
        toast.error(json?.error ?? 'Failed to schedule collections. Please try again.')
        return
      }

      const { scheduled = 0, already_scheduled = 0, skipped_clients = 0 } = json.data ?? {}
      if (scheduled === 0 && already_scheduled > 0) {
        toast.success('All collections for the next 4 weeks were already scheduled')
      } else {
        toast.success(`${scheduled} collection${scheduled === 1 ? '' : 's'} scheduled for the next 4 weeks`)
      }
      if (skipped_clients > 0) {
        toast.warning(`${skipped_clients} client${skipped_clients === 1 ? '' : 's'} skipped — no collection day set`)
      }
      router.refresh()
    } catch {
      toast.error('Could not reach the server. Check your connection and try again.')
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
