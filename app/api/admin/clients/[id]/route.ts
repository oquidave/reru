import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Client } from '@/types'

const updateClientSchema = z.object({
  address:        z.string().min(1).max(500).optional(),
  zone:           z.enum(['Zone A', 'Zone B', 'Zone C']).optional(),
  collection_day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']).optional(),
  plan:           z.enum(['monthly', 'annual']).optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: client, error } = await supabase
    .from('reru_clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !client) {
    return NextResponse.json({ ok: false, error: 'Client not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, data: client })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const body = await req.json() as unknown
  const parsed = updateClientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 })
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ ok: false, error: 'No fields to update' }, { status: 400 })
  }

  // Snapshot old value for audit log
  const { data: oldClient } = await supabase
    .from('reru_clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!oldClient) {
    return NextResponse.json({ ok: false, error: 'Client not found' }, { status: 404 })
  }

  const { data: updatedClient, error } = await supabase
    .from('reru_clients')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[PATCH /api/admin/clients/[id]]', error)
    return NextResponse.json({ ok: false, error: 'Failed to update client' }, { status: 500 })
  }

  await supabase.from('audit_logs').insert({
    admin_id:  adminUser.user.id,
    action:    'edit_client',
    entity:    'client',
    entity_id: id,
    old_value: oldClient as unknown as Record<string, unknown>,
    new_value: updatedClient as unknown as Record<string, unknown>,
  })

  return NextResponse.json({ ok: true, data: updatedClient as Client })
}
