'use client'

import * as React from 'react'
import { Download, FileSpreadsheet, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { exportToExcel } from '@/lib/utils/export'
import { getExportData } from '@/server/actions/export'

export default function ReportsPage() {
  const [isExporting, setIsExporting] = React.useState(false)
  const [locationId,  setLocationId]  = React.useState('')

  async function handleExport() {
    setIsExporting(true)
    try {
      const result = await getExportData(locationId || undefined)
      if (!result.success || !result.data) {
        toast.error('Error al obtener datos para exportar')
        return
      }
      await exportToExcel(result.data)
      toast.success('Archivo Excel generado correctamente')
    } catch (err) {
      toast.error('Error al generar el archivo')
    } finally {
      setIsExporting(false)
    }
  }

  const SHEETS = [
    { name: 'Parametros',       desc: 'Metadatos y configuración',            type: 'config'  },
    { name: 'Locales',          desc: 'Lista de locales',                     type: 'master'  },
    { name: 'Categorias',       desc: 'Categorías de productos',              type: 'master'  },
    { name: 'Unidades',         desc: 'Unidades de medida',                  type: 'master'  },
    { name: 'Productos',        desc: 'Catálogo de productos con SKU',        type: 'master'  },
    { name: 'Stock_Actual',     desc: 'Stock actual por producto y local',    type: 'data'    },
    { name: 'Movimientos',      desc: 'Historial completo de movimientos',    type: 'data'    },
    { name: 'Compras',          desc: 'Compras y recepciones',                type: 'data'    },
    { name: 'Transferencias',   desc: 'Transferencias entre locales',         type: 'data'    },
    { name: 'Conteos_Fisicos',  desc: 'Conteos físicos y reconciliaciones',  type: 'data'    },
  ]

  return (
    <div className="space-y-6">
      {/* ── Export card ──────────────────────────────────────────────────── */}
      <Card variant="highlight" padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="rounded-xl bg-brand-100 p-3">
              <FileSpreadsheet size={24} className="text-brand-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Exportar a Excel</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Genera un workbook completo con {SHEETS.length} hojas de datos.
                Ideal para reportes, auditorías y análisis en Google Sheets.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="lg"
            loading={isExporting}
            loadingText="Generando..."
            onClick={handleExport}
            leftIcon={<Download size={16} />}
            className="flex-shrink-0"
          >
            Exportar ahora
          </Button>
        </div>
      </Card>

      {/* ── Workbook structure ───────────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Estructura del workbook</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SHEETS.map(sheet => (
            <div
              key={sheet.name}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className={[
                'flex-shrink-0 rounded-lg p-1.5',
                sheet.type === 'config' ? 'bg-slate-100' :
                sheet.type === 'master' ? 'bg-brand-50' :
                'bg-success-50'
              ].join(' ')}>
                <FileSpreadsheet size={14} className={
                  sheet.type === 'config' ? 'text-slate-500' :
                  sheet.type === 'master' ? 'text-brand-600' :
                  'text-success-600'
                } />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 font-mono">{sheet.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{sheet.desc}</p>
                <span className={[
                  'inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide',
                  sheet.type === 'config' ? 'bg-slate-100 text-slate-500' :
                  sheet.type === 'master' ? 'bg-brand-50 text-brand-600' :
                  'bg-success-50 text-success-700'
                ].join(' ')}>
                  {sheet.type === 'config' ? 'Config' : sheet.type === 'master' ? 'Maestra' : 'Operacional'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Notes ────────────────────────────────────────────────────────── */}
      <Card variant="flat" padding="md">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Importante</p>
        <ul className="space-y-1.5 text-sm text-slate-600">
          <li>• El archivo exportado es de solo lectura. No modifiques los datos manualmente.</li>
          <li>• Las hojas de datos representan un snapshot al momento de la exportación.</li>
          <li>• La base de datos transaccional siempre es la fuente de verdad.</li>
          <li>• Google Sheets puede importar el archivo .xlsx directamente.</li>
        </ul>
      </Card>
    </div>
  )
}
