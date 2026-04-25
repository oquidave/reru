import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'
import type { User } from '@supabase/supabase-js'
import type { Client } from '@/types'

type ClientUser = {
  user: User
  client: Client
  /** Supabase client with the correct auth context — use this for any follow-up
   *  queries in the route so RLS evaluates auth.uid() correctly. */
  supabase: SupabaseClient
}

export async function getCurrentClient(request?: Request): Promise<ClientUser | null> {
  // Bearer token path — for mobile/USSD clients
  const authHeader = request?.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)

    // Validate the JWT via Supabase Auth
    const anonClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) return null

    // Client with JWT in Authorization header so auth.uid() is set in RLS for all queries
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
    return { user, client: client as Client, supabase: bearerClient }
  }

  // Cookie path — for web clients
  const cookieStore = await cookies()
  const cookieClient = createServerClient(
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

  const { data: { user } } = await cookieClient.auth.getUser()
  if (!user) return null

  const { data: client } = await cookieClient
    .from('reru_clients')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!client) return null
  return { user, client: client as Client, supabase: cookieClient }
}
