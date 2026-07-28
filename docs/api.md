# RERU API Reference

**Base URL (production):** `https://reru.ug`  
**Base URL (local dev):** `http://localhost:3002`

All endpoints return JSON. All request bodies must be `Content-Type: application/json`.

> **BREAKING (this version):** Authentication is now **phone-OTP-first** — new clients register with phone + SMS OTP via the Supabase JS SDK (email/password is an optional secondary login). The old `POST /api/auth/register` endpoint has been removed. The **`zone`** concept has been replaced everywhere by **`location`** (free-form, admin-managed service locations).

---

## Authentication

RERU supports two authentication mechanisms:

### Cookie-based (web app)
The web app signs in via `POST /api/auth/login` and the session is stored in an HTTP-only cookie automatically. Subsequent requests from the browser carry the cookie — no extra headers needed.

### Bearer token (mobile / USSD)
Mobile and USSD clients must pass the access token on every request:

```
Authorization: Bearer <access_token>
```

The `access_token` is returned by `POST /api/auth/login` and `POST /api/auth/refresh`. It expires after **1 hour**. When it expires, call `POST /api/auth/refresh` with the `refresh_token` to get a new pair without requiring the user to log in again.

---

## Standard Response Shape

Every endpoint returns one of two shapes:

```json
// Success
{ "ok": true, "data": { ... } }

// Error
{ "ok": false, "error": "Human-readable message" }
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `400` | Bad request — invalid or missing input |
| `401` | Unauthorized — missing or invalid token/session |
| `404` | Resource not found |
| `409` | Conflict — e.g. already onboarded, or duplicate resource |
| `500` | Internal server error |

---

## Auth Endpoints

### `POST /api/auth/login`

Sign in with a password, using **either** phone **or** email as the identifier. Returns a session with tokens. This is the password-based (secondary) login — phone OTP is the primary path (see [Registration & OTP login](#registration--otp-login) below).

**Request body** (provide `phone` or `email`, plus `password`)
```json
{
  "phone": "+256701234567",
  "password": "secret"
}
```
```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

Phone numbers are E.164 normalized (`+2567XXXXXXXX`) and are the unique identity.

**Response `200`**
```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "uuid",
      "phone": "+256701234567",
      "email": "user@example.com"
    },
    "session": {
      "access_token": "eyJ...",
      "refresh_token": "p77abx...",
      "expires_at": 1777111697
    }
  }
}
```

**Errors**
- `401` — Invalid credentials

---

### `POST /api/auth/logout`

Invalidates the current session. Safe to call even if already signed out.

**Request body** — none required

**Response `200`**
```json
{ "ok": true, "data": null }
```

---

### `POST /api/auth/refresh`

Exchange a refresh token for a new access token. Call this when the access token expires.

**Request body**
```json
{ "refresh_token": "p77abx..." }
```

**Response `200`** — same shape as login response

**Errors**
- `401` — Invalid or expired refresh token

---

### `POST /api/auth/forgot-password`

Sends a password reset email. Always returns `ok: true` regardless of whether the email exists (no enumeration).

**Request body**
```json
{ "email": "user@example.com" }
```

**Response `200`**
```json
{
  "ok": true,
  "data": { "message": "If that email is registered, a reset link has been sent." }
}
```

---

### Registration & OTP login

