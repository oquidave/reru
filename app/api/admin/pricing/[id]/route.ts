import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server'
import type { ApiResponse, PricingTier } from '@/types'

const updateSchema = z.object({
  name:           z.string().min(2).max(100).optional(),
  price:          z.coerce.number().int().min(0).nullable().optional(),
  billing_period: z.enum(['month', 'year', 'custom']).optional(),
  description:    z.string().max(300).optional().or(z.literal('')),
  is_public:      z.boolean().optional(),
  is_active:      z.boolean().optional(),
  sort_order:     z.coerce.number().int().min(0).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<PricingTier>>> {
  const adminUser = await getAdminUser(req)
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json() as unknown
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ ok: false, error: 'No fields to update' }, { status: 400 })
  }

  const supabase = createSupabaseServiceRoleClient()

  // If deactivating, make sure no active clients are on this tier
  if (parsed.data.is_active === false) {
    const { count } = await supabase
      .from('reru_clients')
      .select('id', { count: 'exact', head: true })
      .eq('plan', id)  // We check by tier id vs plan slug below
    // Actually check by slug — need the tier's slug first
    const { data: tier } = await supabase
      .from('pricing_tiers')
      .select('slug')
      .eq('id', id)
      .single()

    if (tier) {
      const { count: clientCount } = await supabase
        .from('reru_clients')
        .select('id', { count: 'exact', head: true })
        .eq('plan', tier.slug)
        .eq('status', 'active')

      if ((clientCount ?? 0) > 0) {
        return NextResponse.json(
          { ok: false, error: `Cannot deactivate — ${clientCount} active client(s) are on this tier. Reassign them first.` },
          { status: 409 }
        )
      }
    }
  }

  const updatePayload: Record<string, unknown> = {}
  if (parsed.data.name !== undefined)           updatePayload.name           = parsed.data.name
  if (parsed.data.price !== undefined)          updatePayload.price          = parsed.data.price
  if (parsed.data.billing_period !== undefined) updatePayload.billing_period = parsed.data.billing_period
  if (parsed.data.description !== undefined)    updatePayload.description    = parsed.data.description || null
  if (parsed.data.is_public !== undefined)      updatePayload.is_public      = parsed.data.is_public
  if (parsed.data.is_active !== undefined)      updatePayload.is_active      = parsed.data.is_active
  if (parsed.data.sort_order !== undefined)     updatePayload.sort_order     = parsed.data.sort_order

  const { data, error } = await supabase
    .from('pricing_tiers')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[PATCH /api/admin/pricing/[id]]', error)
    return NextResponse.json({ ok: false, error: 'Failed to update tier' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, data: data as PricingTier })
}
