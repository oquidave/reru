'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormData = z.infer<typeof schema>

export function LoginForm() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password })
    setLoading(false)

    if (error) {
      toast.error('Invalid email or password. Please try again.')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-reru-border shadow-card p-8 space-y-6">
      <div>
        <h1 className="reru-h1 text-reru-text-primary">Welcome back</h1>
        <p className="reru-body text-reru-text-secondary mt-1">Sign in to your RERU account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="reru-label text-reru-text-secondary">Email address</Label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-reru-text-muted" />
            <Input
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              className="pl-9"
            />
          </div>
          {errors.email && <p className="text-xs text-reru-danger">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="reru-label text-reru-text-secondary">Password</Label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-reru-text-muted" />
            <Input
              {...register('password')}
              type="password"
              placeholder="Enter your password"
              className="pl-9"
            />
          </div>
          {errors.password && <p className="text-xs text-reru-danger">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full bg-green-700 hover:bg-green-600 text-white" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
          Sign in
        </Button>
      </form>

      <p className="text-center reru-caption">
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" className="text-green-700 font-semibold hover:underline">
          Register
        </Link>
      </p>
    </div>
  )
}
