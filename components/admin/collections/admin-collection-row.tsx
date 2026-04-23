'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, MessageSquare } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

interface CollectionRowData {
  id: string
  status: string
  notes: string | null
  client_name: string
  client_address: string
  client_phone: string
}

interface AdminCollectionRowProps {
  collection: CollectionRowData
}

export function AdminCollectionRow({ collection }: AdminCollectionRowProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'completed' | 'missed' | 'notes' | null>(null)
  const [notesValue, setNotesValue] = useState(collection.notes ?? '')
  const [notesOpen, setNotesOpen] = useState(false)

  async function updateStatus(status: 'completed' | 'missed') {
    setLoading(status)
    try {
      const res = await fetch(`/api/admin/collections/${collection.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      })
      const json = await res.json() as { ok: boolean; error?: string }
      if (!json.ok) { toast.error(json.error ?? 'Failed to update'); return }
      toast.success(status === 'completed' ? 'Marked as completed' : 'Marked as missed')
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  async function saveNotes() {
    setLoading('notes')
    try {
      const res = await fetch(`/api/admin/collections/${collection.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ notes: notesValue }),
      })
      const json = await res.json() as { ok: boolean; error?: string }
      if (!json.ok) { toast.error(json.error ?? 'Failed to save notes'); return }
      toast.success('Notes saved')
      setNotesOpen(false)
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  const isDone = collection.status === 'completed' || collection.status === 'missed'

  return (
    <tr className="hover:bg-green-50 transition-colors duration-150 border-b border-reru-border last:border-b-0">
      <td className="px-5 py-3">
        <p className="text-sm font-semibold text-reru-text-primary">{collection.client_name}</p>
        <p className="text-xs text-reru-text-muted">{collection.client_address}</p>
      </td>
      <td className="px-5 py-3 text-sm text-reru-text-secondary">{collection.client_phone}</td>
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
              <button className="p-1.5 rounded-md text-reru-text-muted hover:text-reru-text-primary hover:bg-green-100 transition-colors">
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
              <button
                onClick={() => updateStatus('completed')}
                disabled={loading !== null}
                className="p-1.5 rounded-md text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                title="Mark completed"
              >
                <CheckCircle2 size={15} />
              </button>
              <button
                onClick={() => updateStatus('missed')}
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
