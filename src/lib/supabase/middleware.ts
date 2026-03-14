import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/db/database.types'

// =============================================================================
// Middleware-compatible Supabase client
// Must not import 'next/headers' — only NextRequest/Response cookies
// =============================================================================

const PUBLIC_PATHS = [
  '/login',
  '/auth/callback',
  '/auth/error',
  '/api/health',
]

const STATIC_EXTENSIONS = /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$/

export function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  return { supabase, response }
}

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p))
}

export function isStaticAsset(pathname: string): boolean {
  return STATIC_EXTENSIONS.test(pathname) || pathname.startsWith('/_next/')
}

export function buildLoginRedirect(request: NextRequest): NextResponse {
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/login'
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export function buildDashboardRedirect(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = '/dashboard'
  url.search   = ''
  return NextResponse.redirect(url)
}
