# RERU Project Rules

## Project Overview

RERU (Reusable Resources) is a household waste collection and recycling service management platform for Nsasa Estate, Mukono District, Uganda. It is a B2C subscription SaaS built on **Next.js 15**, **Supabase** (database, auth, storage), and deployed on **Vercel**. The Supabase backend is live — there is no mock data layer.

---

## Package Manager

**ALWAYS use pnpm** for all package management operations:

```bash
pnpm install              # Install all dependencies
pnpm add <package>        # Add a dependency
pnpm add -D <package>     # Add a dev dependency
pnpm remove <package>     # Remove a dependency
```

```bash
pnpm dev                  # Start development server
pnpm build                # Build for production
pnpm start                # Start production server
pnpm lint                 # Run ESLint
pnpm format               # Run Prettier
pnpm type-check           # Run tsc --noEmit
pnpm audit                # Check for dependency vulnerabilities
```

Run `pnpm audit` before adding new dependencies and address any high/critical advisories before merging.

---

## Design System

### Reference Documents
- **ALWAYS refer to** `docs/design-system/README.md` before building any UI
- **ALWAYS use CSS custom properties** from `docs/design-system/colors_and_type.css` — never hardcode raw color, spacing, or radius values
- **Component previews** are in `docs/design-system/preview/` — check these for expected appearance of buttons, forms, cards, badges, and navigation
- **Full click-through prototype** is at `docs/design-system/ui_kits/web-app/index.html`

### Brand Tokens
- **Primary:** Forest green `green700` — buttons, active nav, headings on light
- **Dark surfaces:** `green900` — sidebar, hero, footer
- **Tints:** `green100` / `green50` — icon wells, card backgrounds
- **Accent:** `oklch(68% 0.16 160)` — "Best Value" badges and highlight tags only
- **Danger:** `oklch(52% 0.18 25)` — errors, missed collection status
- **Warning:** `oklch(72% 0.16 75)` — pending payment status
- **Font:** [Outfit](https://fonts.google.com/specimen/Outfit) — weights 400, 500, 600, 700, 800

### Content Rules
- RERU uses **Radix UI primitives via the Shadcn/UI pattern** (`components/ui/`) for base elements (Button, Input, Select, etc.)
- Custom domain components (cards, collection rows, invoice views) are built on top of these primitives following the design system
- All colors, spacing, radii, and shadows via CSS custom properties from `colors_and_type.css` — do not override with hardcoded values
- Sentence case for all body text and UI labels; ALL CAPS only for overline pills and table headers
- Currency written as `UGX X,XXX` — never "Shs" or "USh"
- Dates in Ugandan format: `22 Apr 2026` (day first, month abbreviated)

### Responsive Breakpoints
- Mobile: ≤ 700px — single column, hamburger nav, full-width cards
- Desktop: > 700px — sidebar visible, multi-column grids
- Always design and test mobile-first

### UI States (required for every interactive feature)
Every data-driven UI section must handle all four states:

| State | What to render |
|---|---|
| **Loading** | Skeleton placeholder matching the shape of the loaded content |
| **Empty** | Friendly illustration or message + a clear call to action |
| **Error** | Human-readable message (not raw error text) + a retry action |
| **Success** | The actual data |

Never show a blank screen or raw JavaScript error objects to users.

### Form Validation UX
- Validate on blur for individual fields (show error when the user leaves the field)
- Re-validate on submit for all fields
- Show inline error messages below each field using the `danger` color token
- Never clear a field's error while the user is still typing — only clear on blur after fixing

### Accessibility
- Target **WCAG 2.1 AA** compliance
- All interactive elements must be keyboard-navigable (tab order, Enter/Space triggers)
- All images and icons must have descriptive `alt` text or `aria-label`
- Color alone must never be the only indicator of state — always pair with text or icon
- Minimum touch target size: 44×44px on mobile
- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<section>`) over generic `<div>` wrappers

### Animation
- Transitions: `all 0.15s ease` — no bounce, no spring, no entrance animations
- No page transitions or slide animations in MVP
- State changes only (hover, focus, active) — not decorative motion

---

## Product Requirements

- **ALWAYS refer to** `docs/PRD.md` for feature specifications and user workflows
- Contains data models, business logic, pricing, geographic scope, and roadmap
- Source of truth for what is in scope for v1 vs. future versions

---

## Language

**RERU uses TypeScript** for all new code.

### TypeScript Strictness
`tsconfig.json` must include:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

- **Never use `any`** — use `unknown` and narrow it, or define a proper type
- All function parameters and return types must be explicitly typed
- Use `type` for object shapes, `interface` only when extension is intentional

### File Extensions
- **Pages**: `page.tsx`
- **Layouts**: `layout.tsx`
- **API Routes**: `route.ts`
- **Components**: `kebab-case.tsx` (e.g., `invoice-card.tsx`)
- **Utilities**: `kebab-case.ts` (e.g., `format-ugx.ts`)
- **Actions**: `entity-actions.ts` (e.g., `invoice-actions.ts`)
- **Providers**: `kebab-case.tsx` (e.g., `auth-provider.tsx`)
- **Types**: `kebab-case.types.ts` (e.g., `invoice.types.ts`)

---

## Code Style

### Formatter
- Use **Prettier** for all formatting — do not manually format code
- Prettier config in `.prettierrc` at repo root
- ESLint and Prettier must not conflict — use `eslint-config-prettier`

### Pre-commit Hooks
Run `lint-staged` via Husky on every commit:
```json
// package.json lint-staged config
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```
Never skip hooks with `--no-verify`.

### Component Structure
- **All components must be Server Components by default**
- Add `'use client'` only when absolutely necessary:
  - Using React hooks (`useState`, `useEffect`, etc.)
  - Browser-only APIs (`localStorage`, `window`, etc.)
  - Event handlers and interactivity
- Keep components small and focused — if a component exceeds ~150 lines, split it
- Use Next.js `loading.tsx` for route-level loading states
- Use Next.js `error.tsx` for route-level error boundaries

### Import Paths
Use path aliases configured in `tsconfig.json`:
```typescript
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { formatUGX } from '@/lib/utils/format-ugx'
```

### Environment Variable Access
- Create a `lib/env.ts` that imports and validates all env vars at startup using Zod
- Import env vars from `lib/env.ts` throughout the app — never from `process.env` directly
- This catches missing variables at build time rather than at runtime

```typescript
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // ...
})

