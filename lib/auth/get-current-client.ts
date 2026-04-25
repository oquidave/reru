import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'
import type { Client } from '@/types'

type ClientUser = { user: User; client: Client }

export async function getCurrentClient(): Promise<ClientUser | null> {
  const supabase = await createSupabaseServerClient()

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
