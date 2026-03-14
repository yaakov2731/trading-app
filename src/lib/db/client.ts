import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

// =============================================================================
// Browser client — for client components only
// For server-side clients, use @/lib/supabase/server
// =============================================================================

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
