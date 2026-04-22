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
