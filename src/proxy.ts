import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// ---------------------------------------------------------------------------
// Path classification
// ---------------------------------------------------------------------------

/** Route groups — matched by prefix. Order matters: more-specific first. */
const ONBOARDING_PATH = '/onboarding'

const AUTH_PATHS = ['/login', '/register', '/forgot-password']

/**
 * Public paths that are accessible to everyone regardless of auth state.
 * The landing `/` is public. Any path NOT in AUTH_PATHS, NOT the onboarding
 * path, and NOT under a protected prefix is treated as public.
 */
const PUBLIC_PATHS = ['/']

/**
 * Protected path prefixes — require authentication.
 * Any pathname that starts with one of these is a "dashboard" path.
 */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/cotizar',
  '/cotizaciones',
  '/impresoras',
  '/materiales',
  '/configuracion',
]

export type PathClass = 'public' | 'auth-page' | 'onboarding' | 'protected'

/** Pure function — classifies a pathname into one of 4 categories. */
export function classifyPath(pathname: string): PathClass {
  if (pathname === ONBOARDING_PATH) return 'onboarding'
  if (AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return 'auth-page'
  }
  if (PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))) {
    return 'protected'
  }
  // Everything else (landing, blog, etc.) is public
  return 'public'
}

// ---------------------------------------------------------------------------
// Open-redirect guard (Task 2.2)
// ---------------------------------------------------------------------------

/**
 * Internal path branches that are safe to redirect to after login.
 * Only paths starting with one of these prefixes are honored.
 */
const REDIRECT_ALLOWLIST = [
  '/dashboard',
  '/cotizar',
  '/cotizaciones',
  '/impresoras',
  '/materiales',
  '/configuracion',
  '/onboarding',
]

/**
 * Pure function — sanitizes a `redirectTo` query param value.
 *
 * Rules:
 * 1. Must start with `/` (relative path — no protocol/domain)
 * 2. Must NOT start with `//` (protocol-relative, can hijack to external host)
 * 3. Must start with a recognized internal path branch from REDIRECT_ALLOWLIST
 *
 * Returns the sanitized path, or `/dashboard` if any rule fails.
 */
export function sanitizeRedirectTo(value: string | null | undefined): string {
  if (!value) return '/dashboard'
  if (!value.startsWith('/')) return '/dashboard'
  if (value.startsWith('//')) return '/dashboard'
  if (!REDIRECT_ALLOWLIST.some((prefix) => value === prefix || value.startsWith(prefix + '/'))) {
    return '/dashboard'
  }
  return value
}

// ---------------------------------------------------------------------------
// Proxy function (Task 2.1)
// ---------------------------------------------------------------------------

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { response, supabase, user } = await updateSession(request)
  const { pathname } = request.nextUrl
  const pathClass = classifyPath(pathname)

  // ── Unauthenticated user ──────────────────────────────────────────────────

  if (!user) {
    // State 1: anon + public → pass through
    // State 2: anon + auth-page → pass through
    if (pathClass === 'public' || pathClass === 'auth-page') {
      return response
    }

    // State 3: anon + protected → redirect /login?redirectTo=<path>
    if (pathClass === 'protected') {
      const loginUrl = new URL('/login', request.url)
      // Only attach redirectTo for paths in the dashboard branch
      const isRedirectSafe = REDIRECT_ALLOWLIST.some(
        (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
      )
      if (isRedirectSafe) {
        loginUrl.searchParams.set('redirectTo', pathname)
      }
      return NextResponse.redirect(loginUrl)
    }

    // State 4: anon + onboarding → redirect /login
    if (pathClass === 'onboarding') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return response
  }

  // ── Authenticated user — fetch onboarding status ─────────────────────────

  const { data: userData } = await supabase
    .from('users')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

  const onboardingDone = userData?.onboarding_completed ?? false

  // Cache onboarding status in a request header for downstream RSC layouts
  // so the dashboard layout can read it without a second DB round-trip.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-onboarding', onboardingDone ? '1' : '0')

  // Helper: build a NextResponse.next() that carries the x-onboarding header
  // forwarded upstream (not exposed to the client — uses request headers form).
  const passThrough = () =>
    NextResponse.next({
      request: { headers: requestHeaders },
    })

  // State 5: authed + public → pass through (landing accessible to all)
  if (pathClass === 'public') {
    return passThrough()
  }

  // State 6: authed + auth-page → redirect
  if (pathClass === 'auth-page') {
    if (onboardingDone) {
      // State 6 (onboarding done): redirect to resolved redirectTo or /dashboard
      const redirectTo = sanitizeRedirectTo(
        request.nextUrl.searchParams.get('redirectTo')
      )
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    // State 6 (onboarding not done): redirect to /onboarding
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // States 7 & 8: authed + protected
  if (pathClass === 'protected') {
    if (!onboardingDone) {
      // State 7: incomplete onboarding → redirect /onboarding
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
    // State 8: complete → pass through
    return passThrough()
  }

  // States 9 & 10: authed + onboarding
  if (pathClass === 'onboarding') {
    if (!onboardingDone) {
      // State 9: incomplete → pass through (let them complete it)
      return passThrough()
    }
    // State 10: already done → redirect /dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return passThrough()
}

// ---------------------------------------------------------------------------
// Matcher config (Task 2.3)
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api          (API routes)
     * - _next/static (static files)
     * - _next/image  (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt, manifest.json, sw.js
     * - common image/font/media extensions in /public
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|manifest\\.json|sw\\.js|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|otf|mp4|mp3)$).*)',
  ],
}
