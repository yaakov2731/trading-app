'use client'

import { createBrowserClient } from '@supabase/ssr'
import { supabaseEnv } from './env'
import type { Database } from '@/lib/db/database.types'

// =============================================================================
// Browser (client component) Supabase client
// Singleton pattern — reuses instance across re-renders
// =============================================================================

let _browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (!_browserClient) {
    _browserClient = createBrowserClient<Database>(
      supabaseEnv.url,
      supabaseEnv.anonKey
    )
  }
  return _browserClient
}
