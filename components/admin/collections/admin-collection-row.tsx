'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, MessageSquare, Minus, Plus } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

interface CollectionRowData {
  id: string
  status: string
  notes: string | null
  bags_collected: number | null
  client_name: string
  client_address: string
  client_phone: string
}

interface AdminCollectionRowProps {
  collection: CollectionRowData
}

const MAX_BAGS = 100

export function AdminCollectionRow({ collection }: AdminCollectionRowProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'completed' | 'missed' | 'notes' | 'bags' | null>(null)
  const [notesValue, setNotesValue] = useState(collection.notes ?? '')
  const [notesOpen, setNotesOpen] = useState(false)
  const [bags, setBags] = useState(collection.bags_collected ?? 1)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [editBagsOpen, setEditBagsOpen] = useState(false)

  async function patch(body: Record<string, unknown>, successMessage: string, key: typeof loading) {
    setLoading(key)
    try {
      const res = await fetch(`/api/admin/collections/${collection.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      // A crashed route returns an empty body, so never assume the response is JSON.
      const json = await res.json().catch(() => null) as { ok: boolean; error?: string } | null
      if (!json || !json.ok) {
        toast.error(json?.error ?? 'Failed to update. Please try again.')
        return false
      }
      toast.success(successMessage)
      router.refresh()
      return true
    } catch {
      toast.error('Could not reach the server. Check your connection and try again.')
      return false
    } finally {
      setLoading(null)
    }
  }

  async function markCompleted() {
    const ok = await patch(
      { status: 'completed', bags_collected: bags },
      `Completed — ${bags} bag${bags === 1 ? '' : 's'} recorded`,
      'completed'
    )
    if (ok) setCompleteOpen(false)
  }

  async function markMissed() {
    await patch({ status: 'missed' }, 'Marked as missed', 'missed')
  }

  async function saveBags() {
    const ok = await patch(
      { bags_collected: bags },
      `${bags} bag${bags === 1 ? '' : 's'} recorded`,
      'bags'
    )
    if (ok) setEditBagsOpen(false)
  }

  async function saveNotes() {
    const ok = await patch({ notes: notesValue }, 'Notes saved', 'notes')
    if (ok) setNotesOpen(false)
  }

  const isDone = collection.status === 'completed' || collection.status === 'missed'

  /** Stepper shared by the "mark completed" and "edit bags" popovers. */
  function bagStepper() {
    return (
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setBags((b) => Math.max(0, b - 1))}
          disabled={bags <= 0}
          className="w-9 h-9 rounded-lg border border-reru-border flex items-center justify-center text-reru-text-secondary hover:border-green-300 hover:text-reru-text-primary disabled:opacity-40 transition-colors"
          aria-label="Decrease bag count"
        >
          <Minus size={15} />
        </button>
        <input
          type="number"
          min={0}
          max={MAX_BAGS}
          value={bags}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (Number.isFinite(n)) setBags(Math.min(MAX_BAGS, Math.max(0, Math.trunc(n))))
          }}
          className="w-16 h-10 rounded-lg border border-reru-border text-center text-lg font-bold text-reru-text-primary focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
          aria-label="Bags collected"
        />
        <button
          type="button"
          onClick={() => setBags((b) => Math.min(MAX_BAGS, b + 1))}
          disabled={bags >= MAX_BAGS}
          className="w-9 h-9 rounded-lg border border-reru-border flex items-center justify-center text-reru-text-secondary hover:border-green-300 hover:text-reru-text-primary disabled:opacity-40 transition-colors"
          aria-label="Increase bag count"
        >
          <Plus size={15} />
        </button>
      </div>
    )
  }

  return (
    <tr className="hover:bg-green-50 transition-colors duration-150 border-b border-reru-border last:border-b-0">
      <td className="px-5 py-3">
        <p className="text-sm font-semibold text-reru-text-primary">{collection.client_name}</p>
        <p className="text-xs text-reru-text-muted">{collection.client_address}</p>
      </td>
      <td className="px-5 py-3 text-sm text-reru-text-secondary">{collection.client_phone}</td>

      {/* Bags — editable in place once a collection is completed. */}
      <td className="px-5 py-3">
        {collection.status === 'completed' ? (
          <Popover
            open={editBagsOpen}
            onOpenChange={(next) => {
              setEditBagsOpen(next)
              if (next) setBags(collection.bags_collected ?? 1)
            }}
          >
            <PopoverTrigger asChild>
              <button
                className="text-sm font-semibold text-reru-text-primary hover:text-green-700 transition-colors underline decoration-dotted underline-offset-4"
                title="Edit bags collected"
              >
                {collection.bags_collected ?? '—'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3 space-y-3">
              <p className="text-xs font-semibold text-reru-text-muted">Bags collected</p>
              {bagStepper()}
              <Button size="sm" className="w-full" onClick={saveBags} disabled={loading === 'bags'}>
                {loading === 'bags' ? 'Saving…' : 'Save'}
              </Button>
            </PopoverContent>
          </Popover>
        ) : (
          <span className="text-sm text-reru-text-muted">—</span>
        )}
      </td>

      <td className="px-5 py-3">
        {collection.notes ? (
          <p className="text-xs text-reru-text-secondary max-w-[160px] truncate">{collection.notes}</p>
        ) : (
          <span className="text-xs text-reru-text-muted">—</span>
        )}
      </td>
      <td className="px-5 py-3"><StatusBadge status={collection.status} /></td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-1.5 justify-end">
          {/* Notes popover */}
          <Popover open={notesOpen} onOpenChange={setNotesOpen}>
            <PopoverTrigger asChild>
              <button
                className="p-1.5 rounded-md text-reru-text-muted hover:text-reru-text-primary hover:bg-green-100 transition-colors"
                title="Add a note"
              >
                <MessageSquare size={14} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 space-y-2">
              <p className="text-xs font-semibold text-reru-text-muted">Notes</p>
              <textarea
                rows={3}
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                className="w-full rounded-md border border-reru-border text-sm px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-green-600"
                placeholder="Add a note…"
              />
              <Button size="sm" className="w-full" onClick={saveNotes} disabled={loading === 'notes'}>
                {loading === 'notes' ? 'Saving…' : 'Save'}
              </Button>
            </PopoverContent>
          </Popover>

          {!isDone && (
            <>
              {/* Completing a collection captures the bag count in the same step —
                  it is the only moment the crew knows the number. */}
              <Popover
                open={completeOpen}
                onOpenChange={(next) => {
                  setCompleteOpen(next)
                  if (next) setBags(collection.bags_collected ?? 1)
                }}
              >
                <PopoverTrigger asChild>
                  <button
                    disabled={loading !== null}
                    className="p-1.5 rounded-md text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                    title="Mark completed"
                  >
                    <CheckCircle2 size={15} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-reru-text-muted">Bags collected</p>
                    <p className="text-xs text-reru-text-muted mt-0.5">{collection.client_name}</p>
                  </div>
                  {bagStepper()}
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={markCompleted}
                    disabled={loading === 'completed'}
                  >
                    {loading === 'completed' ? 'Saving…' : 'Mark completed'}
                  </Button>
                </PopoverContent>
              </Popover>

              <button
                onClick={markMissed}
                disabled={loading !== null}
                className="p-1.5 rounded-md text-reru-danger hover:bg-red-100 transition-colors disabled:opacity-50"
                title="Mark missed"
              >
                <XCircle size={15} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}
