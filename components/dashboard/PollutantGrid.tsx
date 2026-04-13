'use client'

import { useMode } from '@/components/ui/ModeProvider'
import { POLLUTANT_INFO, formatPollutant } from '@/lib/aqi-utils'
import type { AQIStation } from '@/types'
import clsx from 'clsx'

interface PollutantGridProps {
  station: AQIStation | null
  loading?: boolean
  className?: string
}

interface PollutantBarProps {
  value: number | null
  max: number
  color: string
}

function PollutantBar({ value, max, color }: PollutantBarProps) {
  const pct = value !== null ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="relative h-1 rounded-full overflow-hidden mt-2"
      style={{ background: 'rgba(59,111,232,0.12)' }}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}60` }}
      />
    </div>
  )
}

const POLLUTANTS = ['pm25','pm10','o3','no2','so2','co'] as const

export function PollutantGrid({ station, loading, className }: PollutantGridProps) {
  const { isKids } = useMode()

  if (loading) {
    return (
      <div className={clsx('grid grid-cols-2 sm:grid-cols-3 gap-3', className)}>
        {POLLUTANTS.map(p => (
          <div key={p} className="glass rounded-2xl p-4 animate-pulse">
            <div className="skeleton h-3 w-12 mb-3" />
            <div className="skeleton h-6 w-16 mb-2" />
            <div className="skeleton h-1 w-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={clsx('grid grid-cols-2 sm:grid-cols-3 gap-3', className)}>
      {POLLUTANTS.map(key => {
        const info  = POLLUTANT_INFO[key]
        const value = station?.[key as keyof AQIStation] as number | null ?? null
        const hasData = value !== null

        return (
          <div
            key={key}
            className={clsx(
              'glass rounded-2xl p-4 transition-all duration-200 card-hover',
              !hasData && 'opacity-50'
            )}
          >
            {/* Label */}
            <div className="text-xs font-mono text-muted uppercase tracking-wider mb-1">
              {isKids ? info.kidsLabel : info.label}
            </div>

            {/* Value */}
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-2xl font-display font-700 leading-none"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: hasData ? info.color : 'var(--muted2)',
                }}
              >
                {hasData ? formatPollutant(value) : '—'}
              </span>
              {hasData && (
                <span className="text-[10px] font-mono text-muted2">{info.unit}</span>
              )}
            </div>

            {/* Kids description */}
            {isKids && (
              <p className="text-[10px] text-muted2 mt-1 leading-tight">{info.kidsDesc}</p>
            )}

            {/* Bar */}
            <PollutantBar value={value} max={info.maxSafe * 3} color={info.color} />

            {/* Safe threshold note */}
            {!isKids && hasData && (
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[9px] font-mono text-muted2">
                  Safe: {info.maxSafe} {info.unit}
                </span>
                {value !== null && value > info.maxSafe && (
                  <span className="text-[9px] font-mono text-aqi-sensitive">↑ elevated</span>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
