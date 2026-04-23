import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const suspendSchema = z.object({
  action: z.enum(['suspend', 'reactivate']),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(1000),
})

export async function POST(
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
  const parsed = suspendSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid request body' },
      { status: 400 }
    )
  }

  const { action, reason } = parsed.data
  const newStatus = action === 'suspend' ? 'suspended' : 'active'

  const { data: oldClient } = await supabase
    .from('reru_clients')
    .select('id, status')
    .eq('id', id)
    .single()

  if (!oldClient) {
    return NextResponse.json({ ok: false, error: 'Client not found' }, { status: 404 })
  }

  const { data: updatedClient, error } = await supabase
    .from('reru_clients')
    .update({ status: newStatus })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[POST /api/admin/clients/[id]/suspend]', error)
    return NextResponse.json({ ok: false, error: 'Failed to update account status' }, { status: 500 })
  }

  await supabase.from('audit_logs').insert({
    admin_id:  adminUser.user.id,
    action:    action === 'suspend' ? 'suspend_client' : 'reactivate_client',
    entity:    'client',
    entity_id: id,
    old_value: { status: oldClient.status },
    new_value: { status: newStatus },
    reason,
  })

  return NextResponse.json({ ok: true, data: { status: newStatus, client: updatedClient } })
}
