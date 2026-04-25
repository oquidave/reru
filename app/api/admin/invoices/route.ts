import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import type { ApiResponse } from '@/types/api'

const generateInvoicesSchema = z.object({
  client_ids: z.array(z.string().uuid()).optional(),
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  plan:       z.enum(['monthly', 'annual']),
})

const PRICING = {
  monthly: { qty: 1,  unit_price: 25000, subtotal: 25000,  tax: 1500,  total: 26500  },
  annual:  { qty: 12, unit_price: 20000, subtotal: 240000, tax: 14400, total: 254400 },
}

const listInvoicesSchema = z.object({
  status: z.enum(['pending', 'paid', 'overdue']).optional(),
  zone:   z.enum(['Zone A', 'Zone B', 'Zone C']).optional(),
  limit:  z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

type InvoiceWithClient = {
  id: string
  client_id: string
  date: string
  plan: string
  qty: number
  unit_price: number
  subtotal: number
  tax: number
  total: number
  status: string
  paid_at: string | null
  payment_method: string | null
  payment_ref: string | null
  reru_clients: { name: string; zone: string; phone: string } | null
}

type InvoicesData = { data: InvoiceWithClient[]; total: number }

export async function GET(request: Request): Promise<NextResponse<ApiResponse<InvoicesData>>> {
  const adminUser = await getAdminUser(request)
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const parsed = listInvoicesSchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid query' },
      { status: 400 }
    )
  }

  const { status, zone, limit, offset } = parsed.data

  let query = adminUser.supabase
    .from('reru_invoices')
    .select('id, client_id, date, plan, qty, unit_price, subtotal, tax, total, status, paid_at, payment_method, payment_ref, reru_clients(name, zone, phone)', { count: 'exact' })
    .order('date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (zone)   query = query.eq('reru_clients.zone', zone)

  const { data, count, error } = await query

  if (error) {
    console.error('[GET /api/admin/invoices]', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch invoices' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    data: { data: (data ?? []) as unknown as InvoiceWithClient[], total: count ?? 0 },
  })
}

export async function POST(req: Request) {
  const adminUser = await getAdminUser(req)
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as unknown
  const parsed = generateInvoicesSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid request body' },
      { status: 400 }
    )
  }

  const { client_ids, date, plan } = parsed.data
  const pricing = PRICING[plan]

  let targetIds: string[]

  if (client_ids && client_ids.length > 0) {
    targetIds = client_ids
  } else {
    const { data: clients, error: clientsError } = await adminUser.supabase
      .from('reru_clients')
      .select('id')
      .eq('status', 'active')

    if (clientsError || !clients) {
      console.error('[POST /api/admin/invoices]', clientsError)
      return NextResponse.json({ ok: false, error: 'Failed to fetch clients' }, { status: 500 })
    }

    targetIds = clients.map((c) => c.id as string)
  }

  if (targetIds.length === 0) {
    return NextResponse.json({ ok: true, data: { generated: 0 } })
  }

  const invoiceRows = targetIds.map((client_id) => ({
    client_id,
    date,
    plan,
    ...pricing,
    status: 'pending',
  }))

  const { error: insertError } = await adminUser.supabase
    .from('reru_invoices')
    .insert(invoiceRows)

  if (insertError) {
    console.error('[POST /api/admin/invoices]', insertError)
    return NextResponse.json({ ok: false, error: 'Failed to generate invoices' }, { status: 500 })
  }

  await adminUser.supabase.from('audit_logs').insert({
    admin_id:  adminUser.user.id,
    action:    'generate_invoice',
    entity:    'invoice',
    entity_id: '00000000-0000-0000-0000-000000000000',
    new_value: { count: invoiceRows.length, plan, date },
  })

  return NextResponse.json({ ok: true, data: { generated: invoiceRows.length } })
}
