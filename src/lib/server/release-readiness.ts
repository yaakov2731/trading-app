/**
 * lib/server/release-readiness.ts
 * MVP release readiness evaluation by category.
 */

export type ReadinessLevel = 'ready' | 'partial' | 'blocked'

export interface ReadinessCategory {
  id: string
  label: string
  level: ReadinessLevel
  score: number // 0-100
  items: ReadinessItem[]
}

export interface ReadinessItem {
  label: string
  done: boolean
  note?: string
}

export interface ReleaseReadinessReport {
  overall: ReadinessLevel
  overallScore: number
  categories: ReadinessCategory[]
  summary: string
  blockers: string[]
  warnings: string[]
  generatedAt: string
}

// ── Category definitions ──────────────────────────────────────────────────────

function coreInventory(): ReadinessCategory {
  const items: ReadinessItem[] = [
    { label: 'Productos CRUD completo', done: true },
    { label: 'Categorías y unidades', done: true },
    { label: 'Vista de stock por ubicación', done: true },
    { label: 'Alertas de stock bajo', done: true },
    { label: 'Balances de stock (stock_balances)', done: true },
    { label: 'Vistas v_current_stock / v_low_stock_alerts', done: true, note: 'Depende de migraciones SQL ejecutadas' },
  ]
  return makeCategory('core_inventory', 'Inventario core', items)
}

function purchasingFlow(): ReadinessCategory {
  const items: ReadinessItem[] = [
    { label: 'Crear borrador de compra', done: true },
    { label: 'Agregar ítems con búsqueda de producto', done: true },
    { label: 'Recibir compra (crea movimiento)', done: true },
    { label: 'Idempotencia en recepción', done: true },
    { label: 'Cancelar compra', done: true },
    { label: 'CRUD de proveedores', done: true },
    { label: 'Export Excel de compras', done: true },
    { label: 'Recepción parcial por ítem', done: false, note: 'Deferido post-MVP' },
  ]
  return makeCategory('purchasing', 'Compras y proveedores', items)
}

function transfersFlow(): ReadinessCategory {
  const items: ReadinessItem[] = [
    { label: 'Crear transferencia', done: true },
    { label: 'Enviar (transfer_out)', done: true },
    { label: 'Recibir (transfer_in)', done: true },
    { label: 'Badge de estado animado', done: true },
    { label: 'Transferencias multi-ítem', done: true },
    { label: 'Export de transferencias', done: true },
    { label: 'Cancelar transferencia en tránsito', done: false, note: 'Deferido post-MVP' },
  ]
  return makeCategory('transfers', 'Transferencias entre locales', items)
}

function countsFlow(): ReadinessCategory {
  const items: ReadinessItem[] = [
    { label: 'Crear conteo físico', done: true },
    { label: 'Ingresar cantidades reales', done: true },
    { label: 'Confirmar y crear ajustes', done: true },
    { label: 'Severidad de discrepancias', done: true },
    { label: 'Export de conteos', done: true },
    { label: 'Conteos multi-ronda', done: false, note: 'Deferido post-MVP' },
  ]
  return makeCategory('counts', 'Conteos físicos', items)
}

function authPermissions(): ReadinessCategory {
  const items: ReadinessItem[] = [
    { label: 'Auth con Supabase', done: true },
    { label: 'Roles: admin / supervisor / encargado / read_only', done: true },
    { label: 'RLS en todas las tablas sensibles', done: true, note: 'Verificar migraciones' },
    { label: 'Guards de servidor (requireSession)', done: true },
    { label: 'Guards de permiso en API routes', done: true },
    { label: 'Guards de ubicación', done: true },
    { label: 'UI de gestión de roles', done: true, note: 'Modo lectura — edición post-MVP' },
    { label: 'Editor de permisos individuales', done: false, note: 'Post-MVP' },
  ]
  return makeCategory('auth', 'Auth y permisos', items)
}

function migrationCutover(): ReadinessCategory {
  const items: ReadinessItem[] = [
    { label: 'Parser de snapshots legados', done: true },
    { label: 'Import runs con chunking', done: true },
    { label: 'Cola de revisión', done: true },
    { label: 'Capa de mapping (producto/ubicación/unidad)', done: true },
    { label: 'Candidatos de saldo inicial', done: true },
    { label: 'Ejecución de corte idempotente', done: true },
    { label: 'Rollback de corte', done: true },
    { label: 'Tablas de BD creadas para migración', done: false, note: 'Requiere migration SQL manual — ver README_DEPLOY' },
  ]
  return makeCategory('migration', 'Migración de datos legados', items)
}

