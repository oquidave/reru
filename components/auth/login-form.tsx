'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { normalizeUgPhone } from '@/lib/phone'
import { OtpVerify } from './otp-verify'

type Method = 'password' | 'otp'

export function LoginForm() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [method, setMethod] = useState<Method>('password')

  // Password method state
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // OTP method state
  const [otpPhone, setOtpPhone] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  function goToDashboard() {
    router.push('/dashboard')
    router.refresh()
  }

  async function loginWithPassword(e: React.FormEvent) {
    e.preventDefault()
    const id = identifier.trim()
    if (!id || !password) {
      toast.error('Enter your phone or email and password')
      return
    }
    // Email vs phone: emails contain "@"; everything else is treated as a Ugandan phone.
    const credentials = id.includes('@')
      ? { email: id, password }
      : (() => {
          const phone = normalizeUgPhone(id)
          return phone ? { phone, password } : null
        })()

    if (!credentials) {
      toast.error('Enter a valid phone number or email')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword(credentials)
    setLoading(false)
    if (error) {
      toast.error('Invalid credentials. Please try again.')
      return
    }
    goToDashboard()
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault()
    const phone = normalizeUgPhone(otpPhone)
    if (!phone) {
      toast.error('Enter a valid Ugandan phone number')
      return
    }
    setSending(true)
    // Don't create an account from the login screen — only existing users get a code.
    const { error } = await supabase.auth.signInWithOtp({ phone, options: { shouldCreateUser: false } })
    setSending(false)
    if (error) {
      toast.error('Could not send a code to that number. Check it and try again.')
      return
    }
    setSentTo(phone)
  }

  return (
    <div className="bg-white rounded-xl border border-reru-border shadow-card p-8 space-y-6">
      <div>
        <h1 className="reru-h1 text-reru-text-primary">Welcome back</h1>
        <p className="reru-body text-reru-text-secondary mt-1">Sign in to your RERU account</p>
      </div>

      {sentTo ? (
        <OtpVerify phone={sentTo} onVerified={goToDashboard} onBack={() => setSentTo(null)} />
      ) : (
        <>
          {/* Method tabs — password is primary (no SMS cost). */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-green-50">
            {(['password', 'otp'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={cn(
                  'h-9 rounded-md text-sm font-semibold transition-all',
                  method === m ? 'bg-white text-green-700 shadow-sm' : 'text-reru-text-secondary'
                )}
              >
                {m === 'password' ? 'Password' : 'SMS code'}
              </button>
            ))}
          </div>

          {method === 'password' ? (
            <form onSubmit={loginWithPassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="reru-label text-reru-text-secondary">Phone or email</Label>
                <Input
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="07XX XXX XXX or you@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="reru-label text-reru-text-secondary">Password</Label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-reru-text-muted" />
                  <Input
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    type="password"
                    placeholder="Enter your password"
                    className="pl-9"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-green-700 hover:bg-green-600 text-white" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Sign in
              </Button>
            </form>
          ) : (
            <form onSubmit={sendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="reru-label text-reru-text-secondary">Phone number</Label>
                <Input
                  value={otpPhone}
                  onChange={e => setOtpPhone(e.target.value)}
                  type="tel"
                  placeholder="07XX XXX XXX"
                />
              </div>
              <Button type="submit" className="w-full bg-green-700 hover:bg-green-600 text-white" disabled={sending}>
                {sending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Send code
              </Button>
            </form>
          )}
        </>
      )}

      <p className="text-center reru-caption">
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" className="text-green-700 font-semibold hover:underline">
          Register
        </Link>
      </p>
    </div>
  )
}
