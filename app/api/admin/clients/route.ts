import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createSupabaseServerClient()

  const { data: clients, error } = await supabase
    .from('reru_clients')
    .select('id, name, zone')
    .eq('status', 'active')
    .order('name')

  if (error) {
    console.error('[GET /api/admin/clients]', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch clients' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, data: clients })
}
