'use client'

import * as React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend
} from 'recharts'
import { formatCurrency } from '@/lib/utils/format'

// =============================================================================
// StockValueChart — horizontal bar chart, stock value by location
// =============================================================================

interface LocationStockData {
  name:       string
  shortName:  string
  value:      number
  products:   number
  color:      string
}

interface StockValueChartProps {
  data: LocationStockData[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-900 mb-1.5">{label}</p>
      <p className="text-slate-600">
        Valor: <span className="font-bold text-slate-900 tabular-nums">{formatCurrency(d.value)}</span>
      </p>
      <p className="text-slate-400 mt-0.5">
        {payload[0]?.payload?.products ?? 0} productos
      </p>
    </div>
  )
}

export function StockValueChart({ data }: StockValueChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-400">
        Sin datos de stock
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
        barCategoryGap="28%"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#f1f5f9"
          vertical={false}
        />
        <XAxis
          dataKey="shortName"
          tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => {
            if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
            if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`
            return `$${v}`
          }}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 8 }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={52}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} opacity={0.9} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// =============================================================================
// CategoryBreakdownChart — donut / mini bar chart for category distribution
// =============================================================================

interface CategoryData {
  name:    string
  prefix:  string
  value:   number
  color:   string
}

interface CategoryBreakdownProps {
  data: CategoryData[]
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return null

  const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, 6)

  return (
    <div className="space-y-2.5">
      {sorted.map(cat => {
        const pct = total > 0 ? (cat.value / total) * 100 : 0
        return (
          <div key={cat.prefix} className="flex items-center gap-3">
            <span
              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            <span className="text-xs text-slate-600 flex-1 truncate">{cat.name}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct.toFixed(1)}%`, backgroundColor: cat.color }}
                />
              </div>
              <span className="text-xs font-medium text-slate-500 tabular-nums w-10 text-right">
                {pct.toFixed(0)}%
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
