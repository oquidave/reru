'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Invoice, PaymentMethod } from '@/types'

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'mtn_momo',       label: 'MTN MoMo' },
  { value: 'airtel',         label: 'Airtel Money' },
  { value: 'bank_transfer',  label: 'Bank Transfer' },
  { value: 'cash',           label: 'Cash' },
]

interface AdminMarkPaidDialogProps {
  invoice: Invoice
}

export function AdminMarkPaidDialog({ invoice }: AdminMarkPaidDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
  const [paymentRef, setPaymentRef] = useState('')
  const [methodError, setMethodError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!paymentMethod) {
      setMethodError('Please select a payment method')
      return
    }
    setMethodError('')
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/invoices/${invoice.id}/mark-paid`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          payment_method: paymentMethod,
          payment_ref:    paymentRef.trim() || undefined,
        }),
      })
      const json = await res.json() as { ok: boolean; error?: string }

      if (!json.ok) {
        toast.error(json.error ?? 'Failed to mark as paid')
        return
      }

      toast.success('Invoice marked as paid')
      setOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setPaymentMethod(''); setPaymentRef(''); setMethodError('') } }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 border-green-600 text-green-700 hover:bg-green-50">
          <CheckCircle size={13} /> Mark paid
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Mark invoice as paid</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-4">
          <div className="space-y-1.5">
            <Label>Payment method *</Label>
            <Select
              value={paymentMethod}
              onValueChange={(v) => { setPaymentMethod(v as PaymentMethod); setMethodError('') }}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {methodError && <p className="text-sm text-reru-danger">{methodError}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ref">Reference / transaction ID <span className="text-reru-text-muted">(optional)</span></Label>
            <Input
              id="ref"
              placeholder="e.g. MTN ref, bank slip number"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving…' : 'Confirm payment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
