import { env } from '@/lib/env'
import type { AfricasTalkingSendResponse } from './types'

/** Thrown for any Africa's Talking failure. Safe to log; never returned raw to clients. */
export class AfricasTalkingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AfricasTalkingError'
  }
}

const AT_SMS_URL = 'https://api.africastalking.com/version1/messaging'

/** True when Africa's Talking credentials are configured. */
export function isAfricasTalkingConfigured(): boolean {
  return Boolean(
    env.AFRICAS_TALKING_USERNAME && env.AFRICAS_TALKING_API_KEY && env.AFRICAS_TALKING_SENDER_ID
  )
}

/**
 * Send a single SMS via Africa's Talking.
 * @param to recipient in E.164 format (+256…)
 * @param message message body
 */
export async function sendSms(to: string, message: string): Promise<AfricasTalkingSendResponse> {
  if (!env.AFRICAS_TALKING_USERNAME || !env.AFRICAS_TALKING_API_KEY || !env.AFRICAS_TALKING_SENDER_ID) {
    throw new AfricasTalkingError('Africa\'s Talking credentials are not configured')
  }

  const res = await fetch(AT_SMS_URL, {
    method: 'POST',
    headers: {
      apiKey: env.AFRICAS_TALKING_API_KEY,
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      username: env.AFRICAS_TALKING_USERNAME,
      to,
      message,
      from: env.AFRICAS_TALKING_SENDER_ID,
    }),
  })

  if (!res.ok) {
    console.error('[africastalking sms]', res.status, await res.text().catch(() => ''))
    throw new AfricasTalkingError('Failed to send SMS')
  }

  const json = (await res.json()) as AfricasTalkingSendResponse
  const recipient = json.SMSMessageData?.Recipients?.[0]
  // AT returns 201 even when a recipient is rejected; statusCode 100/101 = success/sent.
  if (recipient && recipient.statusCode >= 400) {
    console.error('[africastalking sms] recipient rejected', recipient.status, recipient.statusCode)
    throw new AfricasTalkingError(`SMS rejected: ${recipient.status}`)
  }

  return json
}
