import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import type { User, Session } from '@supabase/supabase-js'

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
})

type RefreshData = {
  user: Pick<User, 'id' | 'email'>
  session: Pick<Session, 'access_token' | 'refresh_token' | 'expires_at'>
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<RefreshData>>> {
  try {
    const body = await request.json() as unknown
    const parsed = refreshSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'refresh_token is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: parsed.data.refresh_token })

    if (error || !data.session) {
      return NextResponse.json({ ok: false, error: 'Invalid or expired refresh token' }, { status: 401 })
    }

    return NextResponse.json({
      ok: true,
      data: {
        user: { id: data.user!.id, email: data.user!.email ?? '' },
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
