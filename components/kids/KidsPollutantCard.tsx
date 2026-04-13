'use client'

import { POLLUTANT_INFO, formatPollutant } from '@/lib/aqi-utils'
import type { AQIStation } from '@/types'

interface KidsPollutantCardProps {
  pollutant: keyof typeof POLLUTANT_INFO
  station: AQIStation | null
}

const BIG_EMOJIS: Record<string, string> = {
  pm25: '✨',
  pm10: '🌫️',
  o3: '☁️',
  no2: '🚗',
  so2: '🏭',
  co: '👻',
}

export function KidsPollutantCard({ pollutant, station }: KidsPollutantCardProps) {
  const info = POLLUTANT_INFO[pollutant]
  const value = station?.[pollutant as keyof AQIStation] as number | null ?? null
  const hasData = value !== null
  const pct = hasData ? Math.min((value / (info.maxSafe * 3)) * 100, 100) : 0
  const isSafe = hasData && value <= info.maxSafe

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 cursor-default"
      style={{
        background: `${info.color}12`,
        border: `1px solid ${info.color}30`,
      }}
    >
      {/* Emoji + label */}
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 22 }}>{BIG_EMOJIS[pollutant]}</span>
        <div>
          {/* FIX: Changed text-white to a dark color so it's visible on light backgrounds */}
          <div className="text-xs" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#2D1B69' }}>
            {info.kidsLabel}
          </div>
          {/* FIX: Removed invalid text-muted2 class, using inline style */}
          <div className="text-[10px] leading-tight" style={{ color: 'rgba(45, 27, 105, 0.5)' }}>{info.kidsDesc}</div>
        </div>
      </div>

      {/* Value */}
      <div className="flex items-center justify-between">
        <span
          className="text-2xl"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            color: hasData ? info.color : 'rgba(45, 27, 105, 0.3)' // FIX: removed var(--muted2)
          }}
        >
          {hasData ? formatPollutant(value) : '—'}
        </span>
        {hasData && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={isSafe ? {
              background: '#00E5A015',
              color: '#00E5A0',
              border: '1px solid #00E5A030',
              fontWeight: 700,
              fontFamily: 'var(--font-display)'
            } : {
              background: `${info.color}15`,
              color: info.color,
              border: `1px solid ${info.color}30`,
              fontWeight: 700,
              fontFamily: 'var(--font-display)'
            }}
          >
            {isSafe ? '✅ Safe' : '⚠️ High'}
          </span>
        )}
      </div>

      {/* Bar */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(59,111,232,0.1)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: info.color, boxShadow: `0 0 6px ${info.color}60` }}
        />
      </div>
    </div>
  )
}