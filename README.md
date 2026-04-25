# RERU — Reusable Resources

A household waste collection and recycling service management platform for Nsasa Estate, Mukono District, Uganda. Live at [reru.odukar.com](https://reru.odukar.com).

## What It Does

RERU lets residents subscribe to a weekly garbage collection service and track everything in one place:

- **Register** and choose a collection day and billing plan
- **Track** upcoming and past collections
- **View and download invoices** with payment instructions
- **Access** the service agreement

Waste is sorted into color-coded bags (organic, plastic, glass, paper) and routed to composting, certified recycling facilities, or authorized disposal sites.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| UI | React 19 + Tailwind CSS |
| Components | Radix UI primitives (Shadcn/UI pattern) |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| Toasts | Sonner |
| PDF | jsPDF + jsPDF-autotable |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Hosting | Vercel |
| Package Manager | pnpm |

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Access to the Supabase project (`crjgohirzgkxatywuvoz`)

### Setup

```bash
# Clone the repo
git clone <repo-url>
cd reru

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Fill in the values from the Supabase project settings and Vercel dashboard

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Copy `.env.example` to `.env.local` and populate:

```env
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Anon/public key
SUPABASE_SERVICE_ROLE_KEY=        # Service role key (server-only)
SUPABASE_JWT_SECRET=              # JWT secret
POSTGRES_URL=                     # Pooled Postgres connection
POSTGRES_URL_NON_POOLING=         # Direct Postgres (for migrations)
AFRICAS_TALKING_USERNAME=         # Africa's Talking (SMS)
AFRICAS_TALKING_API_KEY=          # Africa's Talking (SMS)
NEXT_PUBLIC_BASE_URL=             # App base URL
```

## Project Structure

```
reru/
├── app/                          # Next.js App Router
│   ├── (landing)/home/           # Public landing page
│   ├── auth/                     # Login & registration pages
│   │   ├── login/
│   │   └── register/
│   ├── (user-dashboard)/dashboard/   # Authenticated client area
│   │   ├── page.tsx              # Dashboard home
│   │   ├── collections/          # Collection history
│   │   ├── invoices/             # Invoice list + detail
│   │   ├── agreement/            # Service agreement
│   │   └── layout.tsx            # Client dashboard shell (sidebar + nav)
│   ├── (admin-dashboard)/dashboard/admin/  # Admin area (independent layout chain)
│   │   ├── page.tsx              # Admin overview
│   │   ├── clients/              # Client management
│   │   ├── collections/          # Collections management
│   │   ├── invoices/             # Invoice management
│   │   ├── schedule/             # Today's schedule
│   │   └── layout.tsx            # Admin shell (sidebar + nav)
│   ├── api/                      # API routes (server-side — shared by all clients)
│   │   ├── auth/
│   │   │   ├── login/            # POST — returns session tokens
│   │   │   ├── logout/           # POST
│   │   │   └── register/         # POST — new client self-registration
│   │   ├── user/                 # Authenticated client endpoints (web, mobile, USSD)
│   │   │   ├── me/               # GET — profile + client record
│   │   │   ├── dashboard/        # GET — aggregated dashboard data
│   │   │   ├── collections/      # GET — history + /upcoming
│   │   │   └── invoices/         # GET — list + /[id]
│   │   └── admin/                # Admin-only endpoints
│   │       ├── clients/
│   │       ├── collections/
│   │       └── invoices/
│   ├── globals.css
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Root redirect
├── components/
│   ├── auth/                     # Login and registration forms
│   ├── dashboard/                # Dashboard-specific widgets
│   ├── invoices/                 # Invoice detail component
│   ├── landing/                  # Landing page sections
│   ├── layout/                   # Sidebar, mobile nav
│   ├── shared/                   # Logo, badges, shared UI
│   └── ui/                       # Base UI primitives (Radix/Shadcn)
├── lib/
│   ├── env.ts                    # Zod-validated environment variables
│   ├── auth/
│   │   ├── get-admin-user.ts     # Auth guard for admin API routes
│   │   └── get-current-client.ts # Auth guard for user API routes
│   └── supabase/
│       ├── client.ts             # Browser Supabase client
│       └── server.ts             # Server Supabase client (anon + service role)
├── types/
│   ├── index.ts                  # Domain types (Client, Invoice, Collection…)
│   └── api.ts                    # ApiResponse<T> — standard response wrapper
├── hooks/
│   └── use-mobile.tsx
├── middleware.ts                  # Auth session refresh + route protection
├── docs/
│   ├── PRD.md                    # Product Requirements Document
│   ├── PROJECT_RULES.md          # Development standards and rules
│   └── design-system/            # Design tokens, component previews
├── index.html                    # Original HTML prototype (reference only)
└── CLAUDE.md                     # AI agent project instructions
```

## User Roles

RERU has two roles: `client` (default) and `admin`/`superadmin`.

A database trigger (`on_auth_user_created_create_profile`) automatically creates a `profiles` row with `role: 'client'` for every new auth user. **No manual step is needed for client accounts.**

### Creating an admin user

1. Create the user in the [Supabase Auth dashboard](https://supabase.com/dashboard/project/crjgohirzgkxatywuvoz/auth/users) (or invite them via email).
2. Copy the new user's UUID from the Auth dashboard.
3. Promote them to admin via SQL:

```sql
UPDATE profiles SET role = 'admin' WHERE user_id = '<uuid>';
```

Admin users must **not** have a `reru_clients` record — the app uses the absence of a client record combined with the `admin` role to route them to `/dashboard/admin` instead of the client dashboard.

## Development Workflow

```bash
pnpm dev          # Start dev server at localhost:3000
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm type-check   # TypeScript type check (tsc --noEmit)
```

Before committing, ensure lint and type-check pass cleanly.

## Architecture

- **Server Components by default** — `'use client'` only where interactivity requires it
- **Multi-client API-first** — the Next.js app is both the web UI and the backend API. A complete `/api/user/*` route suite exposes all client data over HTTP so that web, USSD, Android, iOS, and desktop clients can consume the same backend without changes
- **Client API surface** — authenticated REST endpoints for non-web clients:
  ```
  POST /api/auth/login             — returns session tokens (Bearer for mobile/USSD)
  POST /api/auth/logout
  GET  /api/user/me                — profile + client record
  GET  /api/user/dashboard         — all dashboard data in one call (USSD-optimised)
  GET  /api/user/collections       — collection history (?status&limit&offset)
  GET  /api/user/collections/upcoming
  GET  /api/user/invoices          — invoice list (?status)
  GET  /api/user/invoices/[id]
  ```
- **Supabase SSR** — auth session managed server-side via `@supabase/ssr`; middleware refreshes it on every request. Non-web clients use `Authorization: Bearer <access_token>` from the login response
- **RLS everywhere** — Row Level Security enforces data access at the database layer

See `docs/PROJECT_RULES.md` for the full set of development standards.

## Service Details

| Plan | Price |
|---|---|
| Monthly | UGX 25,000 / month |
| Annual | UGX 240,000 / year (saves UGX 60,000) |

**Operator:** Mukono Countryside Mixed Farm Ltd  
**Contact:** Brian Twesigye — 0778527802 / briantwesigye@gmail.com

## Roadmap

See [docs/PRD.md](docs/PRD.md) for the full product requirements.

**Current priority:** Admin dashboard — collection management, client management, invoice management, and payment tracking for operations staff.

**Upcoming (v2):** SMS notifications (Africa's Talking), Mobile Money payment integration, waste tracking, environmental impact reports.
