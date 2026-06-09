import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import type { ApiResponse } from '@/types/api'
import type { ServiceLocation } from '@/types'

const updateSchema = z.object({
  name:   z.string().min(2).max(100).optional(),
  active: z.boolean().optional(),
}).refine((d) => d.name !== undefined || d.active !== undefined, {
  message: 'Nothing to update',
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ServiceLocation>>> {
  const adminUser = await getAdminUser(request)
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json() as unknown
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const { data: oldRow } = await adminUser.supabase
    .from('service_locations')
    .select('id, name, active, created_at')
    .eq('id', id)
    .maybeSingle()
  if (!oldRow) {
    return NextResponse.json({ ok: false, error: 'Location not found' }, { status: 404 })
  }

  const update: { name?: string; active?: boolean } = {}
  if (parsed.data.name !== undefined) update.name = parsed.data.name.trim()
  if (parsed.data.active !== undefined) update.active = parsed.data.active

  const { data: updated, error } = await adminUser.supabase
    .from('service_locations')
    .update(update)
    .eq('id', id)
    .select('id, name, active, created_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ ok: false, error: 'That location name already exists.' }, { status: 409 })
    }
    console.error('[PATCH /api/admin/locations/[id]]', error)
    return NextResponse.json({ ok: false, error: 'Failed to update location' }, { status: 500 })
  }

  await adminUser.supabase.from('audit_logs').insert({
    admin_id:  adminUser.user.id,
    action:    'edit_location',
    entity:    'service_location',
    entity_id: id,
    old_value: oldRow,
    new_value: updated,
  })

  return NextResponse.json({ ok: true, data: updated as ServiceLocation })
}
