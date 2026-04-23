import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const generateInvoicesSchema = z.object({
  client_ids: z.array(z.string().uuid()).optional(),
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  plan:       z.enum(['monthly', 'annual']),
})

const PRICING = {
  monthly: { qty: 1,  unit_price: 25000, subtotal: 25000,  tax: 1500,  total: 26500  },
  annual:  { qty: 12, unit_price: 20000, subtotal: 240000, tax: 14400, total: 254400 },
}

export async function POST(req: Request) {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createSupabaseServerClient()

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
    const { data: clients, error: clientsError } = await supabase
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

  const { error: insertError } = await supabase
    .from('reru_invoices')
    .insert(invoiceRows)

  if (insertError) {
    console.error('[POST /api/admin/invoices]', insertError)
    return NextResponse.json({ ok: false, error: 'Failed to generate invoices' }, { status: 500 })
  }

  await supabase.from('audit_logs').insert({
    admin_id:  adminUser.user.id,
    action:    'generate_invoice',
    entity:    'invoice',
    entity_id: '00000000-0000-0000-0000-000000000000',
    new_value: { count: invoiceRows.length, plan, date },
  })

  return NextResponse.json({ ok: true, data: { generated: invoiceRows.length } })
}
