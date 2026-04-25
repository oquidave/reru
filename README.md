# RERU — Reusable Resources

A household waste collection and recycling service management platform for Nsasa Estate, Mukono District, Uganda. Live at [reru.odukar.com](https://reru.odukar.com).

## Platform Ecosystem

RERU is a multi-client system. The REST API (in this repo) is the shared backend for all clients:

| Repo | Platform | Stack | Status |
|------|----------|-------|--------|
| **[reru](https://github.com/oquidave/reru)** | Web + API | Next.js 15, TypeScript, Supabase | Live |
| **[reru-android](https://github.com/oquidave/reru-android)** | Android | Flutter / Dart | In progress |
| **[reru-ios](https://github.com/oquidave/reru-ios)** | iOS | Swift / SwiftUI | Planned |
| **[reru-ussd](https://github.com/oquidave/reru-ussd)** | USSD | Python FastAPI + Africa's Talking | Planned |

### Shared references (live in this repo, consumed by all clients)
- **API contract:** [`docs/api.md`](docs/api.md)
- **Design system:** [`docs/design-system/`](docs/design-system/)

---

## What It Does

RERU lets residents subscribe to a weekly garbage collection service and track everything in one place:

- **Register** and choose a collection day and billing plan
- **Track** upcoming and past collections
- **View and download invoices** with payment instructions
- **Access** the service agreement

Waste is sorted into color-coded bags (organic, plastic, glass, paper) and routed to composting, certified recycling facilities, or authorized disposal sites.

---

## Web App Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| UI | React 19 + Tailwind CSS |
| Components | Radix UI primitives (Shadcn/UI pattern) |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Hosting | Vercel |
| Package Manager | pnpm |

---

## Getting Started (Web)

### Prerequisites
- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Access to the Supabase project (`crjgohirzgkxatywuvoz`)

### Setup

```bash
git clone https://github.com/oquidave/reru
cd reru
pnpm install
cp .env.example .env.local
# Fill in values from the Supabase project settings
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Anon/public key
SUPABASE_SERVICE_ROLE_KEY=        # Service role key (server-only)
SUPABASE_JWT_SECRET=              # JWT secret
POSTGRES_URL=                     # Pooled Postgres connection
POSTGRES_URL_NON_POOLING=         # Direct Postgres (for migrations)
AFRICAS_TALKING_USERNAME=         # Africa's Talking (SMS, v2)
AFRICAS_TALKING_API_KEY=          # Africa's Talking (SMS, v2)
NEXT_PUBLIC_BASE_URL=             # App base URL
```

---

## Project Structure (Web)

```
reru/
├── app/
│   ├── (landing)/home/               # Public landing page
│   ├── auth/login/ & register/       # Auth pages
│   ├── (user-dashboard)/dashboard/   # Authenticated client area
│   ├── (admin-dashboard)/dashboard/admin/  # Admin area
│   └── api/                          # REST API (shared by all clients)
│       ├── auth/                     # login, logout, refresh, register
│       ├── user/                     # me, dashboard, collections, invoices
│       └── admin/                    # clients, collections, invoices, schedule
├── components/
│   ├── ui/                           # Radix/Shadcn base primitives
│   ├── auth/                         # Login + registration forms
│   ├── dashboard/                    # Client dashboard widgets
│   ├── admin/                        # Admin panel components
│   ├── landing/                      # Landing page sections
│   └── shared/                       # Logo, badges, shared UI
├── lib/
│   ├── auth/                         # API route auth guards
│   └── supabase/                     # Browser + server Supabase clients
├── types/                            # TypeScript domain types
├── supabase/migrations/              # Database migrations
└── docs/
    ├── api.md                        # API contract (all clients reference this)
    ├── PROJECT_RULES.md              # Development standards
    ├── PRD.md                        # Product requirements
    └── design-system/                # Design tokens + component previews
```

---

## User Roles

RERU has two roles: `client` (default) and `admin`/`superadmin`.

A database trigger automatically creates a `profiles` row with `role: 'client'` for every new auth user.

### Creating an admin user

1. Create the user in the [Supabase Auth dashboard](https://supabase.com/dashboard/project/crjgohirzgkxatywuvoz/auth/users).
2. Copy the new user's UUID.
3. Promote to admin via SQL:

```sql
UPDATE profiles SET role = 'admin' WHERE user_id = '<uuid>';
```

Admin users must **not** have a `reru_clients` record — the app uses the absence of a client record + `admin` role to route them to the admin dashboard.

---

## Architecture

- **Server Components by default** — `'use client'` only where interactivity requires it
- **API-first** — the Next.js app is both the web UI and the shared backend. All `/api/user/*` endpoints accept Bearer tokens so Android, iOS, and USSD clients consume the same API without changes
- **Supabase SSR** — session managed server-side; middleware refreshes it on every request. Non-web clients use `Authorization: Bearer <access_token>`
- **RLS everywhere** — Row Level Security enforces data access at the database layer

See [`docs/PROJECT_RULES.md`](docs/PROJECT_RULES.md) for the full development standards.

---

## Non-Web Client Authentication (Android, iOS, USSD)

All non-web clients authenticate with the same credentials and receive tokens in the response body instead of cookies. See [`docs/api.md`](docs/api.md) for the full API reference.

### Quick start

**1. Login**
```
POST https://reru.odukar.com/api/auth/login
Content-Type: application/json

{ "email": "user@example.com", "password": "..." }
```

Response includes `access_token`, `refresh_token`, and `expires_at`. Store securely (Android Keystore / iOS Keychain).

**2. Authenticated requests**
```
GET https://reru.odukar.com/api/user/dashboard
Authorization: Bearer <access_token>
```

**3. Token refresh** (access tokens expire after 1 hour)
```
POST https://reru.odukar.com/api/auth/refresh
Content-Type: application/json

{ "refresh_token": "..." }
```

If refresh returns `401`, the session has fully expired — redirect to login.

---

## Development Commands

```bash
pnpm dev          # Start dev server at localhost:3000
pnpm build        # Production build
pnpm lint         # Run ESLint
```

---

## Service Details

| Plan | Price |
|---|---|
| Monthly | UGX 25,000 / month |
| Annual | UGX 240,000 / year (saves UGX 60,000) |

**Operator:** Mukono Countryside Mixed Farm Ltd
**Contact:** Brian Twesigye — 0778527802

---

## Roadmap

See [`docs/PRD.md`](docs/PRD.md) for the full product requirements.

**v2:** SMS notifications (Africa's Talking), Mobile Money payment integration, waste tracking, environmental impact reports.
