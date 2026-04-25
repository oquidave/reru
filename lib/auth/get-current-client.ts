import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'
import type { User } from '@supabase/supabase-js'
import type { Client } from '@/types'

type ClientUser = { user: User; client: Client }

export async function getCurrentClient(request?: Request): Promise<ClientUser | null> {
  // Bearer token path — for mobile/USSD clients
  const authHeader = request?.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)

    // Validate the JWT via Supabase Auth
    const anonClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) return null

    // Create a client that forwards the JWT to PostgREST so auth.uid() is set for RLS
    const bearerClient = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { data: client } = await bearerClient
      .from('reru_clients')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!client) return null
    return { user, client: client as Client }
  }

  // Cookie path — for web clients
  const cookieStore = await cookies()
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: client } = await supabase
    .from('reru_clients')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!client) return null
  return { user, client: client as Client }
}
