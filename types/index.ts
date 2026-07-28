export type { ApiResponse } from './api'

export type CollectionDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'

/** Every valid collection day, in week order. Keep in sync with `CollectionDay`. */
export const COLLECTION_DAYS: readonly CollectionDay[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const
export type Plan = string   // dynamic — matches pricing_tiers.slug
export type ClientStatus = 'active' | 'suspended' | 'cancelled'
export type InvoiceStatus = 'pending' | 'paid' | 'overdue'
export type CollectionStatus = 'scheduled' | 'completed' | 'missed'
export type PropertyType = 'household' | 'business'

export interface PricingTier {
  id: string
  name: string
  slug: string
  price: number | null
  billing_period: 'month' | 'year' | 'custom'
  description: string | null
  is_public: boolean
  is_active: boolean
  sort_order: number
  created_at: string
}

/** Admin-managed service area (town/neighbourhood). Replaces the old Zone A/B/C enum. */
export interface ServiceLocation {
  id: string
  name: string
  active: boolean
  created_at: string
}

export interface Client {
  id: string
  user_id: string
  name: string
  phone: string
  address: string | null
  location_id: string | null
  /** Joined service_locations.name, populated by list/detail queries. */
  location: string | null
  other_location: string | null
  collection_day: CollectionDay | null
  plan: Plan | null
  custom_price: number | null
  status: ClientStatus
  paid_through: string | null
  created_at: string
  // Profiling fields collected during onboarding.
  landmark: string | null
  property_type: PropertyType | null
  bin_count: number | null
  alt_phone: string | null
  alt_phone_is_whatsapp: boolean
  // GPS pickup point. Latitude and longitude are always both set or both null.
  latitude: number | null
  longitude: number | null
  /** Accuracy radius in metres from the capturing device; null when entered by hand. */
  location_accuracy_m: number | null
  location_captured_at: string | null
}

export interface Invoice {
  id: string
  client_id: string
  date: string
  plan: string
  qty: number
  unit_price: number
  subtotal: number
  tax: number
  total: number
  status: InvoiceStatus
  paid_at: string | null
  payment_method: string | null
  payment_ref: string | null
  created_at: string
}

export interface Collection {
  id: string
  client_id: string
  scheduled_date: string
  status: CollectionStatus
  bags_collected: number | null
  notes: string | null
  recorded_by: string | null
  completed_at: string | null
  created_at: string
}

export type UserRole = 'client' | 'admin' | 'superadmin'
export type PaymentMethod = 'mtn_momo' | 'airtel' | 'bank_transfer' | 'cash'

// Lifecycle of an in-app mobile-money payment attempt (ioTec collection).
export type PaymentStatus = 'pending' | 'sent' | 'success' | 'failed' | 'cancelled'

export interface Payment {
  id: string
  invoice_id: string
  client_id: string
  /** Our reference sent to ioTec as externalId; unique per attempt. */
  external_id: string
  /** ioTec's transaction id, available once the collection is created. */
  iotec_id: string | null
  amount: number
  currency: string
  payer_phone: string
  /** ioTec vendor that processed the payment (e.g. Mtn, Airtel). */
  vendor: string | null
  status: PaymentStatus
  status_code: string | null
  error_message: string | null
  created_at: string
  updated_at: string
  processed_at: string | null
}

export type AuditAction =
  | 'suspend_client'
  | 'reactivate_client'
  | 'edit_client'
  | 'mark_invoice_paid'
  | 'mark_invoice_overdue'
  | 'generate_invoice'
  | 'mark_collection_completed'
  | 'mark_collection_missed'
  | 'bulk_schedule_collections'
  | 'schedule_collection'
  | 'add_location'
  | 'edit_location'

export interface Profile {
  id: string
  user_id: string
  role: UserRole
  full_name: string
  created_at: string
}

export interface AuditLog {
  id: string
  admin_id: string
  action: AuditAction
  entity: string
  entity_id: string
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  reason: string | null
  created_at: string
}
