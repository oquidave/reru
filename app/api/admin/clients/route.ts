import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { createSupabaseServerClientWithServiceRole } from '@/lib/supabase/server'
import { normalizeUgPhone } from '@/lib/phone'

const addClientSchema = z.object({
  name:           z.string().min(2, 'Name must be at least 2 characters'),
  email:          z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  phone:          z.string().refine((v) => normalizeUgPhone(v) !== null, 'Enter a valid Ugandan phone number'),
  address:        z.string().min(5, 'Address must be at least 5 characters'),
  location_id:    z.string().uuid('Select a location'),
  collection_day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  plan:           z.string().min(1, 'Select a plan'),
  custom_price:   z.coerce.number().int().min(0).nullable().optional(),
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

    const { name, address, location_id, collection_day, plan } = parsed.data
    const phone = normalizeUgPhone(parsed.data.phone)
    if (!phone) {
      return NextResponse.json({ ok: false, error: 'Enter a valid Ugandan phone number' }, { status: 400 })
    }
    const email = parsed.data.email || undefined
    const supabase = await createSupabaseServerClientWithServiceRole()

    // Same login account self sign-up produces: a phone-auth user, already confirmed,
    // so the client signs in with an SMS code. Email is an optional extra login.
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      phone,
      phone_confirm: true,
      ...(email ? { email, email_confirm: true } : {}),
      // `app` marks the login as Reru's; other apps' triggers on this shared project skip it.
      user_metadata: { full_name: name, app: 'reru' },
    })

    if (authError) {
      if (authError.code === 'phone_exists') {
        return NextResponse.json({ ok: false, error: 'This phone number is already registered.' }, { status: 409 })
      }
      if (authError.code === 'email_exists') {
        return NextResponse.json({ ok: false, error: 'This email address is already registered.' }, { status: 409 })
      }
      console.error('[POST /api/admin/clients] createUser', authError)
      return NextResponse.json({ ok: false, error: 'Failed to create client account' }, { status: 500 })
    }

    const userId = authData.user.id

    const { custom_price } = parsed.data
    const { data: clientRow, error: clientError } = await supabase
      .from('reru_clients')
      .insert({ user_id: userId, name, phone, address, location_id, collection_day, plan, custom_price: custom_price ?? null, status: 'active' })
      .select()
      .single()

    if (clientError) {
      console.error('[POST /api/admin/clients] insert', clientError)
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json({ ok: false, error: 'Failed to create client profile' }, { status: 500 })
    }

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
    .select('id, name, location_id, service_locations(name)')
    .eq('status', 'active')
    .order('name')

  if (error) {
    console.error('[GET /api/admin/clients]', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch clients' }, { status: 500 })
  }

  const data = (clients ?? []).map((c) => {
    const { service_locations, ...rest } = c as typeof c & { service_locations: { name: string } | null }
    return { ...rest, location: service_locations?.name ?? null }
  })

  return NextResponse.json({ ok: true, data })
}
