# UCI IVR Project Rules

## Package Manager

**ALWAYS use pnpm** for all package management operations:

### Installation
```bash
pnpm install              # Install all dependencies
pnpm add <package>        # Add a dependency
pnpm add -D <package>     # Add a dev dependency
pnpm remove <package>     # Remove a dependency
```

### Running Scripts
```bash
pnpm dev                  # Start development server
pnpm build                # Build for production
pnpm start                # Start production server
pnpm lint                 # Run ESLint
```

### Why pnpm?
- Faster installation than npm/yarn
- Efficient disk space usage (content-addressable storage)
- Strict dependency resolution
- Better monorepo support

## Design System

### Reference Documents
- **ALWAYS refer to** `design-system.md` when building UI elements
- **Brand Colors**: Blue #0066CC (primary), Green #10B981 (secondary), Amber #F59E0B (alerts)
- Use Shadcn/UI components for consistency
- Follow UCI IVR design patterns and guidelines for healthcare applications

## Product Requirements

### Reference Documents
- **ALWAYS refer to** `docs/Breast Cancer  IVR product requirement document.md`
- Contains complete feature specifications and user workflows
- Defines business logic and validation rules
- Source of truth for feature implementation

## Language

**UCI IVR uses TypeScript** for all new code.

### File Extensions
- **Pages**: `page.tsx` (React components)
- **Layouts**: `layout.tsx` (React components)
- **API Routes**: `route.ts` (TypeScript)
- **Components**: `kebab-case.tsx` (e.g., `participant-card.tsx`)
- **Utilities**: `kebab-case.ts` (e.g., `format-phone.ts`)
- **Actions**: `entity-actions.ts` (e.g., `participant-actions.ts`)
- **Providers**: `kebab-case.tsx` (e.g., `auth-provider.tsx`)

## Code Style

### File Naming
- Use TypeScript extensions (`.ts`, `.tsx`)
- **Pages**: `page.tsx` (Next.js requirement)
- **Layouts**: `layout.tsx` (Next.js requirement)
- **API Routes**: `route.ts` (Next.js requirement)
- **Components**: `kebab-case.tsx` (e.g., `call-history-table.tsx`)
- **Utilities**: `kebab-case.ts` (e.g., `format-date.ts`)
- **Actions**: `entity-actions.ts` (e.g., `schedule-actions.ts`)

### Component Structure
- **All components must be Server Components by default**
- Add `'use client'` directive only when absolutely necessary:
  - Using React hooks (useState, useEffect, etc.)
  - Browser-only APIs (localStorage, window, etc.)
  - Event handlers and interactivity
- Keep components small and focused
- Use Shadcn/UI components for consistency

### Import Paths
Use path aliases configured in `tsconfig.json`:
```javascript
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { SEVERITY_LEVELS } from '@/lib/constants/severity'
```

## API-First Development

### Architecture Principles
- **All Supabase database operations MUST happen on the server-side** unless explicitly required on client
- Use API routes (`app/api/**/route.ts`) for all data mutations and sensitive operations
- Client components should only call API endpoints, never Supabase directly
- Server components can use Supabase server client for read operations

