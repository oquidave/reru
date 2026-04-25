import { NextResponse } from 'next/server'
import { getCurrentClient } from '@/lib/auth/get-current-client'
import type { ApiResponse } from '@/types/api'
import type { Invoice } from '@/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Invoice>>> {
  const current = await getCurrentClient(_request)
  if (!current) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const { data: invoice, error } = await current.supabase
    .from('reru_invoices')
    .select('*')
    .eq('id', id)
    .eq('client_id', current.client.id)
    .single()

  if (error || !invoice) {
    return NextResponse.json({ ok: false, error: 'Invoice not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, data: invoice as Invoice })
}
