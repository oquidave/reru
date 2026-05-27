import { NextResponse } from 'next/server'
import { getCurrentClient } from '@/lib/auth/get-current-client'
import { createSupabaseServerClientWithServiceRole } from '@/lib/supabase/server'
import { finalizeCollection } from '@/lib/payments/finalize'
import type { ApiResponse } from '@/types/api'
import type { Payment } from '@/types'

/**
 * Returns the current status of a payment attempt. While the payment is non-terminal,
 * it reconciles against ioTec (the source of truth), so polling this endpoint drives the
 * payment to completion even if the ioTec webhook never arrives (e.g. local dev).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Payment>>> {
  const current = await getCurrentClient(req)
  if (!current) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // RLS scopes SELECT to the caller's own payments; double-check ownership defensively.
  const { data: payment } = await current.supabase
    .from('reru_payments')
    .select('*')
    .eq('id', id)
    .single()

  if (!payment || (payment as Payment).client_id !== current.client.id) {
    return NextResponse.json({ ok: false, error: 'Payment not found' }, { status: 404 })
  }

  let result = payment as Payment
  if (result.status === 'pending' || result.status === 'sent') {
    const service = await createSupabaseServerClientWithServiceRole()
    result = await finalizeCollection(service, result)
  }

  return NextResponse.json({ ok: true, data: result })
}