### API Route Structure
```typescript
// app/api/resource/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    // Validate input
    // Perform database operations
    // Return response
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### Components structure

The architecture should follow  API-first principles by using client components, server components and API routes appropriately:

Client components call API routes via fetch()
Server components (page.tsx) use Supabase server client for read operations
API routes handle all mutations and enforce authentication/RLS
No server actions violating the API-first approach

Here's an example of the various components

✅ page.tsx (Server Component)
   └─ Direct Supabase queries for initial data (auth + reads)
   └─ Passes props to client components

✅ *-client.tsx (Client Components)  
   └─ fetch() calls to API routes
   └─ router.refresh() for cache revalidation

✅ /api/schedules/* (API Routes)
   └─ Authentication via createClient()
   └─ RLS enforcement via authenticated Supabase client
   └─ Service role client ONLY for specific administrative tasks

### Benefits
- Automatic cookie management for auth
- Centralized validation and error handling
- Better security (credentials never exposed to client)
- Easier testing and debugging
- Consistent API contracts

## Database

### Supabase Project Configuration
- **Project Name**: supabase-vpnsage-com
- **Project ID**: `crjgohirzgkxatywuvoz` ⚠️ ALWAYS use this project ID for Supabase MCP operations
- **PostgreSQL Version**: Latest (via Supabase)
- **Region**: US

### Reference Documents
- **ALWAYS refer to** `supabase-schema.sql` when writing database queries or logic
- **ALWAYS refer to** `supabase-rls-policies.sql` when implementing data access
- All tables are prefixed with `uci_`
- Use Supabase MCP server to interact with the database
- All database tables are prefixed with "uci_". Therefore when creating a new table, you must always add this prefix.
- Always ask me to confirm when performing actions that alter data in the database such as inserts, updates and delete.
- Always refer to the project database schema supabase-schema.sql and the row level security file supabase-rls-policies.sql when creating database-related code to avoid schema-related errors.

### Supabase Client Usage
- **Client components**: Should NOT use Supabase directly - call API routes instead
- **Server components**: Use `lib/supabase/server.ts` for read operations
- **API routes**: Use `lib/supabase/server.ts` for all operations
- **Middleware**: Use `lib/supabase/middleware.ts`

### RLS Policies - Auth-Driven Helper Functions Pattern

**CRITICAL**: UCI IVR uses auth-driven helper functions to avoid `auth.uid()` returning NULL in server-side contexts (Next.js App Router + Supabase SSR).

#### Core Principles
1. **Never use GUCs** (Grand Unified Configuration variables) or manual session parameters
2. **Always use `TO authenticated`** in all policies to ensure proper auth context
3. **Centralize authorization logic** in helper functions within the `app` schema
4. **Use `SECURITY DEFINER`** for helper functions to bypass RLS during lookups
5. **Never bypass RLS** in application code - let database enforce security

#### Helper Functions (app schema)
All helper functions MUST follow this pattern:
```sql
CREATE OR REPLACE FUNCTION app.function_name()
RETURNS <type> AS $$
  SELECT column
  FROM table
  WHERE supabase_user_id = auth.uid()  -- Uses Supabase's auth context
  LIMIT 1
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
```

**Available Helpers**:
- `app.current_user_id()` - Returns uci_profiles.id for authenticated user
- `app.current_user_role()` - Returns role (admin, manager, viewer) for authenticated user
- `app.is_admin()` - Boolean: user has admin role
- `app.is_manager()` - Boolean: user has manager or admin role
- `app.can_manage_participants()` - Boolean: user has permission to manage participants
- `app.can_manage_flows()` - Boolean: user has permission to manage question flows
- `app.can_view_reports()` - Boolean: user has permission to view reports

#### Policy Structure
All RLS policies MUST follow this exact pattern:

```sql
-- [Description of what this policy does]
-- Logic: [Business logic explanation]
-- Uses [helper function name] helper to [what it checks]
CREATE POLICY "Descriptive policy name"
ON table_name
FOR [SELECT|INSERT|UPDATE|DELETE]
TO authenticated  -- ← MANDATORY: Ensures auth context exists
USING (column = app.helper_function())
WITH CHECK (column = app.helper_function());  -- For INSERT/UPDATE
```

#### Policy Naming Convention
- Use descriptive names: `"Admins can view all participants"`
- Start with subject: `"Admins"`, `"Managers"`, `"Viewers"`
- Include action: `"can view"`, `"can create"`, `"can update"`
- Be specific: `"all participants"`, `"own profile"`, `"severity alerts"`

#### Required Comments
Every policy MUST have:
1. **Description comment**: What the policy allows
2. **Logic comment**: Business reasoning behind the policy
3. **Helper comment**: Which helper function is used and why

Example:
```sql
-- Admins can view all participant call history
-- Logic: Admin users need full visibility into patient monitoring data for oversight
-- Uses app.is_admin() helper to verify admin status
CREATE POLICY "Admins can view all call sessions"
ON uci_call_sessions
FOR SELECT
TO authenticated
USING (app.is_admin());
```

#### Why This Approach?

**Security Benefits**:
- ✅ No GUCs to manipulate or forget to set
- ✅ `auth.uid()` controlled by Supabase, not user code
- ✅ `SECURITY DEFINER` prevents lookup bypass
- ✅ `TO authenticated` ensures auth context always present
- ✅ Zero boilerplate in API routes

**Performance Benefits**:
- ✅ `STABLE` keyword allows PostgreSQL to cache results
- ✅ Indexed lookups on `id` column
- ✅ No additional RPC calls for session setup

**Maintainability Benefits**:
- ✅ Authorization logic centralized in helper functions
- ✅ Clean, readable policies
- ✅ Business rules documented with comments
- ✅ Change once, affects all policies using that helper

#### Creating New Policies

**Step 1**: Determine what data the policy protects
**Step 2**: Identify which user role needs access
**Step 3**: Choose or create appropriate helper function
**Step 4**: Write policy with `TO authenticated` and comprehensive comments
**Step 5**: Grant execute permissions on any new helper functions
**Step 6**: Update `supabase-rls-policies.sql`

#### Forbidden Patterns

❌ **Never use policies without `TO authenticated`**:
```sql
-- BAD: Defaults to 'public' role, causes auth.uid() NULL issues
CREATE POLICY "bad_policy" ON table FOR SELECT USING (...);
```

❌ **Never use inline subqueries instead of helpers**:
```sql
-- BAD: Repeated logic, hard to maintain
USING (user_id IN (SELECT id FROM uci_profiles WHERE supabase_user_id = auth.uid()));

