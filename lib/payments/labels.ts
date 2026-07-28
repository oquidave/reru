import type { PaymentMethod } from '@/types'

/** Display names for stored payment methods. Shared so the admin form, the invoice
 *  view, and the receipt PDF can never disagree about what a method is called. */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  mtn_momo:      'MTN MoMo',
  airtel:        'Airtel Money',
  bank_transfer: 'Bank Transfer',
  cash:          'Cash',
}

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] =
  (Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((value) => ({
    value,
    label: PAYMENT_METHOD_LABELS[value],
  }))

/**
 * Human label for a stored payment method. Falls back to the raw value so an
 * unrecognised method (an older row, or one added elsewhere) still prints
 * something truthful rather than "undefined" on a receipt.
 */
export function paymentMethodLabel(method: string | null): string {
  if (!method) return 'Not recorded'
  return PAYMENT_METHOD_LABELS[method as PaymentMethod] ?? method
}
