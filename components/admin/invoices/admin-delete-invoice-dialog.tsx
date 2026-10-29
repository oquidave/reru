'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate, formatUGX } from '@/lib/utils'
import type { Invoice } from '@/types'

interface AdminDeleteInvoiceDialogProps {
  invoice: Invoice
  /** Where to go after deleting; omit to stay and refresh the current list. */
  redirectTo?: string
}

export function AdminDeleteInvoiceDialog({ invoice, redirectTo }: AdminDeleteInvoiceDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/invoices/${invoice.id}`, {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ reason: reason.trim() || undefined }),
      })
      const json = await res.json().catch(() => null) as { ok: boolean; error?: string } | null

      if (!json || !json.ok) {
        toast.error(json?.error ?? 'Failed to delete invoice. Please try again.')
        return
      }

      toast.success(`Invoice ${invoice.id} deleted`)
      setOpen(false)
      if (redirectTo) router.push(redirectTo)
      router.refresh()
    } catch {
      toast.error('Could not reach the server. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setReason('') }}>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-reru-danger hover:text-reru-danger hover:bg-red-50"
          aria-label={`Delete invoice ${invoice.id}`}
        >
          <Trash2 size={13} /> Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete invoice {invoice.id}?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the {formatUGX(invoice.total)} invoice dated {formatDate(invoice.date)} from
            the client&apos;s account. It cannot be undone, but a copy is kept in the audit log.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor={`delete-reason-${invoice.id}`}>
            Reason <span className="text-reru-text-muted">(optional)</span>
          </Label>
          <Input
            id={`delete-reason-${invoice.id}`}
            placeholder="e.g. duplicate, wrong plan"
            maxLength={200}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={loading}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          {/* A plain Button, not AlertDialogAction, so the dialog stays open on failure. */}
          <Button
            onClick={handleDelete}
            disabled={loading}
            className="bg-reru-danger hover:bg-reru-danger/90 text-white"
          >
            {loading ? 'Deleting…' : 'Delete invoice'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
