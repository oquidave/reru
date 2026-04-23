import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const markPaidSchema = z.object({
  payment_method: z.enum(['mtn_momo', 'airtel', 'bank_transfer', 'cash']),
  payment_ref:    z.string().max(200).optional(),
  paid_at:        z.string().datetime().optional(),
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
  const parsed = markPaidSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid request body' },
      { status: 400 }
    )
  }

  const { data: invoice } = await supabase
    .from('reru_invoices')
    .select('*, reru_clients(id, paid_through)')
    .eq('id', id)
    .single()

  if (!invoice) {
    return NextResponse.json({ ok: false, error: 'Invoice not found' }, { status: 404 })
  }

  if (invoice.status === 'paid') {
    return NextResponse.json({ ok: false, error: 'Invoice is already marked as paid' }, { status: 400 })
  }

  const paidAt = parsed.data.paid_at ?? new Date().toISOString()

  const { data: updatedInvoice, error } = await supabase
    .from('reru_invoices')
    .update({
      status:         'paid',
      paid_at:        paidAt,
      payment_method: parsed.data.payment_method,
      payment_ref:    parsed.data.payment_ref ?? null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[POST /api/admin/invoices/[id]/mark-paid]', error)
    return NextResponse.json({ ok: false, error: 'Failed to mark invoice as paid' }, { status: 500 })
  }

  // Update client paid_through if this invoice date is more recent
  const clientData = invoice.reru_clients as { id: string; paid_through: string | null } | null
  if (clientData) {
    const invoiceDate = invoice.date as string
    if (!clientData.paid_through || invoiceDate > clientData.paid_through) {
      await supabase
        .from('reru_clients')
        .update({ paid_through: invoiceDate })
        .eq('id', clientData.id)
    }
  }

  await supabase.from('audit_logs').insert({
    admin_id:  adminUser.user.id,
    action:    'mark_invoice_paid',
    entity:    'invoice',
    entity_id: id,
    old_value: { status: invoice.status },
    new_value: { status: 'paid', payment_method: parsed.data.payment_method, paid_at: paidAt },
  })

  return NextResponse.json({ ok: true, data: updatedInvoice })
}