There is **no custom REST registration endpoint** — `POST /api/auth/register` has been **removed**. Registration and the primary login path are handled **client-side via the Supabase JS SDK** using phone + SMS OTP. Supabase delivers the OTP through the Send-SMS hook (see [`POST /api/auth/sms-hook`](#post-apiauthsms-hook)).

**Web registration flow**

1. Collect Full Name + phone.
2. `supabase.auth.signInWithOtp({ phone, options: { data: { full_name }, shouldCreateUser: true } })` — Supabase sends a 6-digit OTP via the Send-SMS hook.
3. User enters the code → `supabase.auth.verifyOtp({ phone, token, type: 'sms' })` → session created.
4. User is routed to `/onboarding` to complete their profile via [`POST /api/user/onboarding`](#post-apiuseronboarding).

**Login methods**

- **Password (secondary):** `supabase.auth.signInWithPassword({ phone | email, password })`, or the REST [`POST /api/auth/login`](#post-apiauthlogin). Preferred when a password is set, since SMS costs money.
- **OTP (primary):** `supabase.auth.signInWithOtp({ phone })` then `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`.

Phone numbers are E.164 normalized (`+2567XXXXXXXX`); phone is the unique identity.

**Mobile / USSD clients** should either use Supabase phone OTP (`signInWithOtp` / `verifyOtp`) directly, or continue to use [`POST /api/auth/login`](#post-apiauthlogin) with email/password (still supported). After a fresh OTP signup, call [`POST /api/user/onboarding`](#post-apiuseronboarding) to create the client record.

---

## User Endpoints

All `/api/user/*` endpoints require authentication (cookie or Bearer token). The authenticated user only ever sees their own data.

---

### `POST /api/user/onboarding`

Completes a newly-signed-up user's profile by creating their `reru_clients` row. Called once after OTP signup (the user is authenticated but has no client record yet). Optionally sets a secondary email/password login.

**Request body**
```json
{
  "location_id": "uuid",
  "plan": "monthly",
  "collection_day": "Monday",
  "address": "Plot 14, Nsasa Estate, Mukono",
  "landmark": "Near the blue gate",
  "property_type": "household",
  "bin_count": 1,
  "alt_phone": "0701234567",
  "alt_phone_is_whatsapp": false,
  "email": "jane@example.com",
  "password": "secret123"
}
```

| Field | Type | Constraints |
|---|---|---|
| `location_id` | string | UUID of an active service location |
| `plan` | string | `monthly` \| `annual` |
| `collection_day` | string | `Monday` \| `Tuesday` \| `Wednesday` \| `Thursday` \| `Friday` |
| `address` | string | service address |
| `landmark` | string | optional |
| `property_type` | string | `household` \| `business` |
| `bin_count` | number | number of bins |
| `alt_phone` | string | optional — Ugandan phone |
| `alt_phone_is_whatsapp` | boolean | whether `alt_phone` is on WhatsApp |
| `email` | string | optional — sets secondary login + invoicing email |
| `password` | string | optional — sets a password for secondary login |
| `latitude` | number\|null | optional — WGS84, −90…90. See *Pickup coordinates* below |
| `longitude` | number\|null | optional — WGS84, −180…180 |
| `location_accuracy_m` | number\|null | optional — accuracy radius in metres from the device |

#### Pickup coordinates

`latitude` and `longitude` are the household's GPS pickup point, used by the admin map. They are accepted by this endpoint, `PATCH /api/user/profile`, and `PATCH /api/admin/clients/:id`, and behave the same way in all three:

- They are **only valid as a pair.** Sending one without the other clears the stored pin rather than saving half a coordinate; the database enforces the same rule.
- **Omitting both leaves any stored pin untouched.** To clear a pin explicitly, send both as `null`.
- `location_captured_at` is stamped server-side whenever a pin is written — clients never send it.
- `location_accuracy_m` is the device's reported accuracy radius. Send `null` for a hand-placed pin.

Coordinates are stored at 6 decimal places (about 0.1 m); values are rounded on write.

**Response `200`**
```json
{ "ok": true, "data": { "message": "Profile completed" } }
```

**Errors**
- `400` — Validation error
- `409` — Already onboarded (client record exists)

---

### `GET /api/user/me`

Returns the authenticated client's full record plus their role.

**Response `200`**
```json
{
  "ok": true,
  "data": {
    "client": {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Jane Mukasa",
      "phone": "+256701234567",
      "address": "Plot 14, Nsasa Estate, Mukono",
      "location_id": "uuid",
      "location": "Kira",
      "landmark": "Near the blue gate",
      "property_type": "household",
      "bin_count": 1,
      "alt_phone": "0759876543",
      "alt_phone_is_whatsapp": true,
      "collection_day": "Monday",
      "plan": "monthly",
      "status": "active",
      "paid_through": "2026-04-01",
      "created_at": "2026-01-15T10:00:00Z"
    },
    "profile": {
      "role": "client",
      "full_name": "Jane Mukasa"
    }
  }
}
```

---

### `GET /api/user/dashboard`

Single aggregated call returning everything needed for the client home screen. Designed to minimise round-trips for USSD (180 s session limit).

**Response `200`**
```json
{
  "ok": true,
  "data": {
    "client": { ...Client },
    "next_collection": { ...Collection } | null,
    "recent_collections": [ ...Collection ],
    "pending_invoice": { ...Invoice } | null,
    "overdue_invoice_count": 0
  }
}
```

`recent_collections` is the last 5 collections ordered by date descending.  
`next_collection` is the first scheduled collection from that list.

---

### `GET /api/user/collections`

Full collection history for the authenticated client.

**Query params**

| Param | Type | Default | Description |
|---|---|---|---|
| `status` | string | — | Filter: `scheduled` \| `completed` \| `missed` |
| `limit` | number | `50` | 1–100 |
| `offset` | number | `0` | Pagination offset |

**Response `200`**
```json
{
  "ok": true,
  "data": {
    "data": [ ...Collection ],
    "total": 42
  }
}
```

---

### `GET /api/user/collections/upcoming`

Returns the next N scheduled collections from today. Useful for USSD and home screen widgets.

**Query params**

| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | number | `1` | 1–10 |

**Response `200`**
```json
{
  "ok": true,
  "data": [ ...Collection ]
}
```

---

### `GET /api/user/invoices`

Invoice list for the authenticated client.

**Query params**

| Param | Type | Default | Description |
|---|---|---|---|
| `status` | string | — | Filter: `pending` \| `paid` \| `overdue` |

**Response `200`**
```json
{
  "ok": true,
  "data": [ ...Invoice ]
}
```

---

### `GET /api/user/invoices/:id`

Single invoice by ID. Returns `404` if the invoice belongs to a different client.

**Response `200`**
```json
{
  "ok": true,
  "data": { ...Invoice }
}
```

---

> Full integration guide (flow, config, security, testing, troubleshooting): [`docs/payments.md`](./payments.md).

### `POST /api/user/invoices/:id/pay`

Start an in-app mobile-money payment for the caller's own unpaid invoice (ioTec collection).
ioTec sends an approval prompt to the payer's phone. The amount is always the invoice total —
it is never taken from the request. An in-flight attempt for the same invoice is reused rather
than charging twice.

**Request body**

| Field | Type | Description |
|---|---|---|
| `phone` | string? | Mobile money number. Defaults to the client's stored phone. |

**Response `200`**
```json
{
  "ok": true,
  "data": { "paymentId": "uuid", "status": "pending" }
}
```

**Errors:** `400` already paid / invalid body · `404` not your invoice · `502` provider unreachable · `503` payments not enabled (no ioTec credentials configured).

---

### `GET /api/user/payments/:id`

Status of a payment attempt. While the payment is non-terminal, this endpoint reconciles
against ioTec, so polling it drives the payment to completion even if the webhook never arrives.
Poll every ~4s until `status` is terminal (`success` \| `failed` \| `cancelled`).

**Response `200`**
```json
{
  "ok": true,
  "data": { ...Payment }
}
```

Returns `404` if the payment belongs to a different client.

---

## Admin Endpoints

All `/api/admin/*` endpoints require authentication with an admin or superadmin role. A client-role token will receive `401`.

---

### `GET /api/admin/overview`

Aggregated dashboard stats: client counts, invoice counts, today's collection progress, and the 5 oldest overdue invoices.

**Response `200`**
```json
{
  "ok": true,
  "data": {
    "clients": {
      "total": 120,
      "active": 115,
      "suspended": 5
    },
    "invoices": {
      "paid": 98,
      "pending": 18,
      "overdue": 4
    },
    "collections": {
      "today_total": 22,
      "today_completed": 18,
      "today_missed": 2
    },
    "recent_overdue": [
      {
        "id": "INV-2026-001",
        "date": "2026-03-01",
        "total": 26500,
        "client_name": "Jane Mukasa",
        "client_location": "Kira"
      }
    ]
  }
}
```

---

### Service Locations

Service locations replace the old fixed `Zone A/B/C` concept. They are free-form, admin-managed, and referenced by clients via `location_id`.

#### `GET /api/admin/locations`

List all service locations, including inactive ones.

**Response `200`**
```json
{
  "ok": true,
  "data": [
    { "id": "uuid", "name": "Kira", "active": true, "created_at": "2026-01-10T08:00:00Z" }
  ]
}
```

#### `POST /api/admin/locations`

Create a new service location.

**Request body**
```json
{ "name": "Namugongo" }
```

**Response `200`**
```json
{ "ok": true, "data": { "id": "uuid", "name": "Namugongo", "active": true, "created_at": "2026-06-09T08:00:00Z" } }
```

**Errors**
- `409` — A location with that name already exists

#### `PATCH /api/admin/locations/:id`

Rename a location and/or enable/disable it. Send only the fields you want to change.

**Request body** (all fields optional)
```json
{ "name": "Nsasa", "active": false }
```

| Field | Type | Constraints |
|---|---|---|
| `name` | string | optional — new name |
| `active` | boolean | optional — enable/disable |

**Response `200`**
```json
{ "ok": true, "data": { ...ServiceLocation } }
```

---

### `GET /api/admin/clients`

List all active clients (id, name, location).

> **Note:** Currently returns only `status = active` clients. Suspended clients are not included — this will be updated to support `?status` filtering.

**Response `200`**
```json
{
  "ok": true,
  "data": [
    { "id": "uuid", "name": "Jane Mukasa", "location": "Kira" }
  ]
}
```

---

### `POST /api/admin/clients`

Admin-create a new client account. Sets a random initial password and sends a password-setup link to the client's email.

**Request body**
```json
{
  "name": "Jane Mukasa",
  "email": "jane@example.com",
  "phone": "0701234567",
  "address": "Plot 14, Nsasa Estate, Mukono",
  "location_id": "uuid",
  "collection_day": "Monday",
  "plan": "monthly"
}
```

**Response `200`**
```json
{
  "ok": true,
  "data": { "id": "uuid", "name": "Jane Mukasa" }
}
```

**Errors**
- `409` — Email already registered

---

### `GET /api/admin/clients/:id`

Full client record by ID.

**Response `200`**
```json
{ "ok": true, "data": { ...Client } }
```

---

### `PATCH /api/admin/clients/:id`

Update editable fields on a client. Send only the fields you want to change.

**Request body** (all fields optional)
```json
{
  "address": "New address",
  "location_id": "uuid",
  "collection_day": "Wednesday",
  "plan": "annual",
  "latitude": 0.353600,
  "longitude": 32.755400,
  "location_accuracy_m": 12.5
}
```

Coordinates follow the pair rules in *Pickup coordinates* under `POST /api/user/onboarding`: omit both to leave the stored pin alone, send both as `null` to clear it.

**Response `200`**
```json
{ "ok": true, "data": { ...Client } }
```

---

### `POST /api/admin/clients/:id/suspend`

Suspend or reactivate a client account.

**Request body**
```json
{
  "action": "suspend",
  "reason": "Three consecutive missed payments since January 2026"
}
```

| Field | Type | Constraints |
|---|---|---|
| `action` | string | `suspend` \| `reactivate` |
| `reason` | string | 10–1000 chars |

**Response `200`**
```json
{
  "ok": true,
  "data": {
    "status": "suspended",
    "client": { ...Client }
  }
}
```

---

### `GET /api/admin/collections`

All collections across all clients, with client details joined.

**Query params**

| Param | Type | Default | Description |
|---|---|---|---|
| `date` | string | — | Filter by date: `YYYY-MM-DD` |
| `status` | string | — | `scheduled` \| `completed` \| `missed` |
| `location_id` | string | — | UUID of a service location |
| `limit` | number | `50` | 1–100 |
| `offset` | number | `0` | Pagination offset |

**Response `200`**
```json
{
  "ok": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "client_id": "uuid",
        "scheduled_date": "2026-04-30",
        "status": "scheduled",
        "bags_collected": null,
        "notes": null,
        "completed_at": null,
        "reru_clients": {
          "name": "Jane Mukasa",
          "location": "Kira",
          "address": "Plot 14, Nsasa Estate, Mukono"
        }
      }
    ],
    "total": 17
  }
}
```

---

### `POST /api/admin/collections`

Schedule a one-off collection for one or more specific clients on a chosen date. Use this for ad-hoc pickups; use `bulk-schedule` to generate the recurring weekly rota.

Clients that already have a collection on that date are left untouched, so the call is safe to re-run.

**Request body**
```json
{
  "client_ids": ["8f3c…", "b21a…"],
  "scheduled_date": "2026-08-04",
  "notes": "Extra pickup after public holiday"
}
```

| Field | Type | Constraints |
|---|---|---|
| `client_ids` | string[] | 1–200 client UUIDs, required |
| `scheduled_date` | string | `YYYY-MM-DD`, required |
| `notes` | string | max 1000 chars, optional |

**Response `200`**
```json
{ "ok": true, "data": { "scheduled": 2, "already_scheduled": 0 } }
```

`scheduled` counts newly created records; `already_scheduled` counts requested clients that already had one for that date.

**Errors** — `400` invalid body or unknown client id · `401` not an admin

---

### `PATCH /api/admin/collections/:id`

Update a collection — mark completed or missed, record bags collected, add notes.

The admin web UI captures `bags_collected` in the same request that sets `status: "completed"`, since that is the only moment the crew knows the count. Other clients should do the same; a completed collection with no bag count is counted in `completed_without_bags` on `GET /api/admin/statistics`.

**Request body** (all fields optional, at least one required)
```json
{
  "status": "completed",
  "bags_collected": 3,
  "notes": "Extra bag collected at gate"
}
```

| Field | Type | Constraints |
|---|---|---|
| `status` | string | `completed` \| `missed` |
| `bags_collected` | number | 0–100 |
| `notes` | string | max 1000 chars |

When `status` is set to `completed`, `completed_at` is automatically set to the current timestamp.

**Response `200`**
```json
{ "ok": true, "data": { ...Collection } }
```

---

### `POST /api/admin/collections/bulk-schedule`

Generate scheduled collection records for all active clients for the next N weeks, based on each client's `collection_day`. Skips any date that already has a record (safe to re-run).

Clients with no `collection_day`, or a value outside `Monday`–`Saturday`, are skipped and reported in `skipped_clients` rather than failing the run.

**Request body**
```json
{ "weeks_ahead": 4 }
```

| Field | Type | Constraints | Default |
|---|---|---|---|
| `weeks_ahead` | number | 1–8 | `4` |

**Response `200`**
```json
{ "ok": true, "data": { "scheduled": 72, "already_scheduled": 16, "skipped_clients": 0 } }
```

| Field | Meaning |
|---|---|
| `scheduled` | Records newly created by this call |
| `already_scheduled` | Dates that already had a record and were left alone |
| `skipped_clients` | Active clients with a missing or unrecognised collection day |

---

### `GET /api/admin/statistics`

Collection volume and service-reliability statistics. `totals` are all-time; `weekly` and `by_location` cover the requested window.

Weeks begin on Monday. Every week in the window is present in `weekly`, including weeks with no activity (all zeros), so clients can plot the series without filling gaps themselves.

**Query params**

| Param | Type | Constraints | Default |
|---|---|---|---|
| `weeks` | number | 1–104 | `12` |

**Response `200`**
```json
{
  "ok": true,
  "data": {
    "totals": {
      "bags": 50,
      "completed": 19,
      "missed": 3,
      "scheduled": 25,
      "completion_rate": 76,
      "average_bags_per_collection": 2.63,
      "completed_without_bags": 1
    },
    "current_week": { "week_start": "2026-07-27", "bags": 12, "change_vs_previous_week": -3 },
    "weekly": [
      { "week_start": "2026-05-11", "scheduled_total": 4, "completed": 4, "missed": 0, "bags": 11 }
    ],
    "by_location": [
      { "location": "Nsasa", "scheduled_total": 16, "completed": 14, "missed": 2, "bags": 36 }
    ]
  }
}
```

`completed_without_bags` counts completed collections with no bag count recorded — those understate `bags`, so surface it rather than presenting the total as exact. Clients with no service location are grouped under `"Unassigned"`.

**Errors** — `400` invalid `weeks` · `401` not an admin

---

### `GET /api/admin/schedule`

Today's collection schedule with client details. Equivalent to `GET /api/admin/collections?date=today` but adds summary counts.

**Query params**

| Param | Type | Default | Description |
|---|---|---|---|
| `date` | string | today | `YYYY-MM-DD` |
| `location_id` | string | — | UUID of a service location |

**Response `200`**
```json
{
  "ok": true,
  "data": {
    "date": "2026-04-25",
    "total": 22,
    "completed": 18,
    "missed": 2,
    "pending": 2,
    "entries": [
      {
        "id": "uuid",
        "client_id": "uuid",
        "scheduled_date": "2026-04-25",
        "status": "completed",
        "bags_collected": 2,
        "notes": null,
        "completed_at": "2026-04-25T09:14:00Z",
        "reru_clients": {
          "name": "Jane Mukasa",
          "location": "Kira",
          "address": "Plot 14, Nsasa Estate, Mukono",
          "phone": "0701234567"
        }
      }
    ]
  }
}
```

---

### `GET /api/admin/invoices`

Invoice list across all clients, with client details joined.

**Query params**

| Param | Type | Default | Description |
|---|---|---|---|
| `status` | string | — | `pending` \| `paid` \| `overdue` |
| `location_id` | string | — | UUID of a service location |
| `limit` | number | `50` | 1–100 |
| `offset` | number | `0` | Pagination offset |

**Response `200`**
```json
{
  "ok": true,
  "data": {
    "data": [
      {
        "id": "INV-2026-005",
        "client_id": "uuid",
        "date": "2026-05-01",
        "plan": "monthly",
        "qty": 1,
        "unit_price": 25000,
        "subtotal": 25000,
        "tax": 1500,
        "total": 26500,
        "status": "pending",
        "paid_at": null,
        "payment_method": null,
        "payment_ref": null,
        "reru_clients": {
          "name": "Jane Mukasa",
          "location": "Kira",
          "phone": "0701234567"
        }
      }
    ],
    "total": 18
  }
}
```

---

### `POST /api/admin/invoices`

Generate invoices for all active clients (or a specific subset) for a given billing period.

**Request body**
```json
{
  "date": "2026-05-01",
  "plan": "monthly",
  "client_ids": ["uuid", "uuid"]
}
```

| Field | Type | Constraints |
|---|---|---|
| `date` | string | `YYYY-MM-DD` — billing date |
| `plan` | string | `monthly` \| `annual` |
| `client_ids` | string[] | optional — omit to generate for all active clients |

**Pricing applied automatically**

| Plan | Unit price | Tax | Total |
|---|---|---|---|
| `monthly` | UGX 25,000 | UGX 1,500 | UGX 26,500 |
| `annual` | UGX 20,000 × 12 | UGX 14,400 | UGX 254,400 |

**Response `200`**
```json
{ "ok": true, "data": { "generated": 115 } }
```

---

### `POST /api/admin/invoices/:id/mark-paid`

Record a payment against an invoice.

**Request body**
```json
{
  "payment_method": "mtn_momo",
  "payment_ref": "TXN123456",
  "paid_at": "2026-04-25T10:00:00Z"
}
```

| Field | Type | Constraints |
|---|---|---|
| `payment_method` | string | `mtn_momo` \| `airtel` \| `bank_transfer` \| `cash` |
| `payment_ref` | string | optional, max 200 chars |
| `paid_at` | string | optional ISO 8601 datetime — defaults to now |

**Response `200`**
```json
{ "ok": true, "data": { ...Invoice } }
```

**Errors**
- `400` — Invoice is already marked as paid

---

### `POST /api/admin/invoices/:id/mark-overdue`

Mark a pending invoice as overdue. Cannot be applied to already-paid invoices.

**Request body** — none required

**Response `200`**
```json
{ "ok": true, "data": { ...Invoice } }
```

**Errors**
- `400` — Cannot mark a paid invoice as overdue

---

### `GET /api/admin/invoices/export`

Download all invoices as a CSV file.

**Query params**

| Param | Type | Default | Description |
|---|---|---|---|
| `status` | string | — | `pending` \| `paid` \| `overdue` |

**Response** — `Content-Type: text/csv`, file download

CSV columns: `Invoice ID, Client Name, Location, Phone, Date, Plan, Qty, Unit Price, Subtotal, Tax, Total, Status, Paid At, Payment Method, Payment Ref`

---

## Data Models

### Client
```
id                    string   UUID
user_id               string   UUID — links to auth user
name                  string
phone                 string   E.164 (+2567XXXXXXXX) — unique identity
address               string?  filled at onboarding
location_id           string?  UUID — FK to ServiceLocation
location              string?  joined location name (e.g. "Kira")
landmark              string?
property_type         string?  "household" | "business"
bin_count             number?
alt_phone             string?
alt_phone_is_whatsapp boolean
collection_day        string?  "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" — filled at onboarding
plan                  string?  "monthly" | "annual" — filled at onboarding
status                string   "active" | "suspended" | "cancelled"
paid_through          string?  YYYY-MM-DD — date of last settled invoice
latitude              number?  WGS84 pickup point — always paired with longitude
longitude             number?  WGS84 pickup point — always paired with latitude
location_accuracy_m   number?  device accuracy radius in metres; null for a hand-placed pin
location_captured_at  string?  ISO 8601 — stamped server-side when a pin is written
created_at            string   ISO 8601
```

`latitude`/`longitude` are null until a pickup point is captured. Treat them as a pair: either both are present or both are null. See *Pickup coordinates* under `POST /api/user/onboarding`.

### ServiceLocation
```
id          string   UUID
name        string   e.g. "Kira", "Nsasa", "Namugongo"
active      boolean  inactive locations are hidden from client onboarding
created_at  string   ISO 8601
```

### Invoice
```
id             string   e.g. "INV-2026-005"
client_id      string   UUID
date           string   YYYY-MM-DD — billing date
plan           string
qty            number
unit_price     number   UGX
subtotal       number   UGX
tax            number   UGX
total          number   UGX
status         string   "pending" | "paid" | "overdue"
paid_at        string?  ISO 8601
payment_method string?  "mtn_momo" | "airtel" | "bank_transfer" | "cash"
payment_ref    string?
created_at     string   ISO 8601
```

#### Presenting a paid invoice as a receipt

There is no separate receipt resource — a paid invoice **is** the receipt. Every client should render `status: "paid"` differently from an unpaid invoice:

- Title the document **Receipt**, not Invoice
- Show `paid_at`, `payment_method`, and `payment_ref` as proof of payment
- **Drop the payment instructions.** Showing MoMo/Airtel/bank details to someone who has already paid is the specific bug this convention exists to prevent
- Offer the download as `RECEIPT-<invoice id>.pdf`

`paid_at`, `payment_method`, and `payment_ref` are nullable even when `status` is `paid` — an older row, or one marked paid without full details. Render "Not recorded" rather than blank or `undefined`; a receipt with a missing field is still valid proof, but a receipt showing `undefined` is not.

### Collection
```
id             string   UUID
client_id      string   UUID
scheduled_date string   YYYY-MM-DD
status         string   "scheduled" | "completed" | "missed"
bags_collected number?
notes          string?
recorded_by    string?  UUID of admin who recorded the outcome
completed_at   string?  ISO 8601
created_at     string   ISO 8601
```

### Payment
```
id            string   UUID
invoice_id    string   UUID
client_id     string   UUID
external_id   string   our reference sent to ioTec
iotec_id      string?  ioTec transaction id
amount        number   UGX
currency      string   "UGX"
payer_phone   string
vendor        string?  ioTec vendor (e.g. "Mtn", "Airtel")
status        string   "pending" | "sent" | "success" | "failed" | "cancelled"
status_code   string?
error_message string?
created_at    string   ISO 8601
updated_at    string   ISO 8601
processed_at  string?  ISO 8601 — set when terminal
```

---

## Webhooks

### `POST /api/auth/sms-hook`

Supabase Auth **Send-SMS hook**. Called server-to-server by Supabase (never by clients) to deliver OTP codes via Africa's Talking. Each request is verified with a Standard Webhooks signature derived from `SUPABASE_SEND_SMS_HOOK_SECRET`; requests that fail verification are rejected.

**Payload** (sent by Supabase)
```json
{
  "user": { "phone": "+256701234567" },
  "sms": { "otp": "123456" }
}
```

**Response `200`**
```json
{}
```

Configure this URL as the Send-SMS hook in the Supabase Auth dashboard and set the matching `SUPABASE_SEND_SMS_HOOK_SECRET` in the server environment.

---

### `POST /api/webhooks/iotec/collection`

ioTec calls this when a collection reaches a terminal status. ioTec attaches a shared secret as
`Authorization: Bearer <IOTEC_WEBHOOK_SECRET>`; requests that don't match are rejected `401`.
The payload is still treated as an untrusted trigger: the server re-queries ioTec's status
endpoint before applying any change, and the update is idempotent. Authorized calls respond
`200 { ok: true }`.

Configure this URL — plus the Security Header (`Authorization`) and its value
(`Bearer <secret>`) — in the ioTec Pay portal Settings tab, and set the same secret as
`IOTEC_WEBHOOK_SECRET` in the server environment.

---

## Known Gaps (planned)

- Rate limiting / abuse protection on `/api/auth/login`, `/api/auth/sms-hook` (OTP abuse), and `/api/user/invoices/:id/pay` — required before production
- `GET /api/admin/clients?status=suspended` — suspended clients not yet queryable via API
- `GET /api/admin/collections/:id` and `GET /api/admin/invoices/:id` — single-item admin detail endpoints
- `POST /api/user/device-token` — push notification token registration (v2)
- SMS via Africa's Talking is **implemented** for auth OTP delivery; SMS reminder/notification triggers (collection reminders, payment nudges) are still planned (v2)
- Disbursements / payouts via ioTec — not implemented (collections only)
