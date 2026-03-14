import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseEnv } from './env'
import type { Database } from '@/lib/db/database.types'

// =============================================================================
// Server-side Supabase clients
// =============================================================================

/**
 * Standard server client — uses the anon key with session cookies.
 * Use in: server components, server actions, API routes.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    supabaseEnv.url,
    supabaseEnv.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server component context — cookie mutation is safe to ignore here
          }
        },
      },
    }
  )
}

/**
 * Service role client — bypasses RLS.
 * Use ONLY in: trusted server actions, seed scripts, admin operations.
 * Never expose to the browser.
 */
export function createServiceRoleClient() {
  const { createClient } = require('@supabase/supabase-js')
  return createClient<Database>(
    supabaseEnv.url,
    supabaseEnv.serviceKey,
    {
      auth: {
        autoRefreshToken:  false,
        persistSession:    false,
      },
    }
  )
}
