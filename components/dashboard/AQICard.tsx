'use client'

import { useMode } from '@/components/ui/ModeProvider'
import {
  getAQIColor, getAQICategory, getKidsCategory,
  getAQIRisk, formatAQI,
} from '@/lib/aqi-utils'
import type { AQIStation } from '@/types'
import { Wind, AlertTriangle, MapPin, Building2 } from 'lucide-react'
import clsx from 'clsx'

// ─── Props ────────────────────────────────────────────────────────────────────
interface AQICardProps {
  station:      AQIStation | null
  loading?:     boolean
  className?:   string
  // Dual-AQI props — only passed when auto-detect + multiple nearby stations
  cityAvgAqi?:  number | null   // average of all nearby stations
  nearbyCount?: number          // how many stations in bounds
  isAutoDetect?: boolean        // was this triggered by geolocation?
}

// ─── Risk Bar ─────────────────────────────────────────────────────────────────
function RiskBar({ aqi }: { aqi: number }) {
  const pct   = getAQIRisk(aqi)
  const color = getAQIColor(aqi)
  return (
    <div>
      {/* Rainbow track (dim) */}
      <div
        className="relative h-2 rounded-full overflow-hidden mb-1"
        style={{
          background: 'linear-gradient(90deg,#00E5A0 0%,#FFD60A 20%,#FF8C00 40%,#FF3B4E 60%,#9B2FFF 80%,#7B0000 100%)',
          opacity: 0.3,
        }}
      />
      {/* Active fill */}
      <div className="relative h-2 rounded-full overflow-hidden -mt-3">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width:`${pct}%`, background:color, boxShadow:`0 0 8px ${color}80` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-lg transition-all duration-700"
          style={{ left:`calc(${pct}% - 6px)`, background:color }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] font-mono text-muted2">0</span>
        {[100,200,300].map(v => <span key={v} className="text-[9px] font-mono text-muted2">{v}</span>)}
        <span className="text-[9px] font-mono text-muted2">500+</span>
      </div>
    </div>
  )
}

// ─── Mini AQI chip (used for the second / city-average number) ────────────────
function AQIChip({
  aqi, label, icon: Icon, sublabel,
}: {
  aqi: number
  label: string
  icon: React.ElementType
  sublabel?: string
}) {
  const color = getAQIColor(aqi)
  const cat   = getAQICategory(aqi)
  return (
    <div
      className="flex-1 flex flex-col gap-1.5 p-3 rounded-2xl"
      style={{ background:`${color}10`, border:`1px solid ${color}25` }}
    >
      <div className="flex items-center gap-1.5">
        <Icon size={11} style={{ color }} />
        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color:'var(--muted2)' }}>
          {label}
        </span>
      </div>
      <div className="flex items-end gap-1.5">
        <span
          className="font-display font-800 leading-none"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 36,
            color,
            textShadow:`0 0 24px ${color}60`,
          }}
        >
          {formatAQI(aqi)}
        </span>
      </div>
      <div
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-600 w-fit"
        style={{ background:`${color}18`, border:`1px solid ${color}30`, color }}
      >
        {cat}
      </div>
      {sublabel && (
        <span className="text-[9px] font-mono" style={{ color:'var(--muted2)' }}>{sublabel}</span>
      )}
    </div>
  )
}

