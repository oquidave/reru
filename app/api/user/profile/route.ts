import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabase/server'
import { normalizeUgPhone } from '@/lib/phone'
import type { ApiResponse } from '@/types/api'

const schema = z.object({
  location_id:    z.string().uuid().optional().or(z.literal('')),
  other_location: z.string().max(200).optional().or(z.literal('')),
  plan:           z.string().min(1, 'Select a plan'),
  collection_day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  address:        z.string().min(5, 'Address is required').max(500),
  landmark:       z.string().max(300).optional().or(z.literal('')),
  property_type:  z.enum(['household', 'business']),
  bin_count:      z.coerce.number().int().min(1, 'Enter at least 1 bin').max(100),
  alt_phone:      z.string().optional().or(z.literal('')),
  alt_phone_is_whatsapp: z.boolean().optional().default(false),
  email:          z.string().email('Enter a valid email').optional().or(z.literal('')),
  password:       z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
}).refine(
  d => (d.location_id && d.location_id.length > 0) || (d.other_location && d.other_location.trim().length > 0),
  { message: 'Select your location or describe it below', path: ['location_id'] }
)

export async function PATCH(request: Request): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  try {
    const cookieClient = await createSupabaseServerClient()
    const { data: { user } } = await cookieClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as unknown
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }
    const input = parsed.data

    let altPhone: string | null = null
    if (input.alt_phone && input.alt_phone.trim()) {
      altPhone = normalizeUgPhone(input.alt_phone)
      if (!altPhone) {
        return NextResponse.json({ ok: false, error: 'Alternate phone is not a valid Ugandan number' }, { status: 400 })
      }
    }

    const service = createSupabaseServiceRoleClient()

    // Must already be a client (onboarded). Profile editing is for existing clients.
    const { data: existing } = await service
      .from('reru_clients')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Complete onboarding first' }, { status: 409 })
    }

    // Validate the plan is a real, active, public tier.
    const { data: tier } = await service
      .from('pricing_tiers')
      .select('id')
      .eq('slug', input.plan)
      .eq('is_active', true)
      .eq('is_public', true)
      .maybeSingle()
    if (!tier) {
      return NextResponse.json({ ok: false, error: 'Selected plan is unavailable' }, { status: 400 })
    }

    // Validate the chosen service location, unless the user entered a custom one.
    const hasCustomLocation = Boolean(input.other_location?.trim())
    if (!hasCustomLocation) {
      const { data: location } = await service
        .from('service_locations')
        .select('id')
        .eq('id', input.location_id!)
        .eq('active', true)
        .maybeSingle()
      if (!location) {
        return NextResponse.json({ ok: false, error: 'Selected location is unavailable' }, { status: 400 })
      }
    }

    const { error: updateError } = await service
      .from('reru_clients')
      .update({
        location_id:           hasCustomLocation ? null : input.location_id!,
        other_location:        hasCustomLocation ? input.other_location!.trim() : null,
        plan:                  input.plan,
        collection_day:        input.collection_day,
        address:               input.address,
        landmark:              input.landmark || null,
        property_type:         input.property_type,
        bin_count:             input.bin_count,
        alt_phone:             altPhone,
        alt_phone_is_whatsapp: input.alt_phone_is_whatsapp ?? false,
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[PATCH /api/user/profile] update error', updateError)
      return NextResponse.json({ ok: false, error: 'Failed to save your changes. Please try again.' }, { status: 500 })
    }

    // Only touch email/password when the user actually provided a new value.
    const wantsEmail = input.email && input.email.trim()
    const wantsPassword = input.password && input.password.trim()
    if (wantsEmail || wantsPassword) {
      const attrs: { email?: string; password?: string; email_confirm?: boolean } = {}
      if (wantsEmail) { attrs.email = input.email!.trim(); attrs.email_confirm = true }
      if (wantsPassword) attrs.password = input.password!
      const { error: authError } = await service.auth.admin.updateUserById(user.id, attrs)
      if (authError) {
        console.error('[PATCH /api/user/profile] updateUser error', authError)
        return NextResponse.json(
          { ok: false, error: 'Your details were saved, but updating email/password failed. Please try again.' },
          { status: 502 }
        )
      }
    }

    return NextResponse.json({ ok: true, data: { message: 'Profile updated' } })
  } catch {
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
