import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Next.js Fast Refresh in development evaluates code via eval(); without 'unsafe-eval'
// the dev client bundle throws a CSP error and the app never hydrates (forms then fall
// back to a native GET submit, leaking field values into the URL). Allow it in dev only.
const scriptSrc =
  process.env.NODE_ENV === 'production'
    ? "script-src 'self' 'unsafe-inline' fonts.googleapis.com"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval' fonts.googleapis.com"

const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy':
    `default-src 'self'; ${scriptSrc}; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com; img-src 'self' data:; connect-src 'self' *.supabase.co; frame-src https://www.youtube.com https://www.youtube-nocookie.com`,
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next()
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next()
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isDashboard = path.startsWith('/dashboard')
  const isAdminRoute = path.startsWith('/dashboard/admin')
  const isOnboarding = path.startsWith('/onboarding')
  const isAuthRoute = path.startsWith('/auth')

  // Unauthenticated: protect app areas, leave public pages alone.
  if (!user) {
    if (isDashboard || isOnboarding) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    return applySecurityHeaders(response)
  }

  // Only resolve role/onboarding state on routes where it changes behavior.
  if (isDashboard || isOnboarding || isAuthRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    const role = (profile?.role as string) ?? 'client'
    const isAdmin = role === 'admin' || role === 'superadmin'

    // Admin-only users (no client record by project rule) live in /dashboard/admin.
    if (isAdmin) {
      if (!isAdminRoute) {
        return NextResponse.redirect(new URL('/dashboard/admin', request.url))
      }
      return applySecurityHeaders(response)
    }

    // Client users.
    const { data: client } = await supabase
      .from('reru_clients')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    const hasClient = Boolean(client)

    if (isAdminRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // Force profile completion before using the dashboard.
    if (isDashboard && !hasClient) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
    // Onboarded clients shouldn't see onboarding again.
    if (isOnboarding && hasClient) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // Logged-in clients don't need the auth pages.
    if (isAuthRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return applySecurityHeaders(response)
}

export const config = {
  matcher: [
    // Run on all routes except static assets and API routes.
    // API routes handle their own auth — skipping middleware avoids a
    // redundant supabase.auth.getUser() round-trip on every API request.
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
