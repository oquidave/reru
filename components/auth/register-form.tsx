'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { normalizeUgPhone } from '@/lib/phone'
import { OtpVerify } from './otp-verify'

const schema = z.object({
  name: z.string().min(2, 'Full name is required'),
  phone: z.string().refine(v => normalizeUgPhone(v) !== null, 'Enter a valid Ugandan phone number'),
})

type FormData = z.infer<typeof schema>

export function RegisterForm() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    const phone = normalizeUgPhone(data.phone)
    if (!phone) {
      toast.error('Enter a valid Ugandan phone number')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { data: { full_name: data.name.trim() }, shouldCreateUser: true },
    })
    setLoading(false)
    if (error) {
      toast.error('Could not send the verification code. Please try again.')
      return
    }
    setSentTo(phone)
  }

  function handleVerified() {
    // New users land on onboarding; middleware enforces this too.
    router.push('/onboarding')
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-reru-border shadow-card p-8 space-y-6">
      <div>
        <h1 className="reru-h1 text-reru-text-primary">Create account</h1>
        <p className="reru-body text-reru-text-secondary mt-1">
          {sentTo ? 'Confirm your number to continue' : 'Sign up with your phone number'}
        </p>
      </div>

      {sentTo ? (
        <OtpVerify phone={sentTo} onVerified={handleVerified} onBack={() => setSentTo(null)} />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="reru-label text-reru-text-secondary">Full name</Label>
            <Input {...register('name')} placeholder="e.g. Stephen Obbo" />
            {errors.name && <p className="text-xs text-reru-danger">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="reru-label text-reru-text-secondary">Phone number</Label>
            <Input {...register('phone')} type="tel" placeholder="07XX XXX XXX" />
            {errors.phone && <p className="text-xs text-reru-danger">{errors.phone.message}</p>}
          </div>
          <Button type="submit" className="w-full bg-green-700 hover:bg-green-600 text-white" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            Send verification code
          </Button>
        </form>
      )}

      <p className="text-center reru-caption">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-green-700 font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
