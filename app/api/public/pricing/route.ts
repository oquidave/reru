import { NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server'
import type { ApiResponse, PricingTier } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse<ApiResponse<PricingTier[]>>> {
  const supabase = createSupabaseServiceRoleClient()
  const { data, error } = await supabase
    .from('pricing_tiers')
    .select('*')
    .eq('is_public', true)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[GET /api/public/pricing]', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch pricing' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, data: data as PricingTier[] })
}
