/**
 * components/settings/known-issues-panel.tsx
 * Known issues panel for system settings page.
 */

interface KnownIssue {
  id: string
  category: string
  severity: 'low' | 'medium' | 'high'
  title: string
  description: string
  workaround?: string
  deferredTo?: string
}

const KNOWN_ISSUES: KnownIssue[] = [
  {
    id: 'ki-01',
    category: 'Base de datos',
    severity: 'high',
    title: 'Tablas de migración no se crean automáticamente',
    description: 'Las tablas migration_opening_balance_candidates, migration_cutover_log y audit_logs deben crearse manualmente con el SQL incluido en README_DEPLOY.md.',
    workaround: 'Ejecutar el bloque SQL de "Additional tables" antes del primer uso de migración.',
  },
  {
    id: 'ki-02',
    category: 'Build',
    severity: 'medium',
    title: 'Tipos de Supabase no generados automáticamente',
    description: 'El SDK de Supabase no tiene tipos generados (Database<...>). Las consultas usan any implícito en algunos casos.',
    workaround: 'Ejecutar: supabase gen types typescript --local > src/lib/supabase/database.types.ts',
    deferredTo: 'Post-MVP hardening',
  },
  {
    id: 'ki-03',
    category: 'UX',
    severity: 'low',
    title: 'GlobalCommandBar sin navegación por teclado ↑↓',
    description: 'El command bar (Cmd+K) abre y filtra correctamente pero no soporta navegación por teclado en la lista de resultados.',
    workaround: 'Usar mouse o touch para seleccionar.',
    deferredTo: 'Post-MVP polish',
  },
  {
    id: 'ki-04',
    category: 'Flujos',
    severity: 'medium',
    title: 'Sin recepción parcial de compras',
    description: 'Al recibir una compra, todos los ítems se marcan como recibidos en su totalidad. No hay soporte para recibir cantidades parciales por ítem.',
    deferredTo: 'Post-MVP P1',
  },
  {
    id: 'ki-05',
    category: 'Flujos',
    severity: 'low',
    title: 'Sin cancelación de transferencia en tránsito',
    description: 'Una transferencia enviada (transfer_out registrado) no puede cancelarse desde la UI. El admin puede revertir manualmente desde BD.',
    deferredTo: 'Post-MVP P1',
  },
  {
    id: 'ki-06',
    category: 'Reportes',
    severity: 'medium',
    title: 'Dashboard ejecutivo sin gráficos reales',
    description: 'Las páginas de reportes están scaffolded con estructura correcta pero los gráficos de tendencia y KPI no están conectados a una librería de charts.',
    deferredTo: 'Post-MVP P1',
  },
  {
    id: 'ki-07',
    category: 'Exportaciones',
    severity: 'low',
    title: 'Exportaciones bloquean el hilo principal',
    description: 'Para datasets grandes (>5000 filas), la generación de Excel puede ser lenta ya que corre en el mismo proceso. No hay background jobs.',
    workaround: 'Filtrar por fecha o ubicación para reducir el volumen exportado.',
    deferredTo: 'Post-MVP P2',
  },
  {
    id: 'ki-08',
    category: 'Auth',
    severity: 'low',
    title: 'Editor de permisos individuales no implementado',
    description: 'La matriz de roles es de solo lectura. No se pueden asignar permisos granulares a usuarios individuales.',
    deferredTo: 'Post-MVP P2',
  },
  {
    id: 'ki-09',
    category: 'Migración',
    severity: 'low',
    title: 'Google Sheets sync sin wiring de OAuth',
    description: 'Los helpers de payload para Google Sheets están listos pero la autenticación OAuth con Google no está conectada.',
    deferredTo: 'Post-MVP P2',
  },
  {
    id: 'ki-10',
    category: 'Testing',
    severity: 'low',
    title: 'Sin tests E2E',
    description: 'La suite de Vitest cubre unit tests e integration tests con mocks. No hay tests Playwright contra el navegador real.',
    deferredTo: 'Post-MVP P3',
  },
]

function severityStyle(severity: KnownIssue['severity']) {
  return {
    high:   'text-red-400 bg-red-500/10 border-red-500/30',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    low:    'text-slate-400 bg-slate-700/50 border-slate-600/50',
  }[severity]
}

function severityLabel(severity: KnownIssue['severity']) {
  return { high: 'Alto', medium: 'Medio', low: 'Bajo' }[severity]
}

export default function KnownIssuesPanel() {
  const high = KNOWN_ISSUES.filter((i) => i.severity === 'high')
  const medium = KNOWN_ISSUES.filter((i) => i.severity === 'medium')
  const low = KNOWN_ISSUES.filter((i) => i.severity === 'low')

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="font-semibold text-white">Issues conocidos</h2>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">{high.length} alto</span>
          <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">{medium.length} medio</span>
          <span className="px-2 py-0.5 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-400">{low.length} bajo</span>
        </div>
      </div>

      <div className="divide-y divide-slate-800">
        {KNOWN_ISSUES.map((issue) => (
          <div key={issue.id} className="p-4 space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-500">{issue.id}</span>
                  <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">{issue.category}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border ${severityStyle(issue.severity)}`}>
                    {severityLabel(issue.severity)}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-200 mt-1">{issue.title}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{issue.description}</p>
            {issue.workaround && (
              <p className="text-xs text-emerald-400">
                <span className="font-medium">Workaround:</span> {issue.workaround}
              </p>
            )}
            {issue.deferredTo && (
              <p className="text-xs text-slate-600">Deferido a: {issue.deferredTo}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
