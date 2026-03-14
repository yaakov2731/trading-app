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
    return
  }

  // Create client — this MUST happen on every request to refresh the session
  const { supabase, response } = createMiddlewareClient(request)

  // Refresh session (critical — do not remove)
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // If Supabase is unreachable, treat as unauthenticated so middleware never crashes
  }

  // Unauthenticated + protected route → login
  if (!user && !isPublicPath(pathname)) {
    return buildLoginRedirect(request)
  }

  // Authenticated + login page → dashboard
  if (user && pathname === '/login') {
    return buildDashboardRedirect(request)
  }

  // Root redirect
  if (pathname === '/') {
    return user
      ? buildDashboardRedirect(request)
      : buildLoginRedirect(request)
  }

  return response ?? NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
}
