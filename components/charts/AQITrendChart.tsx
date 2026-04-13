'use client'

import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine,
} from 'recharts'
import { getAQIColor } from '@/lib/aqi-utils'
import type { AQITrendPoint } from '@/types'
import clsx from 'clsx'

interface AQITrendChartProps {
  data: AQITrendPoint[]
  loading?: boolean
  currentAqi?: number
  className?: string
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  const aqi   = payload[0].value
  const color = getAQIColor(aqi)

  return (
    <div
      className="px-3 py-2 rounded-xl text-xs"
      style={{
        background: 'rgba(10,17,40,0.95)',
        border: `1px solid ${color}40`,
        fontFamily: 'var(--font-mono)',
        boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 16px ${color}20`,
      }}
    >
      <div className="text-muted mb-0.5">{label}</div>
      <div className="font-700 text-base" style={{ color }}>{aqi} AQI</div>
    </div>
  )
}

export function AQITrendChart({ data, loading, currentAqi = 100, className }: AQITrendChartProps) {
  const color = getAQIColor(currentAqi)

  if (loading) {
    return (
      <div className={clsx('glass rounded-3xl p-5', className)}>
        <div className="skeleton h-4 w-32 mb-4" />
        <div className="skeleton rounded-xl" style={{ height: 160 }} />
      </div>
    )
  }

  // Show every 4th label to avoid crowding
  const tickFormatter = (_: unknown, index: number) =>
    index % 4 === 0 ? data[index]?.hour ?? '' : ''

  return (
    <div className={clsx('glass rounded-3xl p-5', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-mono text-muted uppercase tracking-wider">
            24-hour AQI Trend
          </div>
          <div className="text-[10px] text-muted2 font-mono mt-0.5">
            Estimated hourly variation
          </div>
        </div>
        {/* Mini legend */}
        <div className="flex items-center gap-3">
          {[
            { label: 'Good',   color: '#00E5A0' },
            { label: 'Moderate', color: '#FFD60A' },
            { label: 'Unhealthy', color: '#FF3B4E' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
              <span className="text-[9px] font-mono text-muted2">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={170}>
        <AreaChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="hour"
            tickLine={false}
            axisLine={false}
            tickFormatter={tickFormatter}
            interval={0}
          />
          <YAxis tickLine={false} axisLine={false} domain={['auto', 'auto']} />

          {/* AQI threshold lines */}
          <ReferenceLine y={50}  stroke="#00E5A0" strokeDasharray="4 4" strokeOpacity={0.3} strokeWidth={1} />
          <ReferenceLine y={100} stroke="#FFD60A" strokeDasharray="4 4" strokeOpacity={0.3} strokeWidth={1} />
          <ReferenceLine y={150} stroke="#FF8C00" strokeDasharray="4 4" strokeOpacity={0.3} strokeWidth={1} />
          <ReferenceLine y={200} stroke="#FF3B4E" strokeDasharray="4 4" strokeOpacity={0.3} strokeWidth={1} />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="aqi"
            stroke={color}
            strokeWidth={2}
            fill="url(#aqiGradient)"
            dot={false}
            activeDot={{ r: 4, fill: color, stroke: 'rgba(10,17,40,0.8)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
