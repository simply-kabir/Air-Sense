'use client'

import { getHealthRecommendations, getAQIColor, getAirBearMessage } from '@/lib/aqi-utils'
import { useMode } from '@/components/ui/ModeProvider'
import clsx from 'clsx'

interface HealthRecommendationsProps {
  aqi: number
  loading?: boolean
  className?: string
}

export function HealthRecommendations({ aqi, loading, className }: HealthRecommendationsProps) {
  const { isKids } = useMode()
  const recs  = getHealthRecommendations(aqi)
  const color = getAQIColor(aqi)

  if (loading) {
    return (
      <div className={clsx('glass rounded-3xl p-5', className)}>
        <div className="skeleton h-4 w-40 mb-4" />
        {[1,2,3].map(i => (
          <div key={i} className="flex gap-3 mb-3">
            <div className="skeleton w-8 h-8 rounded-xl shrink-0" />
            <div className="flex-1">
              <div className="skeleton h-3 w-24 mb-2" />
              <div className="skeleton h-2 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isKids) {
    return (
      <div
        className={clsx('rounded-3xl p-5', className)}
        style={{
          background: `${color}12`,
          border: `1px solid ${color}25`,
        }}
      >
        {/* FIX 1: Changed from text-muted to dark purple inline style */}
        <div 
          className="text-xs font-mono uppercase tracking-wider mb-3 font-bold"
          style={{ color: '#2D1B69' }}
        >
          Air Bear Says 🐻
        </div>

        {/* FIX 2: Changed from var(--white) to dark purple, added a white pill background */}
        <div
          className="rounded-2xl p-3 text-base font-body leading-relaxed"
          style={{ 
            background: 'rgba(255,255,255,0.6)', 
            color: '#2D1B69',
            fontWeight: 500
          }}
        >
          {getAirBearMessage(aqi)}
        </div>
      </div>
    )
  }

  return (
    <div className={clsx('glass rounded-3xl p-5', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-mono text-muted uppercase tracking-wider">
          Health Recommendations
        </div>
        <div
          className="text-[10px] font-mono px-2 py-0.5 rounded"
          style={{ background: `${color}18`, color }}
        >
          AQI {aqi}
        </div>
      </div>

      <div className="space-y-3">
        {recs.map((rec, i) => (
          <div
            key={i}
            className="flex gap-3 p-3 rounded-2xl transition-colors hover:bg-navy-500/30"
            style={{ background: 'rgba(10,17,40,0.4)' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
              style={{ background: `${color}15`, border: `1px solid ${color}25` }}
            >
              {rec.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-display font-600 text-white"
                  style={{ fontFamily:'var(--font-display)' }}>
                  {rec.group}
                </span>
              </div>
              <p className="text-xs text-muted leading-snug">{rec.message}</p>
              <p className="text-xs font-mono mt-1" style={{ color }}>{rec.action}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}