// ─── Main Card ────────────────────────────────────────────────────────────────
export function AQICard({
  station,
  loading,
  className,
  cityAvgAqi,
  nearbyCount,
  isAutoDetect = false,
}: AQICardProps) {
  const { isKids } = useMode()

  // Show dual AQI only when:
  // 1. User auto-detected location
  // 2. cityAvgAqi exists AND is meaningfully different from station AQI (>5 points)
  // 3. There are at least 2 nearby stations
  const showDual =
    isAutoDetect &&
    cityAvgAqi !== null &&
    cityAvgAqi !== undefined &&
    nearbyCount !== undefined &&
    nearbyCount >= 2 &&
    station !== null &&
    Math.abs(cityAvgAqi - station.aqi) > 5

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={clsx('glass rounded-3xl p-6 animate-pulse', className)}>
        <div className="skeleton h-4 w-28 mb-4" />
        <div className="skeleton h-20 w-32 mb-3" />
        <div className="skeleton h-3 w-40 mb-6" />
        <div className="skeleton h-2 w-full" />
      </div>
    )
  }

  // ── Empty state ─────────────────────────────────────────────────────────
  if (!station) {
    return (
      <div className={clsx('glass rounded-3xl p-6 flex flex-col items-center justify-center text-center min-h-[200px]', className)}>
        <AlertTriangle size={32} className="text-muted2 mb-3" />
        <p className="text-muted text-sm">No data available</p>
        <p className="text-muted2 text-xs mt-1">Try searching a city above</p>
      </div>
    )
  }

  const color    = getAQIColor(station.aqi)
  const category = isKids ? getKidsCategory(station.aqi) : getAQICategory(station.aqi)

  const kidsEmoji = () => {
    if (station.aqi <= 50)  return '🌟'
    if (station.aqi <= 100) return '🙂'
    if (station.aqi <= 150) return '🤧'
    if (station.aqi <= 200) return '😷'
    if (station.aqi <= 300) return '🚫'
    return '⚠️'
  }

  return (
    <div
      className={clsx('relative rounded-3xl p-6 overflow-hidden', className)}
      style={{
        background:     `radial-gradient(ellipse at top right, ${color}15 0%, rgba(15,26,58,0.8) 60%)`,
        border:         `1px solid ${color}25`,
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-4 right-4 w-32 h-32 rounded-full pointer-events-none"
        style={{ background:`radial-gradient(circle, ${color}20 0%, transparent 70%)` }}
      />

      {/* Station name row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:color }} />
            <span className="text-xs font-mono text-muted uppercase tracking-widest">Live</span>
          </div>
          <h2 className="font-display font-700 text-white text-lg leading-tight"
            style={{ fontFamily:'var(--font-display)' }}>
            {station.name.split(',')[0]}
          </h2>
          <p className="text-muted2 text-xs mt-0.5 font-mono">
            {station.name.includes(',')
              ? station.name.split(',').slice(1).join(',').trim()
              : 'Air Quality Station'}
          </p>
        </div>
        <Wind size={18} className="text-muted2 mt-1" />
      </div>

      {/* ── DUAL AQI LAYOUT ────────────────────────────────────────────────── */}
      {showDual ? (
        <div className="mb-4">
          <div className="text-xs font-mono text-muted uppercase tracking-wider mb-2.5">
            {isKids ? 'Air Scores' : 'AQI Readings'}
          </div>

          {/* Two chips side by side */}
          <div className="flex gap-2.5 mb-3">
            <AQIChip
              aqi={station.aqi}
              label="Nearest Station"
              icon={MapPin}
              sublabel={station.name.split(',')[0]}
            />
            <AQIChip
              aqi={cityAvgAqi!}
              label={`City Avg · ${nearbyCount} stations`}
              icon={Building2}
              sublabel="Surrounding area"
            />
          </div>

          {/* Explain the difference */}
          <div
            className="flex items-start gap-2 px-3 py-2 rounded-xl text-[10px] font-mono"
            style={{ background:'rgba(59,111,232,0.07)', border:'1px solid rgba(59,111,232,0.12)' }}
          >
            <span className="text-cobalt-300 mt-0.5">ℹ</span>
            <span style={{ color:'var(--muted2)' }}>
              {station.aqi > cityAvgAqi!
                ? `Your nearest station is ${station.aqi - cityAvgAqi!} points worse than the city average`
                : `Your nearest station is ${cityAvgAqi! - station.aqi} points better than the city average`
              }
            </span>
          </div>
        </div>
      ) : (
        /* ── SINGLE AQI LAYOUT (manual search OR only 1 station) ─────────── */
        <div className="mb-4">
          <div className="text-xs font-mono text-muted uppercase tracking-wider mb-1">
            {isKids ? 'Air Score' : 'AQI Index'}
          </div>
          <div className="flex items-end gap-3">
            <span
              className="font-display font-800 leading-none"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize:   'clamp(3rem, 8vw, 4.5rem)',
                color,
                textShadow: `0 0 40px ${color}60`,
              }}
            >
              {formatAQI(station.aqi)}
            </span>
            {isKids && (
              <span className="text-4xl mb-1 animate-float">{kidsEmoji()}</span>
            )}
          </div>

          {/* Category badge */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-600 mt-2"
            style={{
              background: `${color}18`,
              border:     `1px solid ${color}35`,
              color,
              fontFamily: 'var(--font-display)',
            }}
          >
            {category}
          </div>
        </div>
      )}

      {/* Dominant pollutant */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xs text-muted2 font-mono">Dominant pollutant:</span>
        <span
          className="text-xs font-mono font-500 uppercase tracking-wider px-2 py-0.5 rounded"
          style={{ background:`${color}15`, color }}
        >
          {station.dominant_pollutant?.toUpperCase() || 'PM2.5'}
        </span>
      </div>

      {/* Risk bar — always shown, uses nearest station AQI */}
      <div>
        <div className="text-[10px] font-mono text-muted2 uppercase tracking-wider mb-2">
          Risk level {showDual && <span style={{ color:'var(--muted2)' }}>(nearest station)</span>}
        </div>
        <RiskBar aqi={station.aqi} />
      </div>
    </div>
  )
}
