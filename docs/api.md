# RERU API Reference

**Base URL (production):** `https://reru.odukar.com`  
**Base URL (local dev):** `http://localhost:3002`

All endpoints return JSON. All request bodies must be `Content-Type: application/json`.

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
| `409` | Conflict — e.g. email already registered |
| `500` | Internal server error |

---

## Auth Endpoints

### `POST /api/auth/login`

Sign in with email and password. Returns a session with tokens.

**Request body**
```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

**Response `200`**
```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "uuid",
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
- `401` — Invalid email or password

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

### `POST /api/auth/register`

Self-registration for new clients (web only — admin-created clients use `POST /api/admin/clients`).

**Request body**
```json
{
  "name": "Jane Mukasa",
  "email": "jane@example.com",
  "phone": "0701234567",
  "address": "Plot 14, Nsasa Estate, Mukono",
  "zone": "Zone A",
  "collection_day": "Monday",
  "plan": "monthly",
  "password": "secret123"
}
```

| Field | Type | Constraints |
|---|---|---|
| `name` | string | 2–200 chars |
| `email` | string | valid email |
| `phone` | string | 10–20 chars |
| `address` | string | 5–500 chars |
| `zone` | string | `Zone A` \| `Zone B` \| `Zone C` |
| `collection_day` | string | `Monday` \| `Tuesday` \| `Wednesday` \| `Thursday` \| `Friday` |
| `plan` | string | `monthly` \| `annual` |
| `password` | string | 6–100 chars |

**Response `200`**
```json
{ "ok": true, "data": { "message": "Account created" } }
```

**Errors**
- `400` — Validation error
- `409` — Email already registered

---

## User Endpoints

All `/api/user/*` endpoints require authentication (cookie or Bearer token). The authenticated user only ever sees their own data.

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
      "phone": "0701234567",
      "address": "Plot 14, Nsasa Estate, Mukono",
      "zone": "Zone A",
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
        "client_zone": "Zone A"
      }
    ]
  }
}
```

---

### `GET /api/admin/clients`

List all active clients (id, name, zone).

> **Note:** Currently returns only `status = active` clients. Suspended clients are not included — this will be updated to support `?status` filtering.

**Response `200`**
```json
{
  "ok": true,
  "data": [
    { "id": "uuid", "name": "Jane Mukasa", "zone": "Zone A" }
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
  "zone": "Zone A",
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
  "zone": "Zone B",
  "collection_day": "Wednesday",
  "plan": "annual"
}
```

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
| `zone` | string | — | `Zone A` \| `Zone B` \| `Zone C` |
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
          "zone": "Zone A",
          "address": "Plot 14, Nsasa Estate, Mukono"
        }
      }
    ],
    "total": 17
  }
}
```

---

### `PATCH /api/admin/collections/:id`

Update a collection — mark completed or missed, record bags collected, add notes.

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

Generate scheduled collection records for all active clients for the next N weeks. Skips any date that already has a record (safe to re-run).

**Request body**
```json
{ "weeks_ahead": 4 }
```

| Field | Type | Constraints | Default |
|---|---|---|---|
| `weeks_ahead` | number | 1–8 | `4` |

**Response `200`**
```json
{ "ok": true, "data": { "scheduled": 88 } }
```

---

### `GET /api/admin/schedule`

Today's collection schedule with client details. Equivalent to `GET /api/admin/collections?date=today` but adds summary counts.

**Query params**

| Param | Type | Default | Description |
|---|---|---|---|
| `date` | string | today | `YYYY-MM-DD` |
| `zone` | string | — | `Zone A` \| `Zone B` \| `Zone C` |

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
          "zone": "Zone A",
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
| `zone` | string | — | `Zone A` \| `Zone B` \| `Zone C` |
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
          "zone": "Zone A",
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

CSV columns: `Invoice ID, Client Name, Zone, Phone, Date, Plan, Qty, Unit Price, Subtotal, Tax, Total, Status, Paid At, Payment Method, Payment Ref`

---

## Data Models

### Client
```
id             string   UUID
user_id        string   UUID — links to auth user
name           string
phone          string
address        string
zone           string   "Zone A" | "Zone B" | "Zone C"
collection_day string   "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday"
plan           string   "monthly" | "annual"
status         string   "active" | "suspended" | "cancelled"
paid_through   string?  YYYY-MM-DD — date of last settled invoice
created_at     string   ISO 8601
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

---

## Known Gaps (planned)

- Rate limiting on `/api/auth/login` and `/api/auth/register` — required before production
- `GET /api/admin/clients?status=suspended` — suspended clients not yet queryable via API
- `GET /api/admin/collections/:id` and `GET /api/admin/invoices/:id` — single-item admin detail endpoints
- `POST /api/user/device-token` — push notification token registration (v2)
- SMS notification triggers via Africa's Talking (v2)
- Mobile payment integration: MTN MoMo, Airtel Money (v2)
