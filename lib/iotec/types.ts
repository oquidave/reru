import type { PaymentMethod, PaymentStatus } from '@/types'

// ioTec Pay request status (from the Pay API OpenAPI spec).
export type IotecStatus =
  | 'Pending'
  | 'SentToVendor'
  | 'Success'
  | 'Failed'
  | 'AwaitingApproval'
  | 'RolledBack'
  | 'Scheduled'
  | 'Cancelled'
  | 'Rejected'

// ioTec mobile-money / payment vendor.
export type IotecVendor =
  | 'Mock'
  | 'Mtn'
  | 'MtnMerchant'
  | 'Airtel'
  | 'AirtelMerchant'
  | 'Internal'
  | 'Stanbic'
  | 'Visa'
  | 'MasterCard'
  | string

/** Body for POST /api/collections/collect. */
export interface CollectionRequest {
  payer: string
  amount: number
  externalId: string
  currency: 'UGX'
  category: 'MobileMoney'
  walletId?: string
  payerNote?: string
}

/** Subset of CollectionViewModel we rely on. */
export interface CollectionViewModel {
  id: string
  externalId?: string | null
  status: IotecStatus
  statusCode?: string | null
  amount?: number
  currency?: string
  vendor?: IotecVendor | null
  vendorTransactionId?: string | null
  createdAt?: string
  lastUpdated?: string
  processedAt?: string | null
}

/** Token response from the IdentityServer connect/token endpoint. */
export interface TokenResponse {
  access_token: string
  expires_in: number
  token_type?: string
}

/** Maps an ioTec status to our internal payment status + whether it is terminal. */
export function mapIotecStatus(status: IotecStatus): { status: PaymentStatus; terminal: boolean } {
  switch (status) {
    case 'Success':
      return { status: 'success', terminal: true }
    case 'Failed':
    case 'Rejected':
    case 'RolledBack':
      return { status: 'failed', terminal: true }
    case 'Cancelled':
      return { status: 'cancelled', terminal: true }
    case 'SentToVendor':
      return { status: 'sent', terminal: false }
    case 'Pending':
    case 'AwaitingApproval':
    case 'Scheduled':
    default:
      return { status: 'pending', terminal: false }
  }
}

/** Maps an ioTec vendor to our PaymentMethod, or null when unknown. */
export function vendorToPaymentMethod(vendor?: IotecVendor | null): PaymentMethod | null {
  switch (vendor) {
    case 'Mtn':
    case 'MtnMerchant':
      return 'mtn_momo'
    case 'Airtel':
    case 'AirtelMerchant':
      return 'airtel'
    default:
      return null
  }
}
