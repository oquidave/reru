import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { coordinateFields, coordinateUpdate } from '@/lib/geo'
import type { Client } from '@/types'

const updateClientSchema = z.object({
  address:        z.string().min(1).max(500).optional(),
  location_id:    z.string().uuid().optional(),
  collection_day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']).optional(),
  plan:           z.string().min(1).max(60).optional(),
  custom_price:   z.coerce.number().int().min(0).nullable().optional(),
  ...coordinateFields,
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await getAdminUser(req)
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const { data: client, error } = await adminUser.supabase
    .from('reru_clients')
    .select('*, service_locations(name)')
    .eq('id', id)
    .single()

  if (error || !client) {
    return NextResponse.json({ ok: false, error: 'Client not found' }, { status: 404 })
  }

  const { service_locations, ...rest } = client as typeof client & { service_locations: { name: string } | null }
  return NextResponse.json({ ok: true, data: { ...rest, location: service_locations?.name ?? null } })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await getAdminUser(req)
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const body = await req.json() as unknown
  const parsed = updateClientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 })
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ ok: false, error: 'No fields to update' }, { status: 400 })
  }

  const { data: oldClient } = await adminUser.supabase
    .from('reru_clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!oldClient) {
    return NextResponse.json({ ok: false, error: 'Client not found' }, { status: 404 })
  }

  // Raw coordinate input never reaches the database directly: coordinateUpdate
  // resolves it so location_captured_at is stamped and a half-pair is impossible.
  const { latitude, longitude, location_accuracy_m, ...fields } = parsed.data
  void latitude; void longitude; void location_accuracy_m
  const updatePayload = { ...fields, ...(coordinateUpdate(parsed.data) ?? {}) }

  const { data: updatedClient, error } = await adminUser.supabase
    .from('reru_clients')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[PATCH /api/admin/clients/[id]]', error)
    return NextResponse.json({ ok: false, error: 'Failed to update client' }, { status: 500 })
  }

  await adminUser.supabase.from('audit_logs').insert({
    admin_id:  adminUser.user.id,
    action:    'edit_client',
    entity:    'client',
    entity_id: id,
    old_value: oldClient as unknown as Record<string, unknown>,
    new_value: updatedClient as unknown as Record<string, unknown>,
  })

  return NextResponse.json({ ok: true, data: updatedClient as Client })
}
