import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'
import type { Client } from '@/types'

type ClientUser = { user: User; client: Client }

export async function getCurrentClient(request?: Request): Promise<ClientUser | null> {
  const supabase = await createSupabaseServerClient()

  let user: User | null = null

  // Bearer token path — for mobile/USSD clients
  const authHeader = request?.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const { data } = await supabase.auth.getUser(token)
    user = data.user
  } else {
    // Cookie path — for web clients
    const { data } = await supabase.auth.getUser()
    user = data.user
  }

  if (!user) return null

  const { data: client } = await supabase
    .from('reru_clients')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!client) return null
  return { user, client: client as Client }
}
