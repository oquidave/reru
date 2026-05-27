import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server'
import { finalizeCollection } from '@/lib/payments/finalize'
import type { Payment } from '@/types'

/** Constant-time compare of the incoming Authorization header against our shared secret. */
function isAuthorized(req: Request): boolean {
  const expected = env.IOTEC_WEBHOOK_SECRET
  if (!expected) return true // verification disabled until a secret is configured

  const header = req.headers.get('authorization') ?? ''
  const provided = header.startsWith('Bearer ') ? header.slice(7) : header
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * ioTec collection callback. ioTec POSTs the transaction detail when a collection reaches
 * a terminal status, with our shared secret in the Authorization header.
 *
 * Two layers of trust: (1) the Authorization header must match IOTEC_WEBHOOK_SECRET, and
 * (2) the payload is still treated as an untrusted trigger — we only use it to locate our
 * payment row, then `finalizeCollection` re-queries ioTec's status endpoint before applying
 * anything. Reconciliation is idempotent and the status-poll endpoint is a second path to
 * completion, so a 200 is returned for all authorized calls.
 */
export async function POST(req: Request): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  let body: { id?: string; externalId?: string }
  try {
    body = (await req.json()) as { id?: string; externalId?: string }
  } catch {
    return NextResponse.json({ ok: true })
  }

  const iotecId = body.id
  const externalId = body.externalId

  if (!iotecId && !externalId) {
    return NextResponse.json({ ok: true })
  }

  try {
    const service = createSupabaseServiceRoleClient()

    let query = service.from('reru_payments').select('*')
    query = iotecId ? query.eq('iotec_id', iotecId) : query.eq('external_id', externalId as string)
    const { data: payment } = await query.maybeSingle()

    if (payment) {
      await finalizeCollection(service, payment as Payment)
    }
  } catch (error) {
    console.error('[POST /api/webhooks/iotec/collection]', error)
  }

  return NextResponse.json({ ok: true })
}
