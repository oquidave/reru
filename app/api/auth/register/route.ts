import { NextResponse } from 'next/server'
import { createSupabaseServerClientWithServiceRole } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, address, zone, collection_day, plan, password } = body

    if (!name || !email || !phone || !address || !zone || !collection_day || !plan || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClientWithServiceRole()

    // Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        return NextResponse.json({ error: 'This email address is already registered.' }, { status: 409 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Insert client profile
    const { error: clientError } = await supabase
      .from('reru_clients')
      .insert({
        user_id: authData.user.id,
        name,
        phone,
        address,
        zone,
        collection_day,
        plan,
        status: 'active',
      })

    if (clientError) {
      // Roll back the auth user if client insert fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: 'Failed to create client profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