function exportsReports(): ReadinessCategory {
  const items: ReadinessItem[] = [
    { label: 'Export Excel de stock', done: true },
    { label: 'Export Excel de movimientos', done: true },
    { label: 'Export Excel de compras', done: true },
    { label: 'Export Excel de transferencias', done: true },
    { label: 'Export Excel de conteos', done: true },
    { label: 'Export Excel de proveedores', done: true },
    { label: 'Export revisión migración', done: true },
    { label: 'Export saldos iniciales', done: true },
    { label: 'Dashboard ejecutivo con KPIs', done: false, note: 'Scaffolded — gráficos post-MVP' },
    { label: 'Google Sheets sync', done: false, note: 'Payload helpers listos — wiring post-MVP' },
  ]
  return makeCategory('exports', 'Exportaciones y reportes', items)
}

function testsCoverage(): ReadinessCategory {
  const items: ReadinessItem[] = [
    { label: 'Vitest configurado', done: true },
    { label: 'Tests unitarios de parser (SKU, fechas, cantidades)', done: true },
    { label: 'Tests de permisos y roles', done: true },
    { label: 'Tests de saldos iniciales', done: true },
    { label: 'Tests de integración (products, history, purchases, cutover)', done: true },
    { label: 'E2E tests (Playwright)', done: false, note: 'Post-MVP' },
    { label: 'Tests de API con DB real', done: false, note: 'Post-MVP — usar Supabase local' },
  ]
  return makeCategory('tests', 'Testing', items)
}

function documentation(): ReadinessCategory {
  const items: ReadinessItem[] = [
    { label: 'README_SETUP.md', done: true },
    { label: 'README_QA.md', done: true },
    { label: 'README_DEPLOY.md', done: true },
    { label: 'README_POLISH.md', done: true },
    { label: 'docs/MVP_CLOSEOUT.md', done: true },
    { label: 'docs/PRODUCTION_CHECKLIST.md', done: true },
    { label: 'docs/KNOWN_ISSUES.md', done: true },
    { label: 'docs/POST_MVP_BACKLOG.md', done: true },
    { label: 'docs/SMOKE_TEST_PLAN.md', done: true },
  ]
  return makeCategory('docs', 'Documentación', items)
}

function deploymentReadiness(): ReadinessCategory {
  const items: ReadinessItem[] = [
    { label: 'Variables de entorno documentadas', done: true },
    { label: 'Next.js 15 app router optimizado', done: true },
    { label: 'Loading states en todas las rutas', done: true },
    { label: 'Página 404 personalizada', done: true },
    { label: 'Error handling centralizado', done: true },
    { label: 'Cache helpers con revalidation tags', done: true },
    { label: 'Build de producción validado', done: false, note: 'Ejecutar pnpm build antes de deploy' },
    { label: 'Monitoreo/alertas configurado', done: false, note: 'Post-MVP — Vercel Analytics o Sentry' },
  ]
  return makeCategory('deployment', 'Deploy y operaciones', items)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeCategory(
  id: string,
  label: string,
  items: ReadinessItem[]
): ReadinessCategory {
  const done = items.filter((i) => i.done).length
  const total = items.length
  const score = Math.round((done / total) * 100)
  const level: ReadinessLevel =
    score === 100 ? 'ready' : score >= 60 ? 'partial' : 'blocked'
  return { id, label, level, score, items }
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function generateReleaseReadiness(): Promise<ReleaseReadinessReport> {
  const categories = [
    coreInventory(),
    purchasingFlow(),
    transfersFlow(),
    countsFlow(),
    authPermissions(),
    migrationCutover(),
    exportsReports(),
    testsCoverage(),
    documentation(),
    deploymentReadiness(),
  ]

  const totalScore = Math.round(
    categories.reduce((sum, c) => sum + c.score, 0) / categories.length
  )

  const blockedCategories = categories.filter((c) => c.level === 'blocked')
  const blockers = [
    ...blockedCategories.map((c) => `${c.label} (${c.score}%)`),
    ...categories
      .flatMap((c) => c.items)
      .filter((i) => !i.done && i.note?.includes('Requiere'))
      .map((i) => i.label),
  ]

  const warnings = categories
    .filter((c) => c.level === 'partial')
    .flatMap((c) => c.items.filter((i) => !i.done).map((i) => i.label))
    .slice(0, 10)

  const overall: ReadinessLevel =
    blockers.length > 0 ? 'partial' : totalScore >= 90 ? 'ready' : 'partial'

  const summary =
    totalScore >= 90
      ? 'El MVP está listo para producción. Revisar items parciales antes del lanzamiento.'
      : totalScore >= 70
      ? 'El MVP está casi listo. Completar items bloqueantes antes del lanzamiento.'
      : 'El MVP necesita trabajo adicional antes de producción.'

  return {
    overall,
    overallScore: totalScore,
    categories,
    summary,
    blockers,
    warnings,
    generatedAt: new Date().toISOString(),
  }
}
