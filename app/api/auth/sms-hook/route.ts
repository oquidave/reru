import { NextResponse } from 'next/server'
import { Webhook } from 'standardwebhooks'
import { env } from '@/lib/env'
import { sendSms, AfricasTalkingError } from '@/lib/africastalking/client'

// Supabase "Send SMS" auth hook. Supabase calls this server-to-server when it needs
// to deliver a phone OTP (sign-up / sign-in / phone-change). The request is signed with
// Standard Webhooks using SUPABASE_SEND_SMS_HOOK_SECRET ("v1,whsec_…"). We verify the
// signature, then deliver the code through Africa's Talking.
//
// Contract (https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook):
//   payload: { user: { phone, … }, sms: { otp } }
//   success: 200 {}
//   failure: { error: { http_code, message } }

interface SendSmsHookPayload {
  user: { phone: string }
  sms: { otp: string }
}

function errorResponse(httpCode: number, message: string): NextResponse {
  return NextResponse.json({ error: { http_code: httpCode, message } }, { status: httpCode })
}

export async function POST(request: Request): Promise<NextResponse> {
  const secret = env.SUPABASE_SEND_SMS_HOOK_SECRET
  if (!secret) {
    console.error('[sms-hook] SUPABASE_SEND_SMS_HOOK_SECRET is not configured')
    return errorResponse(500, 'SMS hook not configured')
  }

  const rawBody = await request.text()
  const headers = {
    'webhook-id': request.headers.get('webhook-id') ?? '',
    'webhook-timestamp': request.headers.get('webhook-timestamp') ?? '',
    'webhook-signature': request.headers.get('webhook-signature') ?? '',
  }

  // The standardwebhooks SDK expects the base64 secret without the "v1,whsec_" prefix.
  const base64Secret = secret.replace(/^v1,whsec_/, '')

  let payload: SendSmsHookPayload
  try {
    const wh = new Webhook(base64Secret)
    payload = wh.verify(rawBody, headers) as SendSmsHookPayload
  } catch (err) {
    console.error('[sms-hook] signature verification failed', err)
    return errorResponse(401, 'Invalid signature')
  }

  const phone = payload.user?.phone
  const otp = payload.sms?.otp
  if (!phone || !otp) {
    return errorResponse(400, 'Missing phone or otp in payload')
  }

  try {
    await sendSms(phone, `Your RERU verification code is ${otp}. It expires in 10 minutes.`)
  } catch (err) {
    const message = err instanceof AfricasTalkingError ? err.message : 'Failed to deliver SMS'
    console.error('[sms-hook] delivery failed', err)
    return errorResponse(502, message)
  }

  return NextResponse.json({})
}
