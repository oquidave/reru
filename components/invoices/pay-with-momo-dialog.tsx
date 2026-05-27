'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, Smartphone, XCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { formatUGX } from '@/lib/utils'
import type { ApiResponse } from '@/types/api'
import type { Invoice, Payment, PaymentStatus } from '@/types'

type Phase = 'form' | 'processing' | 'success' | 'failed'

const POLL_INTERVAL_MS = 4000
const POLL_TIMEOUT_MS = 120_000

interface PayWithMomoDialogProps {
  invoice: Invoice
  defaultPhone: string
}

export function PayWithMomoDialog({ invoice, defaultPhone }: PayWithMomoDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState(defaultPhone)
  const [phase, setPhase] = useState<Phase>('form')
  const [error, setError] = useState('')
  // Increments on every reset/close so any in-flight polling loop bails out.
  const runRef = useRef(0)

  function reset() {
    runRef.current += 1
    setPhase('form')
    setError('')
    setPhone(defaultPhone)
  }

  async function pollUntilDone(paymentId: string, runId: number) {
    const deadline = Date.now() + POLL_TIMEOUT_MS
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
      if (runRef.current !== runId) return // dialog closed / reset

      const res = await fetch(`/api/user/payments/${paymentId}`)
      const json = (await res.json()) as ApiResponse<Payment>
      if (runRef.current !== runId) return
      if (!json.ok) continue

      const status: PaymentStatus = json.data.status
      if (status === 'success') {
        setPhase('success')
        router.refresh()
        return
      }
      if (status === 'failed' || status === 'cancelled') {
        setError(json.data.error_message ?? 'The payment was not completed.')
        setPhase('failed')
        return
      }
    }
    setError('Timed out waiting for confirmation. If you approved the prompt, refresh shortly.')
    setPhase('failed')
  }

  async function handlePay() {
    const trimmed = phone.replace(/\s+/g, '')
    if (trimmed.length < 9) {
      setError('Enter a valid mobile money number')
      return
    }
    setError('')
    setPhase('processing')
    const runId = runRef.current

    try {
      const res = await fetch(`/api/user/invoices/${invoice.id}/pay`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone: trimmed }),
      })
      const json = (await res.json()) as ApiResponse<{ paymentId: string; status: PaymentStatus }>
      if (runRef.current !== runId) return

      if (!json.ok) {
        setError(json.error)
        setPhase('failed')
        return
      }

      if (json.data.status === 'failed' || json.data.status === 'cancelled') {
        setError('The payment could not be started. Please try again.')
        setPhase('failed')
        return
      }

      await pollUntilDone(json.data.paymentId, runId)
    } catch {
      if (runRef.current !== runId) return
      setError('Network error. Please try again.')
      setPhase('failed')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button className="bg-green-700 hover:bg-green-600 text-white gap-2">
          <Smartphone size={16} /> Pay with Mobile Money
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Pay {formatUGX(invoice.total)}</DialogTitle>
        </DialogHeader>

        {phase === 'form' && (
          <div className="mt-2 space-y-4">
            <p className="text-sm text-reru-text-secondary">
              You will receive a prompt on your phone to approve the payment via MTN MoMo or Airtel Money.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="momo-phone">Mobile money number</Label>
              <Input
                id="momo-phone"
                inputMode="tel"
                placeholder="07XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              {error && <p className="text-sm text-reru-danger">{error}</p>}
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handlePay} className="bg-green-700 hover:bg-green-600 text-white">
                Pay {formatUGX(invoice.total)}
              </Button>
            </div>
          </div>
        )}

        {phase === 'processing' && (
          <div className="mt-2 flex flex-col items-center gap-3 py-6 text-center">
            <Loader2 size={36} className="animate-spin text-green-700" />
            <p className="font-semibold text-reru-text-primary">Check your phone</p>
            <p className="text-sm text-reru-text-secondary">
              Approve the payment prompt on {phone.replace(/\s+/g, '')}. This can take a few moments.
            </p>
          </div>
        )}

        {phase === 'success' && (
          <div className="mt-2 flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 size={36} className="text-green-700" />
            <p className="font-semibold text-reru-text-primary">Payment received</p>
            <p className="text-sm text-reru-text-secondary">Your invoice is now marked as paid.</p>
            <Button className="bg-green-700 hover:bg-green-600 text-white" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        )}

        {phase === 'failed' && (
          <div className="mt-2 flex flex-col items-center gap-3 py-6 text-center">
            <XCircle size={36} className="text-reru-danger" />
            <p className="font-semibold text-reru-text-primary">Payment not completed</p>
            <p className="text-sm text-reru-text-secondary">{error}</p>
            <Button variant="outline" onClick={reset}>Try again</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
