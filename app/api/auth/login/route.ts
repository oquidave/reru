import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import type { User, Session } from '@supabase/supabase-js'

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1).max(100),
})

type LoginData = {
  user: Pick<User, 'id' | 'email'>
  session: Pick<Session, 'access_token' | 'refresh_token' | 'expires_at'>
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<LoginData>>> {
  try {
    const body = await request.json() as unknown
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? 'Invalid input'
      return NextResponse.json({ ok: false, error: message }, { status: 400 })
    }

    const { email, password } = parsed.data
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.session) {
      return NextResponse.json({ ok: false, error: 'Invalid email or password' }, { status: 401 })
    }

    return NextResponse.json({
      ok: true,
      data: {
        user: { id: data.user.id, email: data.user.email ?? '' },
        session: {
          access_token:  data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at:    data.session.expires_at,
        },
      },
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
