import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

type AdminUser = { user: User; profile: Profile; supabase: SupabaseClient }

export async function getAdminUser(request?: Request): Promise<AdminUser | null> {
  // Bearer token path — for mobile admin clients
  const authHeader = request?.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)

    const anonClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) return null

    const bearerClient = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { data: profile } = await bearerClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!profile || !['admin', 'superadmin'].includes(profile.role as string)) return null
    return { user, profile: profile as Profile, supabase: bearerClient }
  }

  // Cookie path — for web admin
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

  const { data: profile } = await cookieClient
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile || !['admin', 'superadmin'].includes(profile.role as string)) return null
  return { user, profile: profile as Profile, supabase: cookieClient }
}
