# Payments — ioTec Pay Integration

How RERU clients pay invoices in-app via **MTN MoMo** and **Airtel Money**, powered by
[ioTec Pay](https://iotec.io) collections. This is the source of truth for the payments
feature; `api.md` is the contract clients read, this doc explains how it works end to end.

- **Scope:** collections only (clients paying in). No disbursements/payouts.
- **Currency:** UGX. ioTec minimum collection is **500**.
- **Status:** live in production.

---

## Flow

```
Client                Web/API                 ioTec Pay              Client phone
  │  tap "Pay"           │                        │                       │
  ├─────────────────────►│ POST .../pay           │                       │
  │                      ├──ensure payment row────►│ (reru_payments)       │
  │                      ├──collect (amount=total)─►│                      │
  │                      │◄── id + status ─────────┤                       │
  │◄── paymentId,status ─┤                        ├── push prompt ───────►│
  │                      │                        │                       │ approve + PIN
  │  poll every ~4s      │                        │                       │
  ├─────────────────────►│ GET /payments/:id      │                       │
  │                      ├── re-query status ─────►│◄── Success ───────────┤
  │                      ├── mark invoice paid     │                       │
  │◄── success ──────────┤                        │                       │
                         ▲                        │
                         └──── webhook (also) ─────┘  (terminal status)
```

1. Client opens a `pending`/`overdue` invoice and taps **Pay with Mobile Money**, confirming
   the phone number (defaults to their stored number).
2. `POST /api/user/invoices/[id]/pay` creates a `reru_payments` row and calls ioTec `collect`.
   **The amount is read server-side from the invoice — never from the request body.**
3. ioTec sends an approval prompt to the payer's phone.
4. Confirmation converges through **two independent paths** (see [Confirmation](#confirmation--reconciliation)):
   the **webhook** and **client polling**. Whichever arrives first finalizes the payment.
5. On confirmed success: the payment row → `success`, the invoice → `paid` with
   `payment_method` (`mtn_momo`/`airtel`) and `payment_ref` (ioTec id), and the client's
   `paid_through` advances.

---

## ioTec Pay API reference

### Authentication

OAuth2 **client credentials**. Exchange `client_id` + `client_secret` for a bearer token:

```
POST https://id.iotec.io/connect/token        (application/x-www-form-urlencoded)
  grant_type=client_credentials
  client_id=<IOTEC_CLIENT_ID>
  client_secret=<IOTEC_CLIENT_SECRET>
→ { access_token, expires_in }
```

The token is cached in-memory and reused until 60s before expiry (`lib/iotec/client.ts`).
All API calls send `Authorization: Bearer <access_token>`.

### Endpoints used

| Method & path | Purpose |
|---|---|
| `POST /api/collections/collect` | Initiate a mobile-money collection (prompts the payer) |
| `GET /api/collections/status/{id}` | Authoritative status by ioTec transaction id |
| `GET /api/collections/external-id/{externalId}` | Authoritative status by our reference |

Base URL: `https://pay.iotec.io` (`IOTEC_API_URL`).

**Collect request fields:** `payer` (MSISDN), `amount` (≥500), `externalId` (our reference),
`currency` (`UGX`), `category` (`MobileMoney`), `walletId` (optional, our merchant wallet),
`payerNote`. ioTec resolves the network (MTN vs Airtel) from the number — no network picker.

**Status / vendor values** we map from:

| ioTec status | Our `reru_payments.status` | Terminal |
|---|---|---|
| `Success` | `success` | yes |
| `Failed`, `Rejected`, `RolledBack` | `failed` | yes |
| `Cancelled` | `cancelled` | yes |
| `SentToVendor` | `sent` | no |
| `Pending`, `AwaitingApproval`, `Scheduled` | `pending` | no |

| ioTec vendor | Our `payment_method` |
|---|---|
| `Mtn`, `MtnMerchant` | `mtn_momo` |
| `Airtel`, `AirtelMerchant` | `airtel` |

Mapping lives in `lib/iotec/types.ts` (`mapIotecStatus`, `vendorToPaymentMethod`).

### Test MSISDNs (sandbox credentials only)

`011177777x` → Success · `011177799x` → Failed · `011177778x` → Pending ·
`011177779x` → SentToVendor. These work **only with sandbox credentials** — with live
credentials they do nothing; test with a small real amount instead.

---

## Data model — `reru_payments`

One row per payment attempt. Migration: `supabase/migrations/20260423000007_create_reru_payments.sql`.

```
id            uuid    PK
invoice_id    text    FK → reru_invoices(id)   (invoice ids are text, e.g. "INV-2026-005")
client_id     uuid    FK → reru_clients(id)
external_id   text    UNIQUE — our reference sent to ioTec as externalId
iotec_id      text    ioTec transaction id (set once the collection is created)
amount        integer UGX
currency      text    default 'UGX'
payer_phone   text
vendor        text    ioTec vendor (e.g. "Mtn", "Airtel")
status        text    pending | sent | success | failed | cancelled
status_code   text
error_message text
created_at    timestamptz
updated_at    timestamptz
processed_at  timestamptz   (set when terminal)
```

**RLS:** clients `SELECT` their own rows (`client_id = app.current_client_id()`), admins
`SELECT` all (`app.is_admin()`). **No INSERT/UPDATE policies** — every write goes through the
service-role client. See [Why a true service-role client](#why-a-true-service-role-client).

---

## API endpoints

### `POST /api/user/invoices/:id/pay`

Auth: client (cookie or Bearer). Starts a collection for the caller's own unpaid invoice.
Reuses an in-flight (`pending`/`sent`) attempt for the same invoice instead of charging twice.

Body: `{ "phone"?: string }` (defaults to the client's stored phone).
Success: `{ ok: true, data: { paymentId, status } }`.
Errors: `400` already paid / invalid · `404` not your invoice · `502` provider unreachable ·
`503` payments not configured.

### `GET /api/user/payments/:id`

Auth: client. Returns the payment, and while non-terminal **reconciles against ioTec** before
responding. Poll every ~4s until `status` is terminal. `404` if it isn't the caller's payment.

### `POST /api/webhooks/iotec/collection`

Public (no session). ioTec calls it when a collection reaches a terminal status. See
[Security](#security) and [Confirmation](#confirmation--reconciliation).

---

## Confirmation & reconciliation

Confirmation is **not** trusted from a single source. Two paths converge on the same idempotent
finalizer, `finalizeCollection` (`lib/payments/finalize.ts`):

- **Webhook** — fast path. ioTec POSTs the transaction detail; we use it only to locate the
  payment row.
- **Polling** — resilient path. The status endpoint re-queries ioTec and reconciles.

Both always re-query `GET /api/collections/status/{id}` before applying anything, so a forged or
stale webhook payload can't mark an invoice paid. Because polling reconciles, **the flow
completes even if the webhook never arrives** (e.g. local dev with no public URL). Finalization
is idempotent: terminal payments are returned unchanged, and a paid invoice is a no-op.

---

## Security

- **Webhook authentication.** ioTec attaches a shared secret as
  `Authorization: Bearer <IOTEC_WEBHOOK_SECRET>`; the route rejects mismatches with `401` using a
  constant-time compare. Verification is enforced only when the secret is set.
- **Re-query before trust.** Webhook payloads are untrusted triggers; status is always confirmed
  against ioTec.
- **Server-side amount.** The charge is the invoice total, read on the server — the client can't
  influence it.
- **Idempotency.** Only `pending → success` once; double webhooks / overlapping polls are safe.
- **No secrets in responses.** ioTec error bodies are logged, never returned to clients.

### Why a true service-role client

`reru_payments` has RLS on with no user write policy, so payment writes must run as
`service_role`. Use **`createSupabaseServiceRoleClient()`** (`lib/supabase/server.ts`) — plain
`@supabase/supabase-js`, **no cookies**.

> ⚠️ Do **not** use the cookie-based `createSupabaseServerClientWithServiceRole()` for these
> writes. `@supabase/ssr` picks up the logged-in user's session cookie and sends the user's JWT
> instead of the service-role key, so the write runs as the authenticated user and RLS blocks it.
> This caused the original *"Could not start payment"* failure.

---

## Configuration

### Environment variables (`lib/env.ts`)

| Var | Required | Notes |
|---|---|---|
| `IOTEC_CLIENT_ID` | yes (to enable) | From ioTec onboarding |
| `IOTEC_CLIENT_SECRET` | yes (to enable) | From ioTec onboarding |
| `IOTEC_WALLET_ID` | optional | Merchant wallet to receive funds |
| `IOTEC_WEBHOOK_SECRET` | recommended | Shared secret for callback auth (`openssl rand -hex 32`) |
| `IOTEC_AUTH_URL` | no | Default `https://id.iotec.io/connect/token` |
| `IOTEC_API_URL` | no | Default `https://pay.iotec.io` |

All are optional in the schema so the app builds/runs before onboarding; when credentials are
absent, `POST .../pay` returns `503`. Set these in **Vercel → Production** (the callback and the
live flow run on `reru.odukar.com`, not local `.env.local`).

### ioTec Pay portal (Settings tab)

- **Callback URL:** `https://reru.odukar.com/api/webhooks/iotec/collection`
- **Security Header:** `Authorization`
- **Security Header Value:** `Bearer <IOTEC_WEBHOOK_SECRET>` (must match the env value)

---

## Code map

| File | Responsibility |
|---|---|
| `lib/iotec/client.ts` | Token cache, `initiateCollection`, status lookups, `isIotecConfigured`, `IotecError` |
| `lib/iotec/types.ts` | Request/response types, status & vendor enums, mapping helpers |
| `lib/invoices/apply-payment.ts` | `applyPaymentToInvoice` — mark paid, advance `paid_through`, optional audit (shared with admin mark-paid) |
| `lib/payments/finalize.ts` | `finalizeCollection` — idempotent reconcile-and-apply |
| `lib/supabase/server.ts` | `createSupabaseServiceRoleClient` (cookie-less) |
| `app/api/user/invoices/[id]/pay/route.ts` | Initiate collection |
| `app/api/user/payments/[id]/route.ts` | Status + reconcile |
| `app/api/webhooks/iotec/collection/route.ts` | ioTec callback |
| `components/invoices/pay-with-momo-dialog.tsx` | Pay dialog + polling states |
| `components/invoices/invoice-detail.tsx` | Pay button (unpaid invoices only) |

---

## Testing

Because polling reconciles against ioTec, the full flow can be exercised on **localhost** (the
webhook can't reach localhost, but polling completes it). With live credentials, this is a real
charge.

1. Ensure `IOTEC_*` vars are set (local `.env.local` for dev, Vercel for prod).
2. Have a client login and a small `pending` invoice. A UGX **500** invoice (ioTec minimum) keeps
   test cost minimal — e.g. insert one for a client via the Supabase MCP / SQL editor.
3. Log in as the client → **Dashboard → Invoices →** the invoice → **Pay with Mobile Money** →
   enter a real MoMo number → approve on the phone.
4. Watch `reru_payments` transition `pending → sent → success` and the invoice flip to `paid`:

```sql
SELECT status, status_code, error_message, vendor, iotec_id, updated_at
FROM reru_payments WHERE invoice_id = '<INVOICE_ID>' ORDER BY created_at DESC;
```

**Mobile/USSD clients** use the same endpoints with `Authorization: Bearer <access_token>` and
poll `GET /api/user/payments/:id`.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| **"Could not start payment"** (no `reru_payments` row) | Payment write blocked by RLS — must use `createSupabaseServiceRoleClient()`, not the cookie-based client. |
| `503` "payments not available" | `IOTEC_CLIENT_ID` / `IOTEC_CLIENT_SECRET` missing in the environment. |
| `502` "could not reach provider" | ioTec auth/collect failed — check Vercel function logs for `[iotec ...]`; verify credentials and that the client has wallet/collection rights. |
| Webhook returns `401` | `IOTEC_WEBHOOK_SECRET` doesn't match the portal's Security Header Value. |
| Stuck on `pending`/`sent` | Payer hasn't approved yet, or the status endpoint is unreachable — polling retries; confirm `IOTEC_API_URL` and credentials. |
| Invoice not flipping to `paid` after success | Check `finalizeCollection` ran with the service-role client and that the invoice wasn't already terminal. |

Raw ioTec interaction logs (`[iotec ...]`, `[POST /api/...]`) are in **Vercel → Project → Logs**
(filter by route). The `reru_payments` table is the authoritative record of attempts.

---

## Operational notes

- Funds settle into the configured ioTec **merchant wallet** (`IOTEC_WALLET_ID`), minus ioTec
  transaction charges.
- **Going live:** with live credentials, the first real payment should use a small amount to
  confirm prompt → approval → `paid` before relying on it.
- **Not implemented:** disbursements/payouts, refunds, and rate limiting on `POST .../pay`
  (tracked in `api.md` Known Gaps; rate limiting is recommended before scaling).
