/**
 * components/ui/inline-stat.tsx
 * Compact stat card for KPI grids and summary rows.
 */

interface InlineStatProps {
  label: string
  value: string | number
  valueColor?: string
  trend?: { value: number; label?: string }
  className?: string
}

export default function InlineStat({
  label,
  value,
  valueColor = 'text-white',
  trend,
  className = '',
}: InlineStatProps) {
  return (
    <div className={`p-4 bg-slate-900/60 border border-slate-800 rounded-xl ${className}`}>
      <div className={`text-2xl font-bold leading-none ${valueColor}`}>
        {typeof value === 'number' ? value.toLocaleString('es-AR') : value}
      </div>
      <div className="text-xs text-slate-500 mt-1.5">{label}</div>
      {trend && (
        <div className={`text-xs mt-1 font-medium ${trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label ?? ''}
        </div>
      )}
    </div>
  )
}
