import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/auth/get-admin-user'
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server'
import type { ApiResponse, PricingTier } from '@/types'

const createSchema = z.object({
  name:           z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug:           z.string().min(2).max(60).regex(/^[a-z0-9_]+$/, 'Slug must be lowercase letters, numbers, and underscores only'),
  price:          z.coerce.number().int().min(0).nullable().optional(),
  billing_period: z.enum(['month', 'year', 'custom']),
  description:    z.string().max(300).optional().or(z.literal('')),
  is_public:      z.boolean().default(true),
  sort_order:     z.coerce.number().int().min(0).default(0),
})

export async function GET(req: Request): Promise<NextResponse<ApiResponse<PricingTier[]>>> {
  const adminUser = await getAdminUser(req)
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createSupabaseServiceRoleClient()
  const { data, error } = await supabase
    .from('pricing_tiers')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[GET /api/admin/pricing]', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch pricing tiers' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, data: data as PricingTier[] })
}

export async function POST(req: Request): Promise<NextResponse<ApiResponse<PricingTier>>> {
  const adminUser = await getAdminUser(req)
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as unknown
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const supabase = createSupabaseServiceRoleClient()

  const { data: existing } = await supabase
    .from('pricing_tiers')
    .select('id')
    .eq('slug', parsed.data.slug)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ ok: false, error: 'A tier with that slug already exists' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('pricing_tiers')
    .insert({
      name:           parsed.data.name,
      slug:           parsed.data.slug,
      price:          parsed.data.price ?? null,
      billing_period: parsed.data.billing_period,
      description:    parsed.data.description || null,
      is_public:      parsed.data.is_public,
      is_active:      true,
      sort_order:     parsed.data.sort_order,
    })
    .select()
    .single()

  if (error) {
    console.error('[POST /api/admin/pricing]', error)
    return NextResponse.json({ ok: false, error: 'Failed to create pricing tier' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, data: data as PricingTier }, { status: 201 })
}
