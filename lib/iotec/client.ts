import { env } from '@/lib/env'
import type { CollectionRequest, CollectionViewModel, TokenResponse } from './types'

/** Thrown for any ioTec failure. The message is safe to log but never returned raw to clients. */
export class IotecError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IotecError'
  }
}

/** True when ioTec credentials are configured (merchant onboarding complete). */
export function isIotecConfigured(): boolean {
  return Boolean(env.IOTEC_CLIENT_ID && env.IOTEC_CLIENT_SECRET)
}

// In-memory OAuth token cache, shared across requests in the same server instance.
let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  // Reuse the cached token until 60s before it expires.
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token
  }

  if (!env.IOTEC_CLIENT_ID || !env.IOTEC_CLIENT_SECRET) {
    throw new IotecError('ioTec credentials are not configured')
  }

  const res = await fetch(env.IOTEC_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.IOTEC_CLIENT_ID,
      client_secret: env.IOTEC_CLIENT_SECRET,
    }),
  })

  if (!res.ok) {
    console.error('[iotec auth]', res.status, await res.text().catch(() => ''))
    throw new IotecError('Failed to authenticate with payment provider')
  }

  const json = (await res.json()) as TokenResponse
  cachedToken = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 }
  return json.access_token
}

async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getAccessToken()
  return fetch(`${env.IOTEC_API_URL}${path}`, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${token}` },
  })
}

/** Initiate a mobile-money collection — prompts the payer to approve on their handset. */
export async function initiateCollection(input: {
  payer: string
  amount: number
  externalId: string
  payerNote?: string
}): Promise<CollectionViewModel> {
  const body: CollectionRequest = {
    payer: input.payer,
    amount: input.amount,
    externalId: input.externalId,
    currency: 'UGX',
    category: 'MobileMoney',
    walletId: env.IOTEC_WALLET_ID || undefined,
    payerNote: input.payerNote,
  }

  const res = await authedFetch('/api/collections/collect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    console.error('[iotec collect]', res.status, await res.text().catch(() => ''))
    throw new IotecError('Payment request failed')
  }

  return (await res.json()) as CollectionViewModel
}

/** Fetch the authoritative status of a collection by ioTec transaction id. */
export async function getCollectionStatus(id: string): Promise<CollectionViewModel> {
  const res = await authedFetch(`/api/collections/status/${encodeURIComponent(id)}`)
  if (!res.ok) {
    console.error('[iotec status]', res.status, await res.text().catch(() => ''))
    throw new IotecError('Failed to fetch payment status')
  }
  return (await res.json()) as CollectionViewModel
}

/** Fetch the authoritative status of a collection by our externalId. */
export async function getCollectionByExternalId(externalId: string): Promise<CollectionViewModel> {
  const res = await authedFetch(`/api/collections/external-id/${encodeURIComponent(externalId)}`)
  if (!res.ok) {
    console.error('[iotec status by externalId]', res.status, await res.text().catch(() => ''))
    throw new IotecError('Failed to fetch payment status')
  }
  return (await res.json()) as CollectionViewModel
}
