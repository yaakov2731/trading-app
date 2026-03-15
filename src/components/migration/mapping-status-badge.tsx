/**
 * components/migration/mapping-status-badge.tsx
 * Displays confidence/mapping status for import rows and balance candidates.
 */

'use client'

import type { ConfidenceLevel } from '@/lib/validations/migration'
import { CONFIDENCE_LABELS } from '@/lib/validations/migration'

interface MappingStatusBadgeProps {
  confidence: ConfidenceLevel | string | null | undefined
  matchMethod?: string | null
  showMethod?: boolean
  size?: 'sm' | 'md'
}

const CONFIDENCE_STYLE: Record<string, string> = {
  high:       'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  medium:     'text-amber-400 bg-amber-500/10 border-amber-500/30',
  low:        'text-orange-400 bg-orange-500/10 border-orange-500/30',
  unresolved: 'text-red-400 bg-red-500/10 border-red-500/30',
}

const METHOD_LABELS: Record<string, string> = {
  sku_exact:    'SKU exacto',
  sku_prefix:   'SKU parcial',
  name_exact:   'Nombre exacto',
  name_partial: 'Nombre parcial',
  none:         'Sin coincidencia',
}

export default function MappingStatusBadge({
  confidence,
  matchMethod,
  showMethod = false,
  size = 'sm',
}: MappingStatusBadgeProps) {
  const key = confidence ?? 'unresolved'
  const style = CONFIDENCE_STYLE[key] ?? CONFIDENCE_STYLE.unresolved
  const label = CONFIDENCE_LABELS[key as ConfidenceLevel] ?? key

  const sizeClass = size === 'md'
    ? 'px-2.5 py-1 text-xs'
    : 'px-2 py-0.5 text-[11px]'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border font-medium ${sizeClass} ${style}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
        key === 'high' ? 'bg-emerald-400' :
        key === 'medium' ? 'bg-amber-400' :
        key === 'low' ? 'bg-orange-400' : 'bg-red-400'
      }`} />
      {label}
      {showMethod && matchMethod && matchMethod !== 'none' && (
        <span className="opacity-60">· {METHOD_LABELS[matchMethod] ?? matchMethod}</span>
      )}
    </span>
  )
}
