'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ShieldAlert, ShieldCheck } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { Client } from '@/types'

interface AdminSuspendDialogProps {
  client: Client
}

export function AdminSuspendDialog({ client }: AdminSuspendDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [loading, setLoading] = useState(false)

  const isSuspended = client.status === 'suspended'
  const action = isSuspended ? 'reactivate' : 'suspend'
  const actionLabel = isSuspended ? 'Reactivate account' : 'Suspend account'

  async function handleSubmit() {
    if (reason.trim().length < 10) {
      setReasonError('Reason must be at least 10 characters')
      return
    }
    setReasonError('')
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/clients/${client.id}/suspend`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action, reason: reason.trim() }),
      })
      const json = await res.json() as { ok: boolean; error?: string }

      if (!json.ok) {
        toast.error(json.error ?? 'Action failed')
        return
      }

      toast.success(isSuspended ? 'Account reactivated' : 'Account suspended')
      setOpen(false)
      setReason('')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setReason(''); setReasonError('') } }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 ${isSuspended ? 'border-green-600 text-green-700 hover:bg-green-50' : 'border-reru-danger text-reru-danger hover:bg-red-50'}`}
        >
          {isSuspended
            ? <><ShieldCheck size={14} /> Reactivate</>
            : <><ShieldAlert size={14} /> Suspend</>
          }
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{actionLabel} — {client.name}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-4">
          <p className="reru-body text-reru-text-secondary">
            {isSuspended
              ? 'Reactivating this account will restore the client\'s access to their dashboard and resume collection scheduling.'
              : 'Suspending this account will prevent the client from accessing their dashboard. Please provide a reason for the record.'
            }
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason *</Label>
            <textarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              placeholder="Provide a reason (minimum 10 characters)"
              className="w-full rounded-lg border border-reru-border px-3 py-2 text-sm text-reru-text-primary placeholder:text-reru-text-muted focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 transition-colors duration-150 resize-none"
            />
            {reasonError && <p className="text-sm text-reru-danger">{reasonError}</p>}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className={isSuspended ? '' : 'bg-reru-danger hover:bg-reru-danger/90'}
            >
              {loading ? 'Processing…' : actionLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
