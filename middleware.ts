import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' fonts.googleapis.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com; img-src 'self' data:; connect-src 'self' *.supabase.co",
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

export async function middleware(request: NextRequest) {
  // Inject the current pathname as a request header so server-component layouts
  // can read it via headers(). This is needed because layouts have no other way
  // to know their current path (no usePathname on the server).
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  })

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
          // Preserve the x-pathname header when Next.js recreates the response
          response = NextResponse.next({ request: { headers: requestHeaders } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: requestHeaders } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('[MW]', request.nextUrl.pathname, '| user:', user?.email ?? 'none')

  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      console.log('[MW] no user → /auth/login')
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Admin route guard — verify role from profiles table
    if (request.nextUrl.pathname.startsWith('/dashboard/admin')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      console.log('[MW] admin route, profile role:', profile?.role ?? 'null')

      if (!profile || !['admin', 'superadmin'].includes(profile.role as string)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  if (request.nextUrl.pathname.startsWith('/auth')) {
    if (user) {
      // Check if this is an admin-only user and send them to the right place
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      console.log('[MW] auth route logged-in user, profile role:', profile?.role ?? 'null')

      if (profile && ['admin', 'superadmin'].includes(profile.role as string)) {
        // Confirm they have no client record before redirecting to admin
        const { data: client } = await supabase
          .from('reru_clients')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        console.log('[MW] admin user, client record:', client ? 'exists' : 'none')

        if (!client) {
          console.log('[MW] admin-only user → /dashboard/admin')
          return NextResponse.redirect(new URL('/dashboard/admin', request.url))
        }
      }

      console.log('[MW] logged-in user on /auth → /dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return applySecurityHeaders(response)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
