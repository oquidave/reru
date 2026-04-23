'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PlusCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type TargetType = 'all' | 'specific'
type ClientOption = { id: string; name: string; zone: string }

export function AdminGenerateInvoicesDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [targetType, setTargetType] = useState<TargetType>('all')
  const [clients, setClients] = useState<ClientOption[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0] ?? '')
  const [plan, setPlan] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && targetType === 'specific' && clients.length === 0) {
      setLoadingClients(true)
      fetch('/api/admin/clients')
        .then((r) => r.json())
        .then((json: { ok: boolean; data?: ClientOption[] }) => {
          if (json.ok && json.data) setClients(json.data)
        })
        .finally(() => setLoadingClients(false))
    }
  }, [open, targetType, clients.length])

  function toggleClient(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleSubmit() {
    if (!date) { toast.error('Please select a date'); return }
    setLoading(true)
    try {
      const body: { date: string; plan: string; client_ids?: string[] } = { date, plan }
      if (targetType === 'specific') body.client_ids = selectedIds

      const res = await fetch('/api/admin/invoices', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const json = await res.json() as { ok: boolean; data?: { generated: number }; error?: string }

      if (!json.ok) {
        toast.error(json.error ?? 'Failed to generate invoices')
        return
      }

      toast.success(`${json.data?.generated ?? 0} invoice${json.data?.generated !== 1 ? 's' : ''} generated`)
      setOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  function handleClose(v: boolean) {
    setOpen(v)
    if (!v) { setStep(1); setTargetType('all'); setSelectedIds([]) }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="gap-2"><PlusCircle size={15} /> Generate invoices</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate invoices — step {step} of 2</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="mt-2 space-y-4">
            <div className="space-y-3">
              <Label>Who to invoice</Label>
              <div className="grid grid-cols-2 gap-3">
                {(['all', 'specific'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTargetType(t)}
                    className={`rounded-lg border px-4 py-3 text-sm font-medium text-left transition-all duration-150 ${targetType === t ? 'border-green-600 bg-green-50 text-green-800' : 'border-reru-border text-reru-text-secondary hover:border-green-300'}`}
                  >
                    {t === 'all' ? 'All active clients' : 'Specific clients'}
                  </button>
                ))}
              </div>
            </div>

            {targetType === 'specific' && (
              <div className="space-y-2 max-h-48 overflow-y-auto border border-reru-border rounded-lg p-3">
                {loadingClients ? (
                  <p className="text-sm text-reru-text-muted text-center py-2">Loading clients…</p>
                ) : clients.length === 0 ? (
                  <p className="text-sm text-reru-text-muted text-center py-2">No active clients found</p>
                ) : clients.map((c) => (
                  <label key={c.id} className="flex items-center gap-3 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(c.id)}
                      onChange={() => toggleClient(c.id)}
                      className="rounded border-reru-border text-green-700 focus:ring-green-600"
                    />
                    <span className="text-sm text-reru-text-primary">{c.name}</span>
                    <span className="text-xs text-reru-text-muted ml-auto">{c.zone}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={() => setStep(2)} disabled={targetType === 'specific' && selectedIds.length === 0}>
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-2 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="inv-date">Invoice date</Label>
              <Input
                id="inv-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select value={plan} onValueChange={(v) => setPlan(v as typeof plan)} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly — UGX 26,500 total</SelectItem>
                  <SelectItem value="annual">Annual — UGX 254,400 total</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>Back</Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Generating…' : 'Generate'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
