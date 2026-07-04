'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatUGX } from '@/lib/utils'
import type { ServiceLocation, PricingTier } from '@/types'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

const step1Schema = z.object({
  name:  z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 characters'),
})

const step2Schema = z.object({
  address:        z.string().min(5, 'Address must be at least 5 characters'),
  location_id:    z.string().uuid('Select a location'),
  collection_day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  plan:           z.string().min(1, 'Select a plan'),
  custom_price:   z.coerce.number().int().min(0).nullable().optional(),
})

type Step1Values = z.infer<typeof step1Schema>
type Step2Values = z.infer<typeof step2Schema>

export function AdminAddClientDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null)
  const [loading, setLoading] = useState(false)
  const [locations, setLocations] = useState<ServiceLocation[]>([])
  const [tiers, setTiers] = useState<PricingTier[]>([])

  const form1 = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { name: '', email: '', phone: '' },
  })

  const form2 = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: { address: '', collection_day: 'Monday', plan: '' },
  })

  const selectedPlan = form2.watch('plan')
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

  function handleStep1(values: Step1Values) {
    setStep1Data(values)
    setStep(2)
  }

  async function handleStep2(values: Step2Values) {
    if (!step1Data) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/clients', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...step1Data, ...values }),
      })
      const json = await res.json() as { ok: boolean; error?: string }

      if (!json.ok) {
        if (res.status === 409) {
          toast.error('This email address is already registered.')
          setStep(1)
        } else {
          toast.error(json.error ?? 'Failed to add client')
        }
        return
      }

      toast.success('Client added. A password-setup email has been sent.')
      handleClose(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  function handleClose(v: boolean) {
    setOpen(v)
    if (!v) {
      setStep(1)
      setStep1Data(null)
      form1.reset()
      form2.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus size={15} /> Add client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add client — step {step} of 2</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <form onSubmit={form1.handleSubmit(handleStep1)} className="mt-2 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="add-name">Full name</Label>
              <Input id="add-name" {...form1.register('name')} autoComplete="off" />
              {form1.formState.errors.name && (
                <p className="text-sm text-reru-danger">{form1.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-email">Email address</Label>
              <Input id="add-email" type="email" {...form1.register('email')} autoComplete="off" />
              {form1.formState.errors.email && (
                <p className="text-sm text-reru-danger">{form1.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-phone">Phone number</Label>
              <Input id="add-phone" type="tel" {...form1.register('phone')} autoComplete="off" />
              {form1.formState.errors.phone && (
                <p className="text-sm text-reru-danger">{form1.formState.errors.phone.message}</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit">Next</Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={form2.handleSubmit(handleStep2)} className="mt-2 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="add-address">Residential address</Label>
              <Input id="add-address" {...form2.register('address')} disabled={loading} autoComplete="off" />
              {form2.formState.errors.address && (
                <p className="text-sm text-reru-danger">{form2.formState.errors.address.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Location</Label>
              <Select
                onValueChange={(v) => form2.setValue('location_id', v)}
                disabled={loading}
              >
                <SelectTrigger><SelectValue placeholder="Select a location" /></SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form2.formState.errors.location_id && (
                <p className="text-sm text-reru-danger">{form2.formState.errors.location_id.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Collection day</Label>
              <Select
                defaultValue="Monday"
                onValueChange={(v) => form2.setValue('collection_day', v as Step2Values['collection_day'])}
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
                onValueChange={(v) => form2.setValue('plan', v)}
                disabled={loading}
              >
                <SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger>
                <SelectContent>
                  {tiers.map((t) => (
                    <SelectItem key={t.slug} value={t.slug}>
                      {t.name}{t.price !== null ? ` — ${formatUGX(t.price)}/${t.billing_period}` : ' — price per client'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form2.formState.errors.plan && (
                <p className="text-sm text-reru-danger">{form2.formState.errors.plan.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>
                Custom price (UGX)
                <span className="ml-1 text-reru-text-muted font-normal text-xs">
                  {isCustomBilling ? '— required for this tier' : '— optional override'}
                </span>
              </Label>
              <Input
                {...form2.register('custom_price', { setValueAs: (v) => v === '' ? null : Number(v) })}
                type="number"
                min={0}
                placeholder={isCustomBilling ? 'Enter amount' : 'Leave blank to use tier price'}
                disabled={loading}
              />
            </div>

            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={loading}>
                Back
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding…' : 'Add client'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
