/**
 * lib/server/system-health.ts
 * Practical MVP readiness signals — honest, file/config-based, no fake infra monitoring.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'

// ── Types ─────────────────────────────────────────────────────────────────────

export type HealthStatus = 'ok' | 'warning' | 'error' | 'unknown'

export interface HealthCheck {
  id: string
  label: string
  status: HealthStatus
  message: string
  detail?: string
}

export interface SystemHealthReport {
  overall: HealthStatus
  score: number // 0-100
  checks: HealthCheck[]
  generatedAt: string
}

// ── Individual checks ─────────────────────────────────────────────────────────

function checkEnv(): HealthCheck[] {
  const required = [
    { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Supabase URL' },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Supabase Anon Key' },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Supabase Service Role Key' },
  ]

  return required.map(({ key, label }) => {
    const present = !!process.env[key]
    return {
      id: `env_${key.toLowerCase()}`,
      label: `Env: ${label}`,
      status: present ? 'ok' : 'error',
      message: present ? 'Configurada' : 'No configurada',
      detail: present ? undefined : `Variable ${key} no encontrada en el entorno`,
    } satisfies HealthCheck
  })
}

async function checkDatabaseConnectivity(): Promise<HealthCheck> {
  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from('locations').select('id').limit(1)
    if (error) throw error
    return {
      id: 'db_connectivity',
      label: 'Conexión base de datos',
      status: 'ok',
      message: 'Conectado',
    }
  } catch (err) {
    return {
      id: 'db_connectivity',
      label: 'Conexión base de datos',
      status: 'error',
      message: 'Sin conexión',
      detail: err instanceof Error ? err.message : 'Error desconocido',
    }
  }
}

async function checkCoreTablesExist(): Promise<HealthCheck[]> {
  const tables = [
    'locations', 'products', 'categories', 'units',
    'stock_movements', 'stock_balances',
    'purchase_entries', 'purchase_entry_items',
    'transfers', 'transfer_items',
    'physical_counts', 'physical_count_items',
    'suppliers', 'users',
  ]

  try {
    const supabase = await createServerSupabaseClient()
    const missing: string[] = []

    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(0)
      if (error && error.code === '42P01') missing.push(table)
    }

    return [{
      id: 'db_core_tables',
      label: 'Tablas core de BD',
      status: missing.length === 0 ? 'ok' : 'error',
      message: missing.length === 0
        ? `${tables.length} tablas presentes`
        : `${missing.length} tablas faltantes`,
      detail: missing.length > 0 ? `Faltantes: ${missing.join(', ')}` : undefined,
    }]
  } catch {
    return [{
      id: 'db_core_tables',
      label: 'Tablas core de BD',
      status: 'warning',
      message: 'No se pudo verificar',
    }]
  }
}

async function checkMigrationTablesExist(): Promise<HealthCheck> {
  try {
    const supabase = await createServerSupabaseClient()
    const checks = await Promise.all([
      supabase.from('migration_import_runs').select('id').limit(0),
      supabase.from('migration_import_rows').select('id').limit(0),
      supabase.from('migration_opening_balance_candidates').select('id').limit(0),
      supabase.from('migration_cutover_log').select('id').limit(0),
    ])

    const missing = checks.filter((c) => c.error?.code === '42P01').length
    return {
      id: 'db_migration_tables',
      label: 'Tablas de migración',
      status: missing === 0 ? 'ok' : missing < 3 ? 'warning' : 'error',
      message: missing === 0 ? '4 tablas presentes' : `${missing} tablas faltantes`,
      detail: missing > 0 ? 'Ejecutar migraciones de Batch 6' : undefined,
    }
  } catch {
    return {
      id: 'db_migration_tables',
      label: 'Tablas de migración',
      status: 'warning',
      message: 'No se pudo verificar',
    }
  }
}

async function checkSeedData(): Promise<HealthCheck> {
  try {
    const supabase = await createServerSupabaseClient()
    const [{ count: locations }, { count: categories }] = await Promise.all([
      supabase.from('locations').select('id', { count: 'exact', head: true }),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
    ])
    const hasData = (locations ?? 0) > 0 && (categories ?? 0) > 0
    return {
      id: 'db_seed_data',
      label: 'Datos iniciales (seed)',
      status: hasData ? 'ok' : 'warning',
      message: hasData
        ? `${locations} ubicaciones, ${categories} categorías`
        : 'Sin datos iniciales — ejecutar seed.sql',
    }
  } catch {
    return { id: 'db_seed_data', label: 'Datos iniciales', status: 'unknown', message: 'No verificable' }
  }
}

async function checkAuthUsers(): Promise<HealthCheck> {
  try {
    const supabase = await createServerSupabaseClient()
    const { count } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
    const hasAdmin = (count ?? 0) > 0
    return {
      id: 'auth_users',
      label: 'Usuarios configurados',
      status: hasAdmin ? 'ok' : 'warning',
      message: hasAdmin ? `${count} usuario(s) registrados` : 'Sin usuarios — crear admin primero',
    }
  } catch {
    return { id: 'auth_users', label: 'Usuarios', status: 'unknown', message: 'No verificable' }
  }
}

function checkNodeEnv(): HealthCheck {
  const env = process.env.NODE_ENV
  return {
    id: 'node_env',
    label: 'Node environment',
    status: env === 'production' ? 'ok' : 'warning',
    message: env ?? 'no definido',
    detail: env !== 'production' ? 'Configurar NODE_ENV=production para deploy' : undefined,
  }
}

// ── Main health check runner ──────────────────────────────────────────────────

export async function runSystemHealthCheck(): Promise<SystemHealthReport> {
  const [
    dbConn,
    migrationTables,
    seedData,
    authUsers,
    coreTables,
  ] = await Promise.all([
    checkDatabaseConnectivity(),
    checkMigrationTablesExist(),
    checkSeedData(),
    checkAuthUsers(),
    checkCoreTablesExist(),
  ])

  const envChecks = checkEnv()
  const nodeEnvCheck = checkNodeEnv()

  const allChecks: HealthCheck[] = [
    nodeEnvCheck,
    ...envChecks,
    dbConn,
    ...coreTables,
    migrationTables,
    seedData,
    authUsers,
  ]

  const errorCount = allChecks.filter((c) => c.status === 'error').length
  const warningCount = allChecks.filter((c) => c.status === 'warning').length
  const okCount = allChecks.filter((c) => c.status === 'ok').length
  const total = allChecks.length

  const score = Math.round((okCount / total) * 100)
  const overall: HealthStatus =
    errorCount > 0 ? 'error' : warningCount > 2 ? 'warning' : 'ok'

  return {
    overall,
    score,
    checks: allChecks,
    generatedAt: new Date().toISOString(),
  }
}