-- GOOD: Use helper function
USING (user_id = app.current_user_id());
```

❌ **Never use GUCs or manual session variables**:
```sql
-- BAD: Requires manual setup, manipulation risk
USING (organization_id = current_setting('app.organization_id')::uuid);

-- GOOD: Use auth-driven helper
USING (app.is_admin());
```

❌ **Never create policies without comments**:
```sql
-- BAD: No documentation of business logic
CREATE POLICY "policy" ON table USING (...);

-- GOOD: Comprehensive comments
-- Managers can update participant information
-- Logic: Managers maintain patient contact details and tags
-- Uses app.is_manager() helper to verify manager status
CREATE POLICY "Managers can update participants" ON uci_participants ...
```

#### Reference Files
- **Schema**: `supabase-schema.sql`
- **RLS Policies**: `supabase-rls-policies.sql`
- **Example**: See any policy in `supabase-rls-policies.sql` for proper pattern

## Authentication

### Protected Routes
- Dashboard routes: `/dashboard/*`
- Admin routes: `/dashboard/admin/*` (admin only)
- Middleware automatically redirects unauthenticated users to `/login`

### Role-Based Access
- Check user role from `uci_profiles` table
- Show/hide features based on role (admin, manager, viewer)
- Use constants from `lib/constants/roles.ts`

## Environment Variables

### Required Variables
```env
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Public anon key
SUPABASE_SERVICE_ROLE_KEY=        # Private service role key (server-only)
NEXT_PUBLIC_BASE_URL=             # App base URL
AFRICAS_TALKING_USERNAME=         # Africa's Talking username
AFRICAS_TALKING_API_KEY=          # Africa's Talking API key
AFRICAS_TALKING_SHORTCODE=        # IVR shortcode
MAILGUN_API_KEY=                  # Mailgun API key
MAILGUN_DOMAIN=                   # Mailgun domain
MAILGUN_FROM_EMAIL=               # Sender email
BLOB_READ_WRITE_TOKEN=            # Vercel Blob token
```

### Naming Convention
- Public (client-side): `NEXT_PUBLIC_*`
- Private (server-only): No prefix

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

## Testing

### Test-Driven Development (TDD)
- **Follow TDD methodology for all API routes**
- Write unit tests BEFORE implementing features
- Test file naming: `route.test.ts` alongside `route.ts`

### Testing Approach
1. **Write the test first**: Define expected behavior
2. **Run the test**: Watch it fail (red)
3. **Implement the feature**: Make the test pass (green)
4. **Refactor**: Improve code while keeping tests green

### API Route Testing
```typescript
// app/api/participants/route.test.ts
import { POST } from './route'

describe('POST /api/participants', () => {
  it('should return 400 if phone number is missing', async () => {
    const req = new Request('http://localhost/api/participants', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' })
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('should return 401 for unauthorized users', async () => {
    // Test implementation
  })

  it('should return 200 and create participant on success', async () => {
    // Test implementation
  })
})
```

### Test Coverage
- **All API routes must have unit tests**
- Test happy paths and error cases
- Test input validation
- Test authentication/authorization
- Test database operations (use test database or mocks)

### Test Files
- Place tests next to the files they test
- Use `.test.ts` or `.spec.ts` extension
- Test utilities in `lib/utils/`
- Test critical business logic

### Running Tests
```bash
pnpm test              # Run all tests
pnpm test:watch        # Run tests in watch mode
pnpm test:coverage     # Generate coverage report
```

### Manual API Testing with curl

**IMPORTANT**: Use curl with cookie-based authentication for manual testing of authenticated API endpoints during development.

#### Cookie-Based Authentication Flow

**Step 1: Login and Save Session Cookies**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}' \
  -c .auth-cookies.txt \
  -v
```

**Step 2: Make Authenticated Requests**
```bash
# Use saved cookies for authenticated requests
curl -X GET http://localhost:3000/api/YOUR_ENDPOINT \
  -b .auth-cookies.txt \
  -v

# Example: Test authenticated endpoint
curl -X GET http://localhost:3000/api/test-auth \
  -b .auth-cookies.txt

# Example: POST request with authentication
curl -X POST http://localhost:3000/api/participants \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Participant","phone":"+256700000000"}' \
  -b .auth-cookies.txt
```

**Step 3: Logout (Clear Session)**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b .auth-cookies.txt \
  -c .auth-cookies.txt
```

**Step 4: Verify Logout**
```bash
# Should return 401 Unauthorized
curl -X GET http://localhost:3000/api/test-auth \
  -b .auth-cookies.txt
```

#### Cookie File Management
- Cookies are stored in `.auth-cookies.txt` (gitignored)
- Cookie file is reusable across multiple requests
- Cookie expires after 400 days or on logout
- Format: Netscape HTTP Cookie File (curl native format)

#### Testing Best Practices
1. **Always use `-v` flag** during development to see full HTTP headers
2. **Store cookies in `.auth-cookies.txt`** for session persistence
3. **Test authentication flow**: Login → Authenticated Request → Logout → Verify Unauthorized
4. **Test authorization levels**: Verify admin, manager, and viewer role access
5. **Test error cases**: Invalid credentials, missing fields, unauthorized access

#### Example Test Workflow
```bash
# 1. Login as admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@uci.org","password":"adminpass"}' \
  -c .auth-cookies.txt

# 2. Test admin-only endpoint (should succeed)
curl -X POST http://localhost:3000/api/participants \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phone":"+256700000000"}' \
  -b .auth-cookies.txt

# 3. Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -b .auth-cookies.txt \
  -c .auth-cookies.txt

# 4. Verify logout (should return 401)
curl -X GET http://localhost:3000/api/participants \
  -b .auth-cookies.txt
```

#### Why This Approach?
- ✅ **Session Persistence**: Cookies saved to file, reusable across requests
- ✅ **No Token Management**: No need to manually extract/pass tokens
- ✅ **Production-Like**: Mirrors browser authentication behavior
- ✅ **Simple**: One login, multiple authenticated requests
- ✅ **Secure**: HttpOnly cookies, SameSite protection
- ✅ **Fast**: Quick validation without running full test suite

## Deployment

### Vercel
- Main branch auto-deploys to production
- Pull requests create preview deployments
- Environment variables set in Vercel dashboard

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] Build succeeds locally (`pnpm build`)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies verified
- [ ] Africa's Talking webhook URL updated

## Performance

### Optimization
- Use Next.js Image component for images
- Implement proper loading states
- Use React Suspense for async components
- Minimize client-side JavaScript

### Caching
- Leverage Next.js caching strategies
- Use React Query for data fetching
- Cache static assets appropriately

## Security

### Best Practices
- Never expose service role key to client
- Validate all user inputs
- Use Zod schemas for validation
- Sanitize data before database operations
- Follow OWASP guidelines
- Protect PHI (Protected Health Information) per HIPAA guidelines

### Sensitive Data
- Store API keys in environment variables
- Never commit `.env.local` to git
- Use Supabase RLS for data access control
- Implement proper error handling (don't expose internals)
- Encrypt sensitive patient data
- Log all access to participant data for audit trail

### Healthcare-Specific Security
- **PHI Protection**: All participant data is PHI (Protected Health Information)
- **Audit Logging**: Log all access to `uci_activity_log` table
- **Role-Based Access**: Enforce strict role checks for sensitive operations
- **Data Retention**: Follow UCI's data retention policies
- **Consent Management**: Verify participant consent before calls

## Documentation

### Code Comments
- Comment complex logic
- Document function parameters and return types
- Explain "why" not "what"

### README Updates
- Keep README.md current
- Document new features
- Update setup instructions as needed

## Healthcare Domain Rules

### Participant Privacy
- Never log full participant names or phone numbers in client-side code
- Always use participant IDs in URLs and logs
- Implement proper consent tracking before any calls

### Call Scheduling
- Respect timezone settings (Africa/Kampala UTC+3)
- Never call outside configured hours (8 AM - 8 PM by default)
- Implement retry logic with exponential backoff

### Severity Alerts
- **Critical (Score 4)**: Immediate email notification to medical staff
- **High (Score 3)**: Flag for review within 24 hours
- **Moderate (Score 2)**: Monitor in dashboard
- **Low (Score 1)**: Track in reports

### Question Flow Rules
- Always play welcome message before questions
- Support "Press 9 to repeat" functionality
- Implement timeout handling (30 seconds default)
- Track invalid input attempts (max 3 before ending call)

### Audio File Management
- All audio files stored in Vercel Blob
- Support MP3 and WAV formats
- Maximum file size: 5MB
- Naming convention: `{type}_{flow_id}_{timestamp}.mp3`

---

**Last Updated**: 2025-12-11
**Enforced By**: Development team and code reviews
