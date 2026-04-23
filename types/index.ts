export type Zone = 'Zone A' | 'Zone B' | 'Zone C'
export type CollectionDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'
export type Plan = 'monthly' | 'annual'
export type ClientStatus = 'active' | 'suspended' | 'cancelled'
export type InvoiceStatus = 'pending' | 'paid' | 'overdue'
export type CollectionStatus = 'scheduled' | 'completed' | 'missed'

export interface Client {
  id: string
  user_id: string
  name: string
  phone: string
  address: string
  zone: Zone
  collection_day: CollectionDay
  plan: Plan
  status: ClientStatus
  paid_through: string | null
  created_at: string
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
