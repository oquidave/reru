import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentClient } from '@/lib/auth/get-current-client'
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server'
import { initiateCollection, isIotecConfigured, IotecError } from '@/lib/iotec/client'
import { mapIotecStatus } from '@/lib/iotec/types'
import type { ApiResponse } from '@/types/api'
import type { Invoice, Payment } from '@/types'

const paySchema = z.object({
  // Optional override; defaults to the client's stored phone.
  phone: z.string().trim().min(9).max(20).optional(),
})

type PayResult = { paymentId: string; status: Payment['status'] }

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<PayResult>>> {
  const current = await getCurrentClient(req)
  if (!current) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  if (!isIotecConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'Mobile money payments are not available yet' },
      { status: 503 }
    )
  }

  const { id } = await params

  const body = (await req.json().catch(() => ({}))) as unknown
  const parsed = paySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid request body' },
      { status: 400 }
    )
  }

  // Authorize against the caller's own invoice (RLS scopes this to the client).
  const { data: invoice } = await current.supabase
    .from('reru_invoices')
    .select('*')
    .eq('id', id)
    .eq('client_id', current.client.id)
    .single()

  if (!invoice) {
    return NextResponse.json({ ok: false, error: 'Invoice not found' }, { status: 404 })
  }
  const inv = invoice as Invoice
  if (inv.status === 'paid') {
    return NextResponse.json({ ok: false, error: 'Invoice is already paid' }, { status: 400 })
  }

  const phone = (parsed.data.phone ?? current.client.phone).replace(/\s+/g, '')

  // reru_payments writes require the service role (no client insert policy).
  // Must be the cookie-less client, or the user's session would make RLS apply.
  const service = createSupabaseServiceRoleClient()

  // Idempotency: reuse an in-flight attempt rather than charging twice.
  const { data: inflight } = await service
    .from('reru_payments')
    .select('*')
    .eq('invoice_id', inv.id)
    .in('status', ['pending', 'sent'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (inflight) {
    const p = inflight as Payment
    return NextResponse.json({ ok: true, data: { paymentId: p.id, status: p.status } })
  }

  const externalId = crypto.randomUUID()

  const { data: payment, error: insertError } = await service
    .from('reru_payments')
    .insert({
      invoice_id:  inv.id,
      client_id:   current.client.id,
      external_id: externalId,
      amount:      inv.total,
      currency:    'UGX',
      payer_phone: phone,
      status:      'pending',
    })
    .select()
    .single()

  if (insertError || !payment) {
    console.error('[POST /api/user/invoices/[id]/pay] insert', insertError)
    return NextResponse.json({ ok: false, error: 'Could not start payment' }, { status: 500 })
  }
  const paymentRow = payment as Payment

  try {
    const view = await initiateCollection({
      payer:     phone,
      amount:    inv.total,
      externalId,
      payerNote: `RERU invoice ${inv.id}`,
    })

    const mapped = mapIotecStatus(view.status)
    await service
      .from('reru_payments')
      .update({
        iotec_id:    view.id,
        status:      mapped.status,
        status_code: view.statusCode ?? null,
        vendor:      view.vendor ?? null,
        updated_at:  new Date().toISOString(),
      })
      .eq('id', paymentRow.id)

    return NextResponse.json({ ok: true, data: { paymentId: paymentRow.id, status: mapped.status } })
  } catch (error) {
    console.error('[POST /api/user/invoices/[id]/pay] iotec', error)
    await service
      .from('reru_payments')
      .update({
        status:        'failed',
        error_message: error instanceof IotecError ? error.message : 'Payment request failed',
        processed_at:  new Date().toISOString(),
        updated_at:    new Date().toISOString(),
      })
      .eq('id', paymentRow.id)

    return NextResponse.json({ ok: false, error: 'Could not reach mobile money provider' }, { status: 502 })
  }
}
