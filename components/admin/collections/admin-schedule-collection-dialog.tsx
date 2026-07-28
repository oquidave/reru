'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarCheck, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface SchedulableClient {
  id: string
  name: string
  address: string | null
  collection_day: string | null
}

interface AdminScheduleCollectionDialogProps {
  clients: SchedulableClient[]
  /** Date the page is currently showing; pre-fills the picker. */
  defaultDate: string
}

export function AdminScheduleCollectionDialog({ clients, defaultDate }: AdminScheduleCollectionDialogProps) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [date, setDate]       = useState(defaultDate)
  const [query, setQuery]     = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.address ?? '').toLowerCase().includes(q)
    )
  }, [clients, query])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllVisible() {
    const visibleIds = filtered.map((c) => c.id)
    const allSelected = visibleIds.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of visibleIds) {
        if (allSelected) next.delete(id)
        else next.add(id)
      }
      return next
    })
  }

  function reset() {
    setSelected(new Set())
    setQuery('')
    setDate(defaultDate)
  }

  async function handleSubmit() {
    if (selected.size === 0) {
      toast.error('Select at least one client')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/collections', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ client_ids: [...selected], scheduled_date: date }),
      })
      const json = await res.json().catch(() => null) as
        | { ok: boolean; data?: { scheduled: number; already_scheduled: number }; error?: string }
        | null

      if (!json || !json.ok) {
        toast.error(json?.error ?? 'Failed to schedule collections. Please try again.')
        return
      }

      const { scheduled = 0, already_scheduled = 0 } = json.data ?? {}
      if (scheduled === 0) {
        toast.success('Those clients were already scheduled for this date')
      } else {
        toast.success(`${scheduled} collection${scheduled === 1 ? '' : 's'} scheduled for ${date}`)
      }
      if (already_scheduled > 0 && scheduled > 0) {
        toast.info(`${already_scheduled} already had a collection on this date`)
      }

      setOpen(false)
      reset()
      router.refresh()
    } catch {
      toast.error('Could not reach the server. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const allVisibleSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id))

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2">
          <CalendarCheck size={14} /> Schedule collection
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule a collection</DialogTitle>
          <DialogDescription>
            Pick a date and the clients to collect from. Clients already scheduled for that date are left as they are.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="schedule-date">Date</Label>
            <Input
              id="schedule-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Clients ({selected.size} selected)</Label>
              {filtered.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAllVisible}
                  className="text-sm font-medium text-green-700 hover:text-green-600 transition-colors"
                >
                  {allVisibleSelected ? 'Clear all' : 'Select all'}
                </button>
              )}
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-reru-text-muted" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or address…"
                className="pl-9"
              />
            </div>

            <div className="max-h-64 overflow-y-auto rounded-lg border border-reru-border divide-y divide-reru-border">
              {clients.length === 0 ? (
                <p className="px-3 py-6 text-sm text-center text-reru-text-muted">No active clients.</p>
              ) : filtered.length === 0 ? (
                <p className="px-3 py-6 text-sm text-center text-reru-text-muted">
                  No clients match &quot;{query}&quot;.
                </p>
              ) : (
                filtered.map((client) => (
                  <label
                    key={client.id}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-green-50 transition-colors"
                  >
                    <Checkbox
                      checked={selected.has(client.id)}
                      onCheckedChange={() => toggle(client.id)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-reru-text-primary truncate">
                        {client.name}
                      </span>
                      <span className="block text-xs text-reru-text-muted truncate">
                        {client.address || 'No address'}
                        {client.collection_day ? ` · usual: ${client.collection_day}` : ' · no collection day'}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || selected.size === 0}>
            {loading ? 'Scheduling…' : `Schedule ${selected.size || ''}`.trim()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
