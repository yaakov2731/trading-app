import { z } from 'zod'

// =============================================================================
// Supabase environment validation
// Fails fast at startup if required vars are missing
// =============================================================================

const supabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL:    z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
})

const serviceEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
})

function validatePublicEnv() {
  const result = supabaseEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL:      process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  if (!result.success) {
    const messages = result.error.errors.map(e => `  • ${e.message}`).join('\n')
    throw new Error(`Supabase environment configuration error:\n${messages}`)
  }

  return result.data
}

function validateServiceEnv() {
  const result = serviceEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  })

  if (!result.success) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for service role operations')
  }

  return result.data
}

// Validated, typed env values
export const supabaseEnv = {
  get url()     { return validatePublicEnv().NEXT_PUBLIC_SUPABASE_URL },
  get anonKey() { return validatePublicEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY },
  get serviceKey() { return validateServiceEnv().SUPABASE_SERVICE_ROLE_KEY },
}
