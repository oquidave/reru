import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClientWithServiceRole } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'

const registerSchema = z.object({
  name:           z.string().min(2).max(200),
  email:          z.string().email(),
  phone:          z.string().min(10).max(20),
  address:        z.string().min(5).max(500),
  zone:           z.enum(['Zone A', 'Zone B', 'Zone C']),
  collection_day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
  plan:           z.enum(['monthly', 'annual']),
  password:       z.string().min(6).max(100),
})

export async function POST(request: Request): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  try {
    const body = await request.json() as unknown
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? 'Invalid input'
      return NextResponse.json({ ok: false, error: message }, { status: 400 })
    }

    const { name, email, phone, address, zone, collection_day, plan, password } = parsed.data
    const supabase = await createSupabaseServerClientWithServiceRole()

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    })

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        return NextResponse.json({ ok: false, error: 'This email address is already registered.' }, { status: 409 })
      }
      console.error('[POST /api/auth/register] createUser error', authError)
      return NextResponse.json({ ok: false, error: 'Failed to create account. Please try again.' }, { status: 400 })
    }

    const { error: clientError } = await supabase
      .from('reru_clients')
      .insert({
        user_id: authData.user.id,
        name,
        phone,
        address,
        zone,
        collection_day,
        plan,
        status: 'active',
      })

    if (clientError) {
      console.error('[POST /api/auth/register] reru_clients insert error', clientError)
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ ok: false, error: 'Failed to create account. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data: { message: 'Account created' } })
  } catch {
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
