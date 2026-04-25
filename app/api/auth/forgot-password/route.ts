import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'
import type { ApiResponse } from '@/types/api'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  try {
    const body = await request.json() as unknown
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'A valid email address is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()

    // Always returns ok:true — never reveal whether the email exists
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${env.NEXT_PUBLIC_BASE_URL ?? 'https://reru.odukar.com'}/auth/reset-password`,
    })

    return NextResponse.json({ ok: true, data: { message: 'If that email is registered, a reset link has been sent.' } })
  } catch {
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
