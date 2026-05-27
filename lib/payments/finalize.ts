import type { SupabaseClient } from '@supabase/supabase-js'
import { getCollectionByExternalId, getCollectionStatus } from '@/lib/iotec/client'
import { mapIotecStatus, vendorToPaymentMethod } from '@/lib/iotec/types'
import { applyPaymentToInvoice } from '@/lib/invoices/apply-payment'
import type { Payment } from '@/types'

const TERMINAL: ReadonlyArray<Payment['status']> = ['success', 'failed', 'cancelled']

/**
 * Reconciles a pending payment against ioTec's authoritative status and, on success,
 * applies it to the invoice. Safe to call repeatedly — terminal payments are returned
 * unchanged. Used by both the ioTec webhook (untrusted trigger) and the client status-poll
 * endpoint, so the system converges even if a callback is missed.
 *
 * Requires a service-role Supabase client: reru_payments writes and the invoice update
 * run outside any session context.
 */
export async function finalizeCollection(
  supabase: SupabaseClient,
  payment: Payment
): Promise<Payment> {
  if (TERMINAL.includes(payment.status)) return payment

  // Re-query ioTec as the source of truth; never trust a webhook payload alone.
  let view
  try {
    view = payment.iotec_id
      ? await getCollectionStatus(payment.iotec_id)
      : await getCollectionByExternalId(payment.external_id)
  } catch (error) {
    console.error('[finalizeCollection] status query failed', error)
    return payment // leave pending; the next poll/callback will retry
  }

  const mapped = mapIotecStatus(view.status)
  const now = new Date().toISOString()

  const updates: Record<string, unknown> = {
    status:      mapped.status,
    status_code: view.statusCode ?? null,
    vendor:      view.vendor ?? payment.vendor,
    iotec_id:    payment.iotec_id ?? view.id,
    updated_at:  now,
  }
  if (mapped.terminal) updates.processed_at = view.processedAt ?? now
  if (mapped.status === 'failed') updates.error_message = view.statusCode ?? 'Payment failed'

  const { data: updatedPayment } = await supabase
    .from('reru_payments')
    .update(updates)
    .eq('id', payment.id)
    .select()
    .single()

  if (mapped.status === 'success') {
    // The reru_payments row is the payment audit trail; no admin audit-log entry here.
    await applyPaymentToInvoice(supabase, {
      invoiceId:     payment.invoice_id,
      paymentMethod: vendorToPaymentMethod(view.vendor) ?? 'mtn_momo',
      paymentRef:    payment.iotec_id ?? view.id,
      paidAt:        view.processedAt ?? now,
    })
  }

  return (updatedPayment as Payment | null) ?? payment
}
