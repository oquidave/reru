'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatUGX } from '@/lib/utils'
import type { Client, ServiceLocation, PricingTier } from '@/types'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

const schema = z.object({
  address:        z.string().min(1, 'Address is required').max(500),
  location_id:    z.string().uuid('Select a location'),
  collection_day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  plan:           z.string().min(1, 'Select a plan'),
  custom_price:   z.coerce.number().int().min(0).nullable().optional(),
})

type FormValues = z.infer<typeof schema>

interface AdminEditClientDialogProps {
  client: Client
}

export function AdminEditClientDialog({ client }: AdminEditClientDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [locations, setLocations] = useState<ServiceLocation[]>([])
  const [tiers, setTiers] = useState<PricingTier[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      address:        client.address ?? '',
      location_id:    client.location_id ?? undefined,
      collection_day: (client.collection_day ?? 'Monday') as FormValues['collection_day'],
      plan:           client.plan ?? 'monthly',
      custom_price:   client.custom_price ?? null,
    },
  })

  const selectedPlan = form.watch('plan')
  const selectedTier = tiers.find((t) => t.slug === selectedPlan)
  const isCustomBilling = selectedTier?.billing_period === 'custom'

  useEffect(() => {
    if (!open) return
    if (locations.length === 0) {
      fetch('/api/admin/locations')
        .then((r) => r.json())
        .then((json: { ok: boolean; data?: ServiceLocation[] }) => {
          if (json.ok && json.data) setLocations(json.data.filter((l) => l.active))
        })
        .catch(() => {})
    }
    if (tiers.length === 0) {
      fetch('/api/admin/pricing')
        .then((r) => r.json())
        .then((json: { ok: boolean; data?: PricingTier[] }) => {
          if (json.ok && json.data) setTiers(json.data.filter((t) => t.is_active))
        })
        .catch(() => {})
    }
  }, [open, locations.length, tiers.length])

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ...values,
          custom_price: values.custom_price ?? null,
        }),
      })
      const json = await res.json() as { ok: boolean; error?: string }
      if (!json.ok) { toast.error(json.error ?? 'Failed to update client'); return }
      toast.success('Client updated')
      setOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  function tierLabel(tier: PricingTier): string {
    if (tier.price !== null) {
      return `${tier.name} — ${formatUGX(tier.price)}/${tier.billing_period}`
    }
    return `${tier.name} — price set per client`
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Pencil size={14} /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit client — {client.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...form.register('address')} disabled={loading} />
            {form.formState.errors.address && (
              <p className="text-sm text-reru-danger">{form.formState.errors.address.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Location</Label>
            <Select
              defaultValue={client.location_id ?? undefined}
              onValueChange={(v) => form.setValue('location_id', v)}
              disabled={loading}
            >
              <SelectTrigger><SelectValue placeholder="Select a location" /></SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.location_id && (
              <p className="text-sm text-reru-danger">{form.formState.errors.location_id.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Collection day</Label>
            <Select
              defaultValue={client.collection_day ?? 'Monday'}
              onValueChange={(v) => form.setValue('collection_day', v as FormValues['collection_day'])}
              disabled={loading}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Plan</Label>
            <Select
              defaultValue={client.plan ?? 'monthly'}
              onValueChange={(v) => form.setValue('plan', v)}
              disabled={loading}
            >
              <SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger>
              <SelectContent>
                {tiers.length === 0 && <SelectItem value={client.plan ?? 'monthly'}>{client.plan ?? 'monthly'}</SelectItem>}
                {tiers.map((t) => (
                  <SelectItem key={t.slug} value={t.slug}>{tierLabel(t)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom price — shown when the tier is custom billing OR admin wants to override */}
          <div className="space-y-1.5">
            <Label>
              Custom price (UGX)
              <span className="ml-1 text-reru-text-muted font-normal text-xs">
                {isCustomBilling ? '— required for this tier' : '— overrides tier price if set'}
              </span>
            </Label>
            <Input
              {...form.register('custom_price', { setValueAs: (v) => v === '' ? null : Number(v) })}
              type="number"
              min={0}
              placeholder={isCustomBilling ? 'Enter amount' : 'Leave blank to use tier price'}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
