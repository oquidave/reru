'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const step1Schema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(10, 'Enter a valid phone number'),
})

const step2Schema = z.object({
  address: z.string().min(5, 'Address is required'),
  zone: z.enum(['Zone A', 'Zone B', 'Zone C']),
  collection_day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
})

const step3Schema = z.object({
  plan: z.enum(['monthly', 'annual']),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  agreeTerms: z.literal(true, { errorMap: () => ({ message: 'You must accept the service agreement' }) }),
})

const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema)
type FormData = z.infer<typeof fullSchema>

const PLANS = [
  { id: 'monthly' as const, name: 'Monthly', price: 'UGX 25,000', period: '/month', note: 'Flexible, cancel anytime' },
  { id: 'annual' as const, name: 'Annual', price: 'UGX 240,000', period: '/year', note: 'Saves UGX 60,000 vs. monthly', tag: 'Best Value' },
]

export function RegisterForm() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, trigger, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(fullSchema),
    defaultValues: { plan: 'monthly', zone: 'Zone A', collection_day: 'Wednesday' },
  })

  const watchPlan = watch('plan')

  async function nextStep() {
    let valid = false
    if (step === 1) valid = await trigger(['name', 'email', 'phone'])
    if (step === 2) valid = await trigger(['address', 'zone', 'collection_day'])
    if (valid) setStep(s => s + 1)
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          zone: data.zone,
          collection_day: data.collection_day,
          plan: data.plan,
          password: data.password,
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error ?? 'Registration failed. Please try again.')
        setLoading(false)
        return
      }

      // Sign in after successful registration
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password })
      if (signInError) {
        toast.error('Account created but sign-in failed. Please log in manually.')
        router.push('/auth/login')
        return
      }
      toast.success('Welcome to RERU! Your account has been created.')
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-reru-border shadow-card p-8 space-y-6">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h1 className="reru-h1 text-reru-text-primary">Create account</h1>
          <span className="reru-caption">Step {step} of 3</span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3].map(s => (
            <div key={s} className={cn('h-1 flex-1 rounded-full transition-all duration-150', s <= step ? 'bg-green-700' : 'bg-green-100')} />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Step 1 */}
        {step === 1 && (
          <>
            <p className="reru-body text-reru-text-secondary">Tell us about yourself</p>
            <div className="space-y-1.5">
              <Label className="reru-label text-reru-text-secondary">Full name</Label>
              <Input {...register('name')} placeholder="e.g. Stephen Obbo" />
              {errors.name && <p className="text-xs text-reru-danger">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="reru-label text-reru-text-secondary">Email address</Label>
              <Input {...register('email')} type="email" placeholder="you@example.com" />
              {errors.email && <p className="text-xs text-reru-danger">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="reru-label text-reru-text-secondary">Phone number</Label>
              <Input {...register('phone')} type="tel" placeholder="07X XXX XXXX" />
              {errors.phone && <p className="text-xs text-reru-danger">{errors.phone.message}</p>}
            </div>
            <Button type="button" onClick={nextStep} className="w-full bg-green-700 hover:bg-green-600 text-white">
              Continue
            </Button>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <p className="reru-body text-reru-text-secondary">Your address and collection preferences</p>
            <div className="space-y-1.5">
              <Label className="reru-label text-reru-text-secondary">Residential address</Label>
              <Input {...register('address')} placeholder="Plot X, Nsasa Estate, Mukono" />
              {errors.address && <p className="text-xs text-reru-danger">{errors.address.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="reru-label text-reru-text-secondary">Collection zone</Label>
              <select
                {...register('zone')}
                className="w-full h-10 rounded-md border border-reru-border bg-reru-bg px-3 text-md text-reru-text-primary focus:outline-none focus:border-green-500 focus:bg-white transition-all"
              >
                <option>Zone A</option>
                <option>Zone B</option>
                <option>Zone C</option>
              </select>
              {errors.zone && <p className="text-xs text-reru-danger">{errors.zone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="reru-label text-reru-text-secondary">Preferred collection day</Label>
              <select
                {...register('collection_day')}
                className="w-full h-10 rounded-md border border-reru-border bg-reru-bg px-3 text-md text-reru-text-primary focus:outline-none focus:border-green-500 focus:bg-white transition-all"
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => (
                  <option key={d}>{d}</option>
                ))}
              </select>
              {errors.collection_day && <p className="text-xs text-reru-danger">{errors.collection_day.message}</p>}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 border-reru-border text-reru-text-secondary">
                <ChevronLeft size={16} className="mr-1" /> Back
              </Button>
              <Button type="button" onClick={nextStep} className="flex-1 bg-green-700 hover:bg-green-600 text-white">
                Continue
              </Button>
            </div>
          </>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <>
            <p className="reru-body text-reru-text-secondary">Choose your plan and set a password</p>

            {/* Plan selector */}
            <div className="grid grid-cols-2 gap-3">
              {PLANS.map(plan => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setValue('plan', plan.id)}
                  className={cn(
                    'relative text-left p-4 rounded-xl border-[1.5px] transition-all duration-150',
                    watchPlan === plan.id
                      ? 'border-green-700 bg-green-50'
                      : 'border-reru-border bg-white hover:border-green-200'
                  )}
                >
                  {plan.tag && (
                    <span className="absolute -top-2.5 right-3 text-xs font-bold px-2 py-0.5 rounded-full bg-reru-accent text-white reru-overline">
                      {plan.tag}
                    </span>
                  )}
                  <p className="font-bold text-xl text-reru-text-primary">{plan.price}</p>
                  <p className="text-sm text-reru-text-muted">{plan.period}</p>
                  <p className="text-xs text-reru-text-secondary mt-1">{plan.note}</p>
                </button>
              ))}
            </div>
            {errors.plan && <p className="text-xs text-reru-danger">{errors.plan.message}</p>}

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="reru-label text-reru-text-secondary">Create a password</Label>
              <Input {...register('password')} type="password" placeholder="At least 6 characters" />
              {errors.password && <p className="text-xs text-reru-danger">{errors.password.message}</p>}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 accent-green-700"
                onChange={e => setValue('agreeTerms', e.target.checked as true)}
              />
              <span className="text-sm text-reru-text-secondary">
                I agree to the{' '}
                <Link href="/dashboard/agreement" target="_blank" className="text-green-700 hover:underline font-semibold">
                  RERU Service Agreement
                </Link>
              </span>
            </label>
            {errors.agreeTerms && <p className="text-xs text-reru-danger">{errors.agreeTerms.message}</p>}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 border-reru-border text-reru-text-secondary" disabled={loading}>
                <ChevronLeft size={16} className="mr-1" /> Back
              </Button>
              <Button type="submit" className="flex-1 bg-green-700 hover:bg-green-600 text-white" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Create account
              </Button>
            </div>
          </>
        )}
      </form>

      <p className="text-center reru-caption">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-green-700 font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
