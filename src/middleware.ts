import { NextResponse, type NextRequest } from 'next/server'
import {
  createMiddlewareClient,
  isPublicPath,
  isStaticAsset,
  buildLoginRedirect,
  buildDashboardRedirect,
} from '@/lib/supabase/middleware'

// =============================================================================
// App Middleware — session refresh + route protection
// =============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static assets entirely
  if (isStaticAsset(pathname)) {
    return NextResponse.next()
  }

  // Create client — this MUST happen on every request to refresh session cookies
  const { supabase, response } = createMiddlewareClient(request)

  // Read session from cookie — no network call, safe on Edge Runtime
  // (Security validation happens in server components / API routes via getUser())
  const { data: { session } } = await supabase.auth.getSession()
  const isAuthenticated = !!session?.user

  // Unauthenticated + protected route → login
  if (!isAuthenticated && !isPublicPath(pathname)) {
    return buildLoginRedirect(request)
  }

  // Authenticated + login page → dashboard
  if (isAuthenticated && pathname === '/login') {
    return buildDashboardRedirect(request)
  }

  // Root redirect
  if (pathname === '/') {
    return isAuthenticated
      ? buildDashboardRedirect(request)
      : buildLoginRedirect(request)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
}
