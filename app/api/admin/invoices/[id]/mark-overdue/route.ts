import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth/get-admin-user'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await getAdminUser(req)
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const { data: invoice } = await adminUser.supabase
    .from('reru_invoices')
    .select('id, status')
    .eq('id', id)
    .single()

  if (!invoice) {
    return NextResponse.json({ ok: false, error: 'Invoice not found' }, { status: 404 })
  }

  if (invoice.status === 'paid') {
    return NextResponse.json(
      { ok: false, error: 'Cannot mark a paid invoice as overdue' },
      { status: 400 }
    )
  }

  const { data: updatedInvoice, error } = await adminUser.supabase
    .from('reru_invoices')
    .update({ status: 'overdue' })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[POST /api/admin/invoices/[id]/mark-overdue]', error)
    return NextResponse.json({ ok: false, error: 'Failed to mark invoice as overdue' }, { status: 500 })
  }

  await adminUser.supabase.from('audit_logs').insert({
    admin_id:  adminUser.user.id,
    action:    'mark_invoice_overdue',
    entity:    'invoice',
    entity_id: id,
    old_value: { status: invoice.status },
    new_value: { status: 'overdue' },
  })

  return NextResponse.json({ ok: true, data: updatedInvoice })
}
