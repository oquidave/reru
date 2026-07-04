import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import type { ApiResponse } from '@/types/api'

const generateInvoicesSchema = z.object({
  client_ids: z.array(z.string().uuid()).optional(),
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
})

const TAX_RATE = 0.06

const listInvoicesSchema = z.object({
  status:      z.enum(['pending', 'paid', 'overdue']).optional(),
  location_id: z.string().uuid().optional(),
  limit:       z.coerce.number().int().min(1).max(100).default(50),
  offset:      z.coerce.number().int().min(0).default(0),
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
  reru_clients: { name: string; location: string | null; phone: string } | null
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

  const { status, location_id, limit, offset } = parsed.data

  let query = adminUser.supabase
    .from('reru_invoices')
    .select('id, client_id, date, plan, qty, unit_price, subtotal, tax, total, status, paid_at, payment_method, payment_ref, reru_clients(name, phone, service_locations(name))', { count: 'exact' })
    .order('date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status)      query = query.eq('status', status)
  if (location_id) query = query.eq('reru_clients.location_id', location_id)

  const { data, count, error } = await query

  if (error) {
    console.error('[GET /api/admin/invoices]', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch invoices' }, { status: 500 })
  }

  type Row = Omit<InvoiceWithClient, 'reru_clients'> & {
    reru_clients: { name: string; phone: string; service_locations: { name: string } | null } | null
  }
  const rows = ((data ?? []) as unknown as Row[]).map((r) => ({
    ...r,
    reru_clients: r.reru_clients
      ? { name: r.reru_clients.name, phone: r.reru_clients.phone, location: r.reru_clients.service_locations?.name ?? null }
      : null,
  }))

  return NextResponse.json({
    ok: true,
    data: { data: rows, total: count ?? 0 },
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

  const { client_ids, date } = parsed.data

  // Fetch clients with their plan + custom_price
  let clientQuery = adminUser.supabase
    .from('reru_clients')
    .select('id, plan, custom_price')
    .eq('status', 'active')

  if (client_ids && client_ids.length > 0) {
    clientQuery = clientQuery.in('id', client_ids)
  }

  const { data: clients, error: clientsError } = await clientQuery
  if (clientsError || !clients) {
    console.error('[POST /api/admin/invoices] fetch clients', clientsError)
    return NextResponse.json({ ok: false, error: 'Failed to fetch clients' }, { status: 500 })
  }

  if (clients.length === 0) {
    return NextResponse.json({ ok: true, data: { generated: 0 } })
  }

  // Load all active pricing tiers for lookup
  const { data: tiers, error: tiersError } = await adminUser.supabase
    .from('pricing_tiers')
    .select('slug, price, billing_period')
    .eq('is_active', true)

  if (tiersError) {
    console.error('[POST /api/admin/invoices] fetch tiers', tiersError)
    return NextResponse.json({ ok: false, error: 'Failed to fetch pricing tiers' }, { status: 500 })
  }

  const tierMap = new Map((tiers ?? []).map((t) => [t.slug, t]))

  const invoiceRows = []
  const skipped: string[] = []

  for (const client of clients) {
    const plan = client.plan as string | null
    if (!plan) { skipped.push(client.id as string); continue }

    const tier = tierMap.get(plan)
    const unitPrice = (client.custom_price as number | null) ?? tier?.price ?? null

    if (unitPrice === null) {
      // Custom tier with no per-client price set — skip
      skipped.push(client.id as string)
      continue
    }

    const qty = 1
    const subtotal = unitPrice
    const tax = Math.round(subtotal * TAX_RATE)
    const total = subtotal + tax

    invoiceRows.push({
      client_id: client.id,
      date,
      plan,
      qty,
      unit_price: unitPrice,
      subtotal,
      tax,
      total,
      status: 'pending',
    })
  }

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
    new_value: { count: invoiceRows.length, skipped: skipped.length, date },
  })

  return NextResponse.json({ ok: true, data: { generated: invoiceRows.length, skipped: skipped.length } })
}
