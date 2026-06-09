'use client'

import { useState } from 'react'
import { Loader2, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface OtpVerifyProps {
  /** E.164 phone the code was sent to. */
  phone: string
  /** Called after the OTP is successfully verified and a session exists. */
  onVerified: () => void
  /** Go back to the phone-entry step. */
  onBack: () => void
}

export function OtpVerify({ phone, onVerified, onBack }: OtpVerifyProps) {
  const supabase = createSupabaseBrowserClient()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  async function verify() {
    if (code.length !== 6) {
      toast.error('Enter the 6-digit code')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' })
    setLoading(false)
    if (error) {
      toast.error('That code is invalid or has expired. Please try again.')
      return
    }
    onVerified()
  }

  async function resend() {
    setResending(true)
    const { error } = await supabase.auth.signInWithOtp({ phone })
    setResending(false)
    if (error) {
      toast.error('Could not resend the code. Please try again shortly.')
      return
    }
    toast.success('A new code is on its way.')
  }

  return (
    <div className="space-y-4">
      <p className="reru-body text-reru-text-secondary">
        Enter the 6-digit code we sent to <span className="font-semibold text-reru-text-primary">{phone}</span>
      </p>
      <div className="space-y-1.5">
        <Label className="reru-label text-reru-text-secondary">Verification code</Label>
        <Input
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          className="tracking-[0.5em] text-center text-lg"
        />
      </div>
      <Button
        type="button"
        onClick={verify}
        className="w-full bg-green-700 hover:bg-green-600 text-white"
        disabled={loading}
      >
        {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
        Verify
      </Button>
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={onBack} className="text-reru-text-secondary px-2">
          <ChevronLeft size={16} className="mr-1" /> Change number
        </Button>
        <button
          type="button"
          onClick={resend}
          disabled={resending}
          className="text-sm text-green-700 font-semibold hover:underline disabled:opacity-50"
        >
          {resending ? 'Resending…' : 'Resend code'}
        </button>
      </div>
    </div>
  )
}