export const env = envSchema.parse(process.env)
```

---

## API-First Development

### Architecture Principles
- **All Supabase database operations MUST happen server-side** unless explicitly required on client
- Use API routes (`app/api/**/route.ts`) for all data mutations and sensitive operations
- Client components call API endpoints via `fetch()`, never Supabase directly
- Server components can use the Supabase server client for read operations

### Standardized API Response Shape
All API routes MUST return one of these two shapes:

```typescript
// Success
{ ok: true, data: T }

// Error
{ ok: false, error: string }  // human-readable message only — never raw error.message
```

Never expose internal error details (database errors, stack traces, table names) in API responses. Log the full error server-side; return only a safe message to the client:

```typescript
// app/api/collections/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validate input with Zod
    const body = await req.json()
    const parsed = collectionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 })
    }

    // 3. Database operation (RLS enforces access control)
    const { data, error } = await supabase.from('collections').insert(parsed.data).select().single()
    if (error) {
      console.error('[POST /api/collections]', error) // log full error server-side
      return NextResponse.json({ ok: false, error: 'Failed to create collection' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (err) {
    console.error('[POST /api/collections] Unexpected error', err)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
```

### Authentication Check in Every Mutating Route
Every `POST`, `PUT`, `PATCH`, `DELETE` route must verify the user session as the first step. Return `401` before doing anything else if the session is missing.

### Input Validation Scope
Use **Zod** to validate all untrusted input at the API boundary:
- Request body (`req.json()`)
- URL query params (`req.nextUrl.searchParams`)
- Path params (where applicable)

Never trust client-supplied data. Validate before touching the database.

### Component Architecture

```
✅ page.tsx (Server Component)
   └─ Direct Supabase queries for initial data (auth + reads)
   └─ Passes props to client components

✅ *-client.tsx (Client Components)
   └─ fetch() calls to API routes
   └─ router.refresh() for cache revalidation
   └─ Handles loading / error / empty states

✅ /api/resource/* (API Routes)
   └─ Auth check first
   └─ Zod validation
   └─ RLS enforcement via authenticated Supabase client
   └─ Service role client ONLY for specific admin tasks
   └─ Safe error responses (no internal details)
```

---

## Database

### Supabase Project Configuration
- **Project URL**: `https://crjgohirzgkxatywuvoz.supabase.co`
- **Project ID**: `crjgohirzgkxatywuvoz` ⚠️ ALWAYS use this for Supabase MCP operations
- **Region**: AWS us-east-1

### Table Naming
- No table prefix — use plain descriptive names: `clients`, `invoices`, `collections`, `profiles`
- Use the **Supabase MCP server** for all database operations (schema changes, migrations, queries, RLS policies, storage buckets)
- Always confirm with the user before running any INSERT, UPDATE, or DELETE operations on production data

### Migration Workflow
1. Write all schema changes as SQL migration files in `supabase/migrations/`
2. Name migrations with timestamp prefix: `20260423_add_collections_table.sql`
3. Apply via Supabase MCP server or `supabase db push` using `POSTGRES_URL_NON_POOLING`
4. Never modify the production schema directly through the Supabase dashboard UI
5. Keep migrations idempotent where possible (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`)
6. Always update the schema reference file after a migration

### Supabase Client Usage
- **Client components**: Must NOT use Supabase directly — call API routes instead
- **Server components**: Use `lib/supabase/server.ts` for read operations
- **API routes**: Use `lib/supabase/server.ts` for all operations
- **Middleware**: Use `lib/supabase/middleware.ts`

### Supabase Storage
- Use Supabase Storage for file uploads (e.g., invoice PDFs when generated)
- Enforce storage RLS — never make buckets fully public unless assets are truly public (e.g., brand images)
- Use signed URLs for private files; keep expiry short (< 1 hour)
- Name buckets descriptively: `invoices`, `assets`

---

## RLS Policies — Auth-Driven Helper Functions

**CRITICAL**: RERU uses auth-driven helper functions to avoid `auth.uid()` returning NULL in server-side contexts (Next.js App Router + Supabase SSR).

### Core Principles
1. Never use GUCs or manual session parameters
2. Always use `TO authenticated` in all policies
3. Centralize authorization logic in helper functions in the `app` schema
4. Use `SECURITY DEFINER` for helper functions to bypass RLS during lookups
5. Never bypass RLS in application code
6. RLS must be **enabled** on every table that contains user data — verify after every migration

### Helper Functions (app schema)
All helper functions MUST follow this pattern:
```sql
CREATE OR REPLACE FUNCTION app.function_name()
RETURNS <type> AS $$
  SELECT column
  FROM table
  WHERE supabase_user_id = auth.uid()
  LIMIT 1
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
```

**RERU Helpers**:
- `app.current_client_id()` — Returns `clients.id` for the authenticated user
- `app.current_user_role()` — Returns role (`client`, `admin`, `superadmin`) for the authenticated user
- `app.is_admin()` — Boolean: user has `admin` or `superadmin` role

### Policy Structure
```sql
-- [Description of what this policy does]
-- Logic: [Business logic explanation]
-- Uses [helper function name] helper to [what it checks]
CREATE POLICY "Descriptive policy name"
ON table_name
FOR [SELECT|INSERT|UPDATE|DELETE]
TO authenticated
USING (column = app.helper_function())
WITH CHECK (column = app.helper_function());
```

### Policy Naming Convention
- Start with subject: `"Clients"`, `"Admins"`
- Include action: `"can view"`, `"can create"`, `"can update"`
- Be specific: `"own invoices"`, `"all collections"`

### Forbidden Patterns
```sql
-- BAD: No TO authenticated
CREATE POLICY "bad" ON table FOR SELECT USING (...);

-- BAD: Inline subquery instead of helper
USING (client_id IN (SELECT id FROM clients WHERE supabase_user_id = auth.uid()));

-- BAD: No comments
CREATE POLICY "policy" ON table USING (...);
```

---

## Authentication

### Protected Routes
- Dashboard routes: `/dashboard/*`
- Admin routes: `/dashboard/admin/*` (admin/superadmin only)
- Middleware automatically redirects unauthenticated users to `/login`

### Middleware (`middleware.ts`)
The middleware must:
1. Refresh the Supabase auth session on every request
2. Redirect unauthenticated users attempting protected routes to `/login`
3. Redirect authenticated users hitting `/login` or `/register` to `/dashboard`
4. Set HTTP security headers on every response (see Security section)

### Role-Based Access
- Roles: `client`, `admin`, `superadmin`
- Check user role from `profiles` table
- Enforce role checks server-side (in API routes and server components) — client-side checks are UI-only and must not be the sole gate

### PIN Security
- 4-digit PINs must be hashed with **bcrypt** (cost factor ≥ 12) before storage — never store plaintext PINs
- Rate-limit PIN login attempts: max 5 failures per phone number per 15 minutes; lock the account temporarily after that
- Enforce HTTPS everywhere — never transmit PINs over plain HTTP

---

## Security

### HTTP Security Headers
Set these headers in `middleware.ts` on every response:
```typescript
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' fonts.googleapis.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com; img-src 'self' data:; connect-src 'self' *.supabase.co",
}
```

### Rate Limiting
Apply rate limiting on all public-facing mutation endpoints:
- `/api/auth/login` — 5 attempts per phone per 15 minutes
- `/api/auth/register` — 3 attempts per IP per hour
- SMS-sending endpoints — 3 SMS per phone per hour
- Use Supabase's built-in Auth rate limits plus application-level checks

### Input Security
- **Zod** validates all API input at the boundary — request body, query params
- Set explicit `max` lengths on all string fields to prevent oversized payloads
- Use parameterized queries only — the Supabase client handles this; never concatenate user input into SQL strings
- Reject requests with `Content-Type` other than `application/json` on JSON endpoints

### Error Handling
- Never expose raw `error.message`, stack traces, or database internals in API responses
- Log full errors server-side with `console.error` (picked up by Vercel logs)
- Return only a human-readable, non-leaky message to the client:
  ```typescript
  // BAD
  return NextResponse.json({ error: error.message }, { status: 500 })

  // GOOD
  console.error('[context]', error)
  return NextResponse.json({ ok: false, error: 'Something went wrong. Please try again.' }, { status: 500 })
  ```

### Secrets Management
- All secrets in `.env.local` (local) and Vercel environment variables (production)
- Never commit `.env.local` — it is gitignored
- Maintain a `.env.example` file with all required variable names but no values
- Rotate the `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_JWT_SECRET` if they are ever accidentally exposed
- The service role key bypasses RLS — use it only for admin-level server operations; never in client-accessible code

### Audit Logging
Log all sensitive admin operations to an `audit_logs` table:
- Account suspension / reactivation
- Invoice status changes (mark paid, cancel)
- Manual collection record edits
- Admin role assignments

---

## SMS Notifications

- Use **Africa's Talking API** for SMS — Uganda coverage
- SMS use cases: collection day reminders, payment due reminders, collection confirmation
- This is SMS only — no IVR or voice call functionality
- Always validate and normalize Ugandan phone numbers to international format (`+256XXXXXXXXX`) before sending
- Log all sent SMS (recipient, message type, timestamp, delivery status) — never log message body if it contains sensitive data

---

## Payment Integration

- **v2 feature** — MTN MoMo API and Airtel Money API (see `docs/PRD.md` §5.3)
- Manual payment methods currently: Mobile Money transfer, Bank of Africa transfer, cash
- Payment due: 10th of each month; suspend service after 3 consecutive missed payments
- All payment status changes must go through an API route — never allow the client to self-declare payment

---

## Environment Variables

### Required Variables (match `.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL (client-safe)
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Anon/public key (client-safe)
SUPABASE_SERVICE_ROLE_KEY=        # Service role key (server-only, never expose to client)
SUPABASE_JWT_SECRET=              # JWT secret for token verification
POSTGRES_URL=                     # Pooled Postgres connection string
POSTGRES_URL_NON_POOLING=         # Direct Postgres connection (for migrations)
AFRICAS_TALKING_USERNAME=         # Africa's Talking username (SMS)
AFRICAS_TALKING_API_KEY=          # Africa's Talking API key (SMS)
NEXT_PUBLIC_BASE_URL=             # App base URL
```

### Rules
- Public (client-side safe): `NEXT_PUBLIC_*` prefix
- Private (server-only): no prefix
- Never hardcode credentials in source — always read from `lib/env.ts`
- Never commit `.env.local` to git
- Keep `.env.example` up to date with every new variable added
- Validate all env vars at startup via `lib/env.ts` (Zod schema) so missing vars fail at build, not runtime

---

## Git Workflow

### Branch Naming
- Features: `feature/description`
- Fixes: `fix/description`
- Hotfixes: `hotfix/description`

### Commit Messages
Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Build/config changes

### Pull Requests
- All changes to `main` must go through a PR — no direct pushes
- PR must pass: lint, type-check, and tests before merge
- PR description must reference the relevant PRD section or issue
- Keep PRs small and focused — one feature or fix per PR

---

## Testing

### Test Runner
Use **Vitest** for unit and integration tests (compatible with Next.js, faster than Jest).

### Test-Driven Development (TDD)
- Follow TDD for all API routes
- Write unit tests BEFORE implementing features
- Test file naming: `route.test.ts` alongside `route.ts`

### Testing Approach
1. Write the test first — define expected behavior
2. Run the test — watch it fail (red)
3. Implement the feature — make it pass (green)
4. Refactor — improve code while keeping tests green

### Test Isolation
- **Never run tests against the production Supabase project**
- Use a local Supabase instance (`supabase start`) or a dedicated test project for integration tests
- Mock the Supabase client in unit tests; use the real client only in integration tests

### API Route Testing
```typescript
// app/api/invoices/route.test.ts
import { POST } from './route'

describe('POST /api/invoices', () => {
  it('should return 401 for unauthenticated requests', async () => {
    const req = new Request('http://localhost/api/invoices', { method: 'POST' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('should return 400 if required fields are missing', async () => {
    // Test implementation
  })

  it('should return 200 and create invoice on success', async () => {
    // Test implementation
  })
})
```

### What Must Be Tested
- All API routes: happy path, missing auth, invalid input, database error
- Utility functions: `formatUGX`, `formatDate`, phone normalization
- Zod schemas: valid and invalid inputs

### Manual API Testing with curl

**Step 1: Login and save session cookies**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0701234567","pin":"1234"}' \
  -c .auth-cookies.txt -v
```

**Step 2: Make authenticated requests**
```bash
curl -X GET http://localhost:3000/api/collections \
  -b .auth-cookies.txt -v
```

**Step 3: Logout**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b .auth-cookies.txt -c .auth-cookies.txt
```

`.auth-cookies.txt` is gitignored — never commit it.

---

## Deployment

### Vercel
- Main branch auto-deploys to production (`https://reru.odukar.com`)
- Pull requests create preview deployments
- Environment variables set in Vercel dashboard (never in `vercel.json`)

### Pre-deployment Checklist
- [ ] All tests passing (`pnpm test`)
- [ ] No TypeScript errors (`pnpm type-check`)
- [ ] Build succeeds locally (`pnpm build`)
- [ ] No high/critical vulnerabilities (`pnpm audit`)
- [ ] Environment variables configured in Vercel for the target environment
- [ ] Database migrations applied to production Supabase project
- [ ] RLS enabled and policies verified on all user-data tables
- [ ] `.env.example` up to date

---

## Performance

- Use Next.js `<Image>` component for all images — never raw `<img>`
- Implement skeleton loading states for all async data sections
- Use React Suspense with `loading.tsx` for route-level loading
- Minimize `'use client'` boundaries — keep them as deep in the tree as possible
- Leverage Next.js fetch caching and `revalidate` for server component data
- Do not fetch data in client components on mount if it can be fetched in the parent server component

---

## Documentation

- Keep `README.md` current with setup instructions
- Keep `.env.example` current with all required variables
- Reference `docs/PRD.md` for feature decisions
- Reference `docs/design-system/README.md` for UI decisions
- Comment complex logic only — explain WHY, not WHAT
- Every new database table and RLS policy must be reflected in the migration files in `supabase/migrations/`

---

**Last Updated**: 2026-04-23
