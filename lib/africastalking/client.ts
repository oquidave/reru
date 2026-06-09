import { env } from '@/lib/env'
import type { AfricasTalkingSendResponse } from './types'

/** Thrown for any Africa's Talking failure. Safe to log; never returned raw to clients. */
export class AfricasTalkingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AfricasTalkingError'
  }
}

// The sandbox app authenticates only against the sandbox host; live apps against the
// production host. Using the wrong host returns 401 "authentication is invalid".
const AT_HOSTS = {
  sandbox: 'https://api.sandbox.africastalking.com',
  live:    'https://api.africastalking.com',
}

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

  // Trim to defend against trailing newlines/spaces in env values (a common 401 cause).
  const username = env.AFRICAS_TALKING_USERNAME.trim()
  const apiKey = env.AFRICAS_TALKING_API_KEY.trim()
  const from = env.AFRICAS_TALKING_SENDER_ID.trim()
  const host = username === 'sandbox' ? AT_HOSTS.sandbox : AT_HOSTS.live

  // Bulk JSON endpoint per AT docs: https://developers.africastalking.com/docs/sms/sending/bulk
  const res = await fetch(`${host}/version1/messaging/bulk`, {
    method: 'POST',
    headers: {
      apiKey,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      message,
      senderId: from,
      phoneNumbers: [to],
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
