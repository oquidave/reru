import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabase/server'
import { normalizeUgPhone } from '@/lib/phone'
import type { ApiResponse } from '@/types/api'

const schema = z.object({
  location_id:    z.string().uuid('Select your location'),
  plan:           z.enum(['monthly', 'annual']),
  collection_day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
  address:        z.string().min(5, 'Address is required').max(500),
  landmark:       z.string().max(300).optional().or(z.literal('')),
  property_type:  z.enum(['household', 'business']),
  bin_count:      z.coerce.number().int().min(1, 'Enter at least 1 bin').max(100),
  alt_phone:      z.string().optional().or(z.literal('')),
  alt_phone_is_whatsapp: z.boolean().optional().default(false),
  email:          z.string().email('Enter a valid email').optional().or(z.literal('')),
  password:       z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
})

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

    // Validate the chosen location is real and active.
    const { data: location } = await service
      .from('service_locations')
      .select('id')
      .eq('id', input.location_id)
      .eq('active', true)
      .maybeSingle()
    if (!location) {
      return NextResponse.json({ ok: false, error: 'Selected location is unavailable' }, { status: 400 })
    }

    const { error: updateError } = await service
      .from('reru_clients')
      .update({
        location_id:           input.location_id,
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
