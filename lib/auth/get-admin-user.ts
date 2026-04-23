import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

type AdminUser = { user: User; profile: Profile }

export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile || !['admin', 'superadmin'].includes(profile.role as string)) {
    return null
  }

  return { user, profile: profile as Profile }
}
