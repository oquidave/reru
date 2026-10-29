import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/auth/get-admin-user'

const deleteSchema = z.object({
  reason: z.string().trim().max(200).optional(),
})

const HAS_PAYMENT_ATTEMPTS =
  'This invoice has mobile-money payment attempts on record, so it cannot be deleted'

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await getAdminUser(req)
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // The body is optional — a bare DELETE carries no reason.
  const body = await req.json().catch(() => ({})) as unknown
  const parsed = deleteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid request body' },
      { status: 400 }
    )
  }

  const { data: invoice } = await adminUser.supabase
    .from('reru_invoices')
    .select('*')
    .eq('id', id)
    .single()

  if (!invoice) {
    return NextResponse.json({ ok: false, error: 'Invoice not found' }, { status: 404 })
  }

  if (invoice.status === 'paid') {
    return NextResponse.json({ ok: false, error: 'Paid invoices cannot be deleted' }, { status: 400 })
  }

  // Even a failed attempt is payment history, and a pending one may still succeed.
  const { count: attempts } = await adminUser.supabase
    .from('reru_payments')
    .select('id', { count: 'exact', head: true })
    .eq('invoice_id', id)

  if (attempts) {
    return NextResponse.json({ ok: false, error: HAS_PAYMENT_ATTEMPTS }, { status: 409 })
  }

  // The status filter repeats the RLS rule so an invoice paid since the check
  // above is skipped rather than deleted.
  const { data: deleted, error } = await adminUser.supabase
    .from('reru_invoices')
    .delete()
    .eq('id', id)
    .neq('status', 'paid')
    .select('id')

  if (error) {
    // 23503: a payment attempt was started after the check above.
    if (error.code === '23503') {
      return NextResponse.json({ ok: false, error: HAS_PAYMENT_ATTEMPTS }, { status: 409 })
    }
    console.error('[DELETE /api/admin/invoices/[id]]', error)
    return NextResponse.json({ ok: false, error: 'Failed to delete invoice' }, { status: 500 })
  }

  if (!deleted || deleted.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'Invoice could not be deleted — it may have just been paid' },
      { status: 409 }
    )
  }

  // The audit row is the only remaining record of the invoice, so keep all of it.
  const { error: auditError } = await adminUser.supabase.from('audit_logs').insert({
    admin_id:  adminUser.user.id,
    action:    'delete_invoice',
    entity:    'invoice',
    entity_id: id,
    old_value: invoice,
    new_value: null,
    reason:    parsed.data.reason || null,
  })

  if (auditError) {
    console.error('[DELETE /api/admin/invoices/[id]] audit insert failed', auditError, invoice)
  }

  return NextResponse.json({ ok: true, data: { id } })
}
