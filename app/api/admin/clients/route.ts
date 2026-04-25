import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { createSupabaseServerClientWithServiceRole } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

const addClientSchema = z.object({
  name:           z.string().min(2, 'Name must be at least 2 characters'),
  email:          z.string().email('Invalid email address'),
  phone:          z.string().min(10, 'Phone must be at least 10 characters'),
  address:        z.string().min(5, 'Address must be at least 5 characters'),
  zone:           z.enum(['Zone A', 'Zone B', 'Zone C']),
  collection_day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
  plan:           z.enum(['monthly', 'annual']),
})

export async function POST(request: Request) {
  const adminUser = await getAdminUser(request)
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json() as unknown
    const parsed = addClientSchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? 'Invalid input'
      return NextResponse.json({ ok: false, error: message }, { status: 400 })
    }

    const { name, email, phone, address, zone, collection_day, plan } = parsed.data
    const supabase = await createSupabaseServerClientWithServiceRole()

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: randomUUID(),
      email_confirm: true,
      user_metadata: { full_name: name },
    })

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        return NextResponse.json({ ok: false, error: 'This email address is already registered.' }, { status: 409 })
      }
      return NextResponse.json({ ok: false, error: authError.message }, { status: 400 })
    }

    const userId = authData.user.id

    const { data: clientRow, error: clientError } = await supabase
      .from('reru_clients')
      .insert({ user_id: userId, name, phone, address, zone, collection_day, plan, status: 'active' })
      .select()
      .single()

    if (clientError) {
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json({ ok: false, error: 'Failed to create client profile' }, { status: 500 })
    }

    // Send password-setup (recovery) link so the client can set their own password
    await supabase.auth.admin.generateLink({ type: 'recovery', email })

    await supabase.from('audit_logs').insert({
      admin_id:  adminUser.user.id,
      action:    'add_client',
      entity:    'client',
      entity_id: clientRow.id,
      new_value: clientRow,
    })

    return NextResponse.json({ ok: true, data: { id: clientRow.id, name } })
  } catch {
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const adminUser = await getAdminUser(request)
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { data: clients, error } = await adminUser.supabase
    .from('reru_clients')
    .select('id, name, zone')
    .eq('status', 'active')
    .order('name')

  if (error) {
    console.error('[GET /api/admin/clients]', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch clients' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, data: clients })
}
