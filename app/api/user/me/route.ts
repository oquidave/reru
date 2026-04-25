import { NextResponse } from 'next/server'
import { getCurrentClient } from '@/lib/auth/get-current-client'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import type { Client, Profile } from '@/types'

type MeData = { client: Client; profile: Pick<Profile, 'role' | 'full_name'> }

export async function GET(): Promise<NextResponse<ApiResponse<MeData>>> {
  const current = await getCurrentClient()
  if (!current) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createSupabaseServerClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('user_id', current.user.id)
    .single()

  if (error) {
    console.error('[GET /api/user/me] profiles query error', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch profile' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    data: { client: current.client, profile: profile as Pick<Profile, 'role' | 'full_name'> },
  })
}
