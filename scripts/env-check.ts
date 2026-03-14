#!/usr/bin/env tsx
/**
 * scripts/env-check.ts
 * Validates that all required environment variables are set before deploying.
 * Run: pnpm tsx scripts/env-check.ts
 * Or add to CI: pnpm tsx scripts/env-check.ts && pnpm build
 */

interface EnvVar {
  key: string
  required: boolean
  description: string
  /** Validates the value if present. Return error string or null. */
  validate?: (value: string) => string | null
}

const ENV_VARS: EnvVar[] = [
  // ── Supabase ────────────────────────────────────────────────────────────────
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL (public)',
    validate: (v) =>
      v.startsWith('https://') && v.includes('.supabase.co')
        ? null
        : 'Must be a valid Supabase URL (https://*.supabase.co)',
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anon/public key (public)',
    validate: (v) => (v.length > 20 ? null : 'Key looks too short'),
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: 'Supabase service role key (server-only, never expose to browser)',
    validate: (v) => (v.length > 20 ? null : 'Key looks too short'),
  },

  // ── App ─────────────────────────────────────────────────────────────────────
  {
    key: 'NEXT_PUBLIC_APP_URL',
    required: true,
    description: 'Canonical app URL — used for redirects and meta tags',
    validate: (v) =>
      v.startsWith('http://') || v.startsWith('https://')
        ? null
        : 'Must start with http:// or https://',
  },
  {
    key: 'NODE_ENV',
    required: false,
    description: 'Node environment (set automatically by Next.js)',
    validate: (v) =>
      ['development', 'production', 'test'].includes(v)
        ? null
        : 'Expected: development | production | test',
  },

  // ── Optional integrations ───────────────────────────────────────────────────
  {
    key: 'GOOGLE_CLIENT_ID',
    required: false,
    description: 'Google OAuth client ID (required for Google Sheets sync — Post-MVP)',
  },
  {
    key: 'GOOGLE_CLIENT_SECRET',
    required: false,
    description: 'Google OAuth client secret (required for Google Sheets sync — Post-MVP)',
  },
  {
    key: 'SENTRY_DSN',
    required: false,
    description: 'Sentry DSN for error tracking (recommended for production)',
    validate: (v) =>
      v.startsWith('https://') ? null : 'Sentry DSN must start with https://',
  },
  {
    key: 'SENTRY_AUTH_TOKEN',
    required: false,
    description: 'Sentry auth token for source map upload (CI only)',
  },
  {
    key: 'ANALYZE',
    required: false,
    description: 'Set to "true" to enable bundle analysis (@next/bundle-analyzer)',
    validate: (v) => (['true', 'false'].includes(v) ? null : 'Expected: true | false'),
  },
]

function checkEnv() {
  console.log('\n🔐 ENV VAR CHECK\n')

  let passed = 0
  let missingRequired = 0
  let invalid = 0
  let warnings = 0

  for (const spec of ENV_VARS) {
    const value = process.env[spec.key]

    if (!value) {
      if (spec.required) {
        console.log(`  ❌ [REQUIRED]  ${spec.key}`)
        console.log(`     ${spec.description}`)
        missingRequired++
      } else {
        console.log(`  ⚠️  [optional]  ${spec.key}`)
        console.log(`     ${spec.description}`)
        warnings++
      }
      continue
    }

    // Value exists — run validator if provided
    const err = spec.validate?.(value)
    if (err) {
      console.log(`  ⚠️  [invalid]   ${spec.key}`)
      console.log(`     ${err}`)
      if (spec.required) {
        invalid++
      } else {
        warnings++
      }
    } else {
      const masked =
        spec.key.toLowerCase().includes('key') || spec.key.toLowerCase().includes('secret')
          ? value.slice(0, 6) + '…' + value.slice(-4)
          : value
      console.log(`  ✅             ${spec.key} = ${masked}`)
      passed++
    }
  }

  console.log('\n─────────────────────────────')
  console.log(`  OK       : ${passed}`)
  console.log(`  Warnings : ${warnings}`)
  console.log(`  Errors   : ${missingRequired + invalid}`)
  console.log()

  if (missingRequired > 0 || invalid > 0) {
    console.error(`❌ ${missingRequired + invalid} env var error(s). Fix before deploying.\n`)
    process.exit(1)
  } else {
    console.log(`✅ All required env vars present and valid.\n`)
    process.exit(0)
  }
}

checkEnv()
