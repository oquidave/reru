import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import type { ApiResponse } from '@/types/api'
import type { ServiceLocation } from '@/types'

const createSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
})

// List all locations (admins see inactive ones too).
export async function GET(request: Request): Promise<NextResponse<ApiResponse<ServiceLocation[]>>> {
  const adminUser = await getAdminUser(request)
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await adminUser.supabase
    .from('service_locations')
    .select('id, name, active, created_at')
    .order('name', { ascending: true })

  if (error) {
    console.error('[GET /api/admin/locations]', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch locations' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, data: (data ?? []) as ServiceLocation[] })
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<ServiceLocation>>> {
  const adminUser = await getAdminUser(request)
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as unknown
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const name = parsed.data.name.trim()

  const { data: created, error } = await adminUser.supabase
    .from('service_locations')
    .insert({ name })
    .select('id, name, active, created_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ ok: false, error: 'That location already exists.' }, { status: 409 })
    }
    console.error('[POST /api/admin/locations]', error)
    return NextResponse.json({ ok: false, error: 'Failed to create location' }, { status: 500 })
  }

  await adminUser.supabase.from('audit_logs').insert({
    admin_id:  adminUser.user.id,
    action:    'add_location',
    entity:    'service_location',
    entity_id: created.id,
    new_value: created,
  })

  return NextResponse.json({ ok: true, data: created as ServiceLocation })
}
