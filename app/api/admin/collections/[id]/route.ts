import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import type { AuditAction } from '@/types'

const updateCollectionSchema = z.object({
  status:         z.enum(['completed', 'missed']).optional(),
  bags_collected: z.number().int().min(0).max(100).optional(),
  notes:          z.string().max(1000).optional(),
})

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
  const parsed = updateCollectionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 })
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ ok: false, error: 'No fields to update' }, { status: 400 })
  }

  const { data: oldCollection } = await adminUser.supabase
    .from('reru_collections')
    .select('*')
    .eq('id', id)
    .single()

  if (!oldCollection) {
    return NextResponse.json({ ok: false, error: 'Collection not found' }, { status: 404 })
  }

  const updatePayload: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.status === 'completed') {
    updatePayload.completed_at = new Date().toISOString()
    updatePayload.recorded_by  = adminUser.user.id
  }

  const { data: updatedCollection, error } = await adminUser.supabase
    .from('reru_collections')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[PATCH /api/admin/collections/[id]]', error)
    return NextResponse.json({ ok: false, error: 'Failed to update collection' }, { status: 500 })
  }

  let auditAction: AuditAction = 'mark_collection_completed'
  if (parsed.data.status === 'missed') auditAction = 'mark_collection_missed'

  if (parsed.data.status) {
    await adminUser.supabase.from('audit_logs').insert({
      admin_id:  adminUser.user.id,
      action:    auditAction,
      entity:    'collection',
      entity_id: id,
      old_value: { status: oldCollection.status },
      new_value: { status: parsed.data.status },
    })
  }

  return NextResponse.json({ ok: true, data: updatedCollection })
}
