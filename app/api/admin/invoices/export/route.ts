import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { formatDate } from '@/lib/utils'

const exportQuerySchema = z.object({
  status: z.enum(['pending', 'paid', 'overdue']).optional(),
})

function escapeCSV(value: string | number | null | undefined): string {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(req: Request) {
  const adminUser = await getAdminUser(req)
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const statusParam = url.searchParams.get('status') ?? undefined
  const parsed = exportQuerySchema.safeParse({ status: statusParam })
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid status filter' }, { status: 400 })
  }

  type InvoiceRow = {
    id: string
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

  let query = adminUser.supabase
    .from('reru_invoices')
    .select('id, date, plan, qty, unit_price, subtotal, tax, total, status, paid_at, payment_method, payment_ref, reru_clients(name, zone, phone)')
    .order('date', { ascending: false })

  if (parsed.data.status) {
    query = query.eq('status', parsed.data.status)
  }

  const { data: invoices, error } = await query

  if (error) {
    console.error('[GET /api/admin/invoices/export]', error)
    return NextResponse.json({ ok: false, error: 'Failed to export invoices' }, { status: 500 })
  }

  const headers = [
    'Invoice ID', 'Client Name', 'Zone', 'Phone',
    'Date', 'Plan', 'Qty', 'Unit Price', 'Subtotal', 'Tax', 'Total',
    'Status', 'Paid At', 'Payment Method', 'Payment Ref',
  ]

  const rows = (invoices as unknown as InvoiceRow[]).map((inv) => [
    inv.id,
    inv.reru_clients?.name ?? '',
    inv.reru_clients?.zone ?? '',
    inv.reru_clients?.phone ?? '',
    formatDate(inv.date),
    inv.plan,
    inv.qty,
    inv.unit_price,
    inv.subtotal,
    inv.tax,
    inv.total,
    inv.status,
    inv.paid_at ? formatDate(inv.paid_at) : '',
    inv.payment_method ?? '',
    inv.payment_ref ?? '',
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCSV).join(','))
    .join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type':        'text/csv',
      'Content-Disposition': 'attachment; filename="reru-invoices.csv"',
    },
  })
}
