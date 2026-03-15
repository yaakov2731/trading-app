/**
 * lib/server/post-mvp-backlog.ts
 * Structured post-MVP backlog — prioritized, categorized.
 */

export type BacklogPriority = 'P1' | 'P2' | 'P3'
export type BacklogCategory =
  | 'inventory' | 'purchasing' | 'transfers' | 'counts'
  | 'auth' | 'exports' | 'migration' | 'performance'
  | 'ux' | 'infra' | 'mobile' | 'integrations'

export interface BacklogItem {
  id: string
  title: string
  description: string
  priority: BacklogPriority
  category: BacklogCategory
  effort: 'small' | 'medium' | 'large'
  blockedBy?: string
}

export const POST_MVP_BACKLOG: BacklogItem[] = [
  // ── P1 — High value, near-term ─────────────────────────────────────────────
  {
    id: 'partial-receiving',
    title: 'Recepción parcial de compras por ítem',
    description: 'Recibir solo algunos ítems de una compra, marcando el resto como pendiente. Soporte para multiple recepciones parciales.',
    priority: 'P1',
    category: 'purchasing',
    effort: 'medium',
  },
  {
    id: 'waste-module',
    title: 'Módulo de merma y desperdicio',
    description: 'Registrar movimientos de tipo waste (merma, vencimiento, rotura) con categorización.',
    priority: 'P1',
    category: 'inventory',
    effort: 'medium',
  },
  {
    id: 'manual-adjustment',
    title: 'Ajuste manual de stock',
    description: 'Formulario de ajuste directo con justificación obligatoria y aprobación de supervisor.',
    priority: 'P1',
    category: 'inventory',
    effort: 'small',
  },
  {
    id: 'dashboard-charts',
    title: 'Gráficos en dashboard ejecutivo',
    description: 'Conectar componentes de reportes con Recharts o Chart.js. Tendencia de stock, compras por semana, variaciones de conteo.',
    priority: 'P1',
    category: 'exports',
    effort: 'medium',
  },
  {
    id: 'cancel-transfer',
    title: 'Cancelar transferencia en tránsito',
    description: 'Permitir cancelar una transferencia ya enviada pero no recibida, revirtiendo el transfer_out.',
    priority: 'P1',
    category: 'transfers',
    effort: 'small',
  },
  {
    id: 'product-import-batch',
    title: 'Importación masiva de productos desde Excel/CSV',
    description: 'Formulario de carga masiva con validación, preview y confirmación por fila.',
    priority: 'P1',
    category: 'inventory',
    effort: 'medium',
  },

  // ── P2 — Medium value, next quarter ───────────────────────────────────────
  {
    id: 'google-sheets-wiring',
    title: 'Google Sheets sync wiring completo',
    description: 'Conectar payload helpers existentes con OAuth y la API de Google Sheets para sincronización bidireccional.',
    priority: 'P2',
    category: 'integrations',
    effort: 'large',
  },
  {
    id: 'background-exports',
    title: 'Background export jobs',
    description: 'Mover exportaciones grandes a jobs en background con notificación por email o link de descarga.',
    priority: 'P2',
    category: 'exports',
    effort: 'large',
  },
  {
    id: 'supplier-analytics',
    title: 'Analítica avanzada de proveedores',
    description: 'Dashboard de proveedor con historial de compras, precios promedio, frecuencia de entrega.',
    priority: 'P2',
    category: 'purchasing',
    effort: 'medium',
  },
  {
    id: 'permissions-editor',
    title: 'Editor de permisos individuales por usuario',
    description: 'UI para asignar/remover permisos específicos por usuario, sobreescribiendo defaults de rol.',
    priority: 'P2',
    category: 'auth',
    effort: 'medium',
  },
  {
    id: 'audit-viewer',
    title: 'Visor de auditoría avanzado',
    description: 'Página de admin con filtros por usuario, acción, entidad y período. Export de audit trail.',
    priority: 'P2',
    category: 'auth',
    effort: 'medium',
  },
  {
    id: 'multi-round-counts',
    title: 'Conteos físicos multi-ronda',
    description: 'Soporte para contar en múltiples rondas antes de confirmar, promediando o tomando la última lectura.',
    priority: 'P2',
    category: 'counts',
    effort: 'medium',
  },
  {
    id: 'notifications',
    title: 'Sistema de notificaciones',
    description: 'Alertas de stock bajo por email o push. Notificaciones de transferencias recibidas. Alertas de conteos pendientes.',
    priority: 'P2',
    category: 'infra',
    effort: 'large',
  },
  {
    id: 'barcode-scanning',
    title: 'Escaneo de código de barras',
    description: 'Integración de cámara para escanear EAN/QR en formularios de compra, transferencia y conteo.',
    priority: 'P2',
    category: 'mobile',
    effort: 'large',
  },
  {
    id: 'reports-kpis',
    title: 'Capa de reportes KPI completa',
    description: 'Completar lib/server/reports-kpis.ts con queries reales. Stock health chart. Movement trends. Purchase summary. Count discrepancies.',
    priority: 'P2',
    category: 'exports',
    effort: 'large',
  },

  // ── P3 — Lower priority / hardening ───────────────────────────────────────
  {
    id: 'e2e-tests',
    title: 'Tests E2E con Playwright',
    description: 'Suite de tests end-to-end para flujos críticos: crear compra, recibir, verificar stock.',
    priority: 'P3',
    category: 'infra',
    effort: 'large',
  },
  {
    id: 'pwa-offline',
    title: 'PWA / modo offline',
    description: 'Service worker para usar en zonas sin conectividad. Sincronización diferida de conteos.',
    priority: 'P3',
    category: 'mobile',
    effort: 'large',
  },
  {
    id: 'rollback-tooling',
    title: 'Tooling de rollback avanzado',
    description: 'UI de admin para revertir movimientos individuales con audit trail y aprobación.',
    priority: 'P3',
    category: 'inventory',
    effort: 'large',
    blockedBy: 'permissions-editor',
  },
  {
    id: 'advanced-charting',
    title: 'Gráficos avanzados interactivos',
    description: 'Charts drill-down por producto, por local, por período. Comparativas interanuales.',
    priority: 'P3',
    category: 'exports',
    effort: 'large',
    blockedBy: 'reports-kpis',
  },
  {
    id: 'retry-offline-queue',
    title: 'Cola de retry offline',
    description: 'Reintentar operaciones fallidas automáticamente con backoff exponencial.',
    priority: 'P3',
    category: 'infra',
    effort: 'large',
    blockedBy: 'pwa-offline',
  },
  {
    id: 'print-receipts',
    title: 'Impresión de recibos y hojas de conteo',
    description: 'Print stylesheet para comprobante de recepción, hoja de conteo físico, resumen de transferencia.',
    priority: 'P3',
    category: 'ux',
    effort: 'small',
  },
  {
    id: 'mobile-perf',
    title: 'Optimización de performance mobile',
    description: 'Virtualización de listas largas, lazy loading de imágenes, reducción de JS bundle.',
    priority: 'P3',
    category: 'mobile',
    effort: 'medium',
  },
  {
    id: 'dark-light-toggle',
    title: 'Toggle dark/light mode',
    description: 'Soporte de tema claro. Persistir preferencia en localStorage.',
    priority: 'P3',
    category: 'ux',
    effort: 'medium',
  },
]

export function getBacklogByPriority(priority: BacklogPriority): BacklogItem[] {
  return POST_MVP_BACKLOG.filter((i) => i.priority === priority)
}

export function getBacklogByCategory(category: BacklogCategory): BacklogItem[] {
  return POST_MVP_BACKLOG.filter((i) => i.category === category)
}

export function getBacklogSummary() {
  return {
    total: POST_MVP_BACKLOG.length,
    p1: POST_MVP_BACKLOG.filter((i) => i.priority === 'P1').length,
    p2: POST_MVP_BACKLOG.filter((i) => i.priority === 'P2').length,
    p3: POST_MVP_BACKLOG.filter((i) => i.priority === 'P3').length,
    byCategory: Object.fromEntries(
      [...new Set(POST_MVP_BACKLOG.map((i) => i.category))].map((cat) => [
        cat,
        POST_MVP_BACKLOG.filter((i) => i.category === cat).length,
      ])
    ),
  }
}
