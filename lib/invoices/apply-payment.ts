import type { SupabaseClient } from '@supabase/supabase-js'
import type { Invoice } from '@/types'

export type ApplyPaymentResult =
  | { ok: true; invoice: Invoice }
  | { ok: false; reason: 'not_found' | 'already_paid' }

interface ApplyPaymentArgs {
  invoiceId: string
  /** Stored on the invoice (e.g. 'mtn_momo', 'airtel', 'cash'). */
  paymentMethod: string
  paymentRef?: string | null
  /** ISO timestamp; defaults to now. */
  paidAt?: string
  /** When provided, an admin audit-log row is written for the action. */
  audit?: { adminId: string }
}

/**
 * Marks an invoice paid, advances the client's paid_through date, and (optionally)
 * writes an audit-log entry. Shared by the admin mark-paid route and the automated
 * mobile-money payment flow. Idempotent: a paid invoice returns `already_paid`.
 *
 * The caller supplies the Supabase client so the correct auth context applies —
 * admin RLS client for manual marking, service-role client for webhook/reconcile.
 */
export async function applyPaymentToInvoice(
  supabase: SupabaseClient,
  args: ApplyPaymentArgs
): Promise<ApplyPaymentResult> {
  const { data: invoice } = await supabase
    .from('reru_invoices')
    .select('*, reru_clients(id, paid_through)')
    .eq('id', args.invoiceId)
    .single()

  if (!invoice) return { ok: false, reason: 'not_found' }
  if (invoice.status === 'paid') return { ok: false, reason: 'already_paid' }

  const paidAt = args.paidAt ?? new Date().toISOString()

  const { data: updatedInvoice, error } = await supabase
    .from('reru_invoices')
    .update({
      status:         'paid',
      paid_at:        paidAt,
      payment_method: args.paymentMethod,
      payment_ref:    args.paymentRef ?? null,
    })
    .eq('id', args.invoiceId)
    .select()
    .single()

  if (error) throw error

  // Advance the client's paid_through to this invoice's date when it is more recent.
  const clientData = invoice.reru_clients as { id: string; paid_through: string | null } | null
  if (clientData) {
    const invoiceDate = invoice.date as string
    if (!clientData.paid_through || invoiceDate > clientData.paid_through) {
      await supabase.from('reru_clients').update({ paid_through: invoiceDate }).eq('id', clientData.id)
    }
  }

  if (args.audit) {
    await supabase.from('audit_logs').insert({
      admin_id:  args.audit.adminId,
      action:    'mark_invoice_paid',
      entity:    'invoice',
      entity_id: args.invoiceId,
      old_value: { status: invoice.status },
      new_value: { status: 'paid', payment_method: args.paymentMethod, paid_at: paidAt },
    })
  }

  return { ok: true, invoice: updatedInvoice as Invoice }
}
