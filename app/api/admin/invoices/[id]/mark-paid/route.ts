import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { applyPaymentToInvoice } from '@/lib/invoices/apply-payment'

const markPaidSchema = z.object({
  payment_method: z.enum(['mtn_momo', 'airtel', 'bank_transfer', 'cash']),
  payment_ref:    z.string().max(200).optional(),
  paid_at:        z.string().datetime().optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await getAdminUser(req)
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const body = await req.json() as unknown
  const parsed = markPaidSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid request body' },
      { status: 400 }
    )
  }

  try {
    const result = await applyPaymentToInvoice(adminUser.supabase, {
      invoiceId:     id,
      paymentMethod: parsed.data.payment_method,
      paymentRef:    parsed.data.payment_ref ?? null,
      paidAt:        parsed.data.paid_at,
      audit:         { adminId: adminUser.user.id },
    })

    if (!result.ok) {
      if (result.reason === 'not_found') {
        return NextResponse.json({ ok: false, error: 'Invoice not found' }, { status: 404 })
      }
      return NextResponse.json({ ok: false, error: 'Invoice is already marked as paid' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, data: result.invoice })
  } catch (error) {
    console.error('[POST /api/admin/invoices/[id]/mark-paid]', error)
    return NextResponse.json({ ok: false, error: 'Failed to mark invoice as paid' }, { status: 500 })
  }
}
