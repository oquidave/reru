'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { normalizeUgPhone } from '@/lib/phone'
import type { ServiceLocation } from '@/types'

const schema = z.object({
  location_id:    z.string().uuid().optional().or(z.literal('')),
  other_location: z.string().max(200).optional().or(z.literal('')),
  plan:           z.enum(['monthly', 'annual']),
  collection_day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  address:        z.string().min(5, 'Tell us your street / house address'),
  landmark:       z.string().optional(),
  property_type:  z.enum(['household', 'business']),
  bin_count:      z.coerce.number().int().min(1, 'At least 1 bin').max(100),
  alt_phone:      z.string().optional().refine(v => !v || normalizeUgPhone(v) !== null, 'Enter a valid Ugandan number'),
  alt_phone_is_whatsapp: z.boolean().optional(),
  email:          z.string().email('Enter a valid email').optional().or(z.literal('')),
  password:       z.string().min(6, 'At least 6 characters').optional().or(z.literal('')),
}).refine(
  d => (d.location_id && d.location_id.length > 0) || (d.other_location && d.other_location.trim().length > 0),
  { message: 'Select your location or describe it below', path: ['location_id'] }
)

type FormData = z.infer<typeof schema>

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

const PLANS = [
  { id: 'monthly' as const, price: 'UGX 25,000', period: '/month', note: 'Flexible, cancel anytime' },
  { id: 'annual' as const, price: 'UGX 240,000', period: '/year', note: 'Saves UGX 60,000', tag: 'Best Value' },
]

export function OnboardingForm({ locations }: { locations: ServiceLocation[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      location_id: '',
      other_location: '',
      plan: 'monthly',
      collection_day: 'Wednesday',
      property_type: 'household',
      bin_count: 1,
      alt_phone_is_whatsapp: false,
    },
  })

  const locationId = watch('location_id')
  const plan = watch('plan')
  const propertyType = watch('property_type')

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok || !result.ok) {
        toast.error(result.error ?? 'Could not save your profile. Please try again.')
        setLoading(false)
        return
      }
      toast.success('You\'re all set! Welcome to RERU.')
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-reru-border shadow-card p-8 space-y-6">
      <div>
        <h1 className="reru-h1 text-reru-text-primary">Complete your profile</h1>
        <p className="reru-body text-reru-text-secondary mt-1">
          A few details so we can schedule your collections.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Location pills */}
        <div className="space-y-2">
          <Label className="reru-label text-reru-text-secondary">Where do you stay?</Label>
          <div className="flex flex-wrap gap-2">
            {locations.map(loc => (
              <button
                key={loc.id}
                type="button"
                onClick={() => {
                  setValue('location_id', loc.id, { shouldValidate: true })
                  setValue('other_location', '', { shouldValidate: true })
                }}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-sm font-medium border-[1.5px] transition-all',
                  locationId === loc.id
                    ? 'border-green-700 bg-green-50 text-green-700'
                    : 'border-reru-border bg-white text-reru-text-secondary hover:border-green-200'
                )}
              >
                {loc.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setValue('location_id', '', { shouldValidate: true })
                setValue('other_location', ' ', { shouldValidate: true })
              }}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-sm font-medium border-[1.5px] transition-all',
                !locationId
                  ? 'border-green-700 bg-green-50 text-green-700'
                  : 'border-reru-border bg-white text-reru-text-secondary hover:border-green-200'
              )}
            >
              Other
            </button>
          </div>
          {!locationId && (
            <Input
              {...register('other_location')}
              placeholder="Describe your area or neighbourhood"
              className="mt-2"
              autoFocus
            />
          )}
          {errors.location_id && <p className="text-xs text-reru-danger">{errors.location_id.message}</p>}
        </div>

        {/* Address + landmark */}
        <div className="space-y-1.5">
          <Label className="reru-label text-reru-text-secondary">Street / house address</Label>
          <Input {...register('address')} placeholder="Plot 12, Kabaka Road" />
          {errors.address && <p className="text-xs text-reru-danger">{errors.address.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label className="reru-label text-reru-text-secondary">Nearest landmark (optional)</Label>
          <Input {...register('landmark')} placeholder="e.g. opposite Total petrol station" />
        </div>

        {/* Plan */}
        <div className="space-y-2">
          <Label className="reru-label text-reru-text-secondary">Choose a plan</Label>
          <div className="grid grid-cols-2 gap-3">
            {PLANS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setValue('plan', p.id)}
                className={cn(
                  'relative text-left p-4 rounded-xl border-[1.5px] transition-all',
                  plan === p.id ? 'border-green-700 bg-green-50' : 'border-reru-border bg-white hover:border-green-200'
                )}
              >
                {p.tag && (
                  <span className="absolute -top-2.5 right-3 text-xs font-bold px-2 py-0.5 rounded-full bg-reru-accent text-white reru-overline">
                    {p.tag}
                  </span>
                )}
                <p className="font-bold text-xl text-reru-text-primary">{p.price}</p>
                <p className="text-sm text-reru-text-muted">{p.period}</p>
                <p className="text-xs text-reru-text-secondary mt-1">{p.note}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Collection day */}
        <div className="space-y-1.5">
          <Label className="reru-label text-reru-text-secondary">Preferred collection day</Label>
          <select
            {...register('collection_day')}
            className="w-full h-10 rounded-md border border-reru-border bg-reru-bg px-3 text-md text-reru-text-primary focus:outline-none focus:border-green-500 focus:bg-white transition-all"
          >
            {DAYS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

        {/* Property type + bins */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="reru-label text-reru-text-secondary">Property type</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['household', 'business'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue('property_type', t)}
                  className={cn(
                    'h-10 rounded-md text-sm font-medium border-[1.5px] capitalize transition-all',
                    propertyType === t ? 'border-green-700 bg-green-50 text-green-700' : 'border-reru-border bg-white text-reru-text-secondary'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="reru-label text-reru-text-secondary">Number of bins</Label>
            <Input {...register('bin_count')} type="number" min={1} max={100} />
            {errors.bin_count && <p className="text-xs text-reru-danger">{errors.bin_count.message}</p>}
          </div>
        </div>

        {/* Alternate contact */}
        <div className="space-y-1.5">
          <Label className="reru-label text-reru-text-secondary">Alternate contact (optional)</Label>
          <Input {...register('alt_phone')} type="tel" placeholder="07XX XXX XXX" />
          {errors.alt_phone && <p className="text-xs text-reru-danger">{errors.alt_phone.message}</p>}
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input type="checkbox" className="accent-green-700" {...register('alt_phone_is_whatsapp')} />
            <span className="text-sm text-reru-text-secondary">This number is on WhatsApp</span>
          </label>
        </div>

        {/* Optional email + password */}
        <div className="rounded-lg bg-green-50 border border-reru-border p-4 space-y-3">
          <p className="text-sm text-reru-text-secondary">
            Add an email and password so you can sign in without an SMS code (and get invoices by email).
            <span className="text-reru-text-muted"> Optional.</span>
          </p>
          <div className="space-y-1.5">
            <Label className="reru-label text-reru-text-secondary">Email</Label>
            <Input {...register('email')} type="email" placeholder="you@example.com" />
            {errors.email && <p className="text-xs text-reru-danger">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="reru-label text-reru-text-secondary">Password</Label>
            <Input {...register('password')} type="password" placeholder="At least 6 characters" />
            {errors.password && <p className="text-xs text-reru-danger">{errors.password.message}</p>}
          </div>
        </div>

        <Button type="submit" className="w-full bg-green-700 hover:bg-green-600 text-white" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
          Finish & continue
        </Button>
      </form>
    </div>
  )
}
