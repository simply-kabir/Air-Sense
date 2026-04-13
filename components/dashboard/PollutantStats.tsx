'use client'

import { useState } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from 'recharts'
import { POLLUTANT_INFO, formatPollutant } from '@/lib/aqi-utils'
import type { AQIStation } from '@/types'
import clsx from 'clsx'

// ── WHO + India NAAQS guidelines ─────────────────────────────────────────────
const GUIDELINES: Record<string, { who: number; india: number; unit: string }> = {
  pm25: { who: 15,  india: 60,  unit: 'μg/m³' },
  pm10: { who: 45,  india: 100, unit: 'μg/m³' },
  o3:   { who: 60,  india: 100, unit: 'ppb'    },
  no2:  { who: 10,  india: 80,  unit: 'ppb'    },
  so2:  { who: 40,  india: 80,  unit: 'ppb'    },
  co:   { who: 4,   india: 2,   unit: 'ppm'    },
}

const KEYS = ['pm25', 'pm10', 'o3', 'no2', 'so2', 'co'] as const
type PKey = typeof KEYS[number]

const TABS = [
  { id: 'bars',  label: 'Health Index',   icon: '📊' },
  { id: 'radar', label: 'Radar',          icon: '🕸️' },
  { id: 'table', label: 'WHO vs India',   icon: '📋' },
] as const

type TabId = typeof TABS[number]['id']

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStatusLabel(pct: number): { label: string; color: string } {
  if (pct <= 60)  return { label: 'Safe',      color: '#00E5A0' }
  if (pct <= 100) return { label: 'Moderate',  color: '#FFD60A' }
  if (pct <= 150) return { label: 'Elevated',  color: '#FF8C00' }
  if (pct <= 200) return { label: 'High',      color: '#FF3B4E' }
  return               { label: 'Dangerous',  color: '#9B2FFF' }
}

function getDeltaLabel(val: number, limit: number) {
  const diff = val - limit
  if (diff <= 0) return { text: `${Math.abs(diff).toFixed(1)} below`, color: '#00E5A0', arrow: '↓' }
  return              { text: `${diff.toFixed(1)} above`,           color: '#FF3B4E', arrow: '↑' }
}

// ── View 1: Health Index Bars ─────────────────────────────────────────────────
function HealthBars({ station }: { station: AQIStation | null }) {
  if (!station) return <EmptyState />

  return (
    <div className="space-y-3">
      {KEYS.map(key => {
        const info  = POLLUTANT_INFO[key]
        const val   = station[key as keyof AQIStation] as number | null
        const guide = GUIDELINES[key]
        if (val === null || val === undefined) return (
          <div key={key} className="flex items-center gap-4">
            <span className="text-xs font-mono text-muted2 w-10 shrink-0">{info.label}</span>
            <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(59,111,232,0.1)' }} />
            <span className="text-xs font-mono text-muted2 w-8 text-right">—</span>
          </div>
        )

        // Scale: bar fills proportionally up to 5× the WHO limit
        // WHO marker always sits at 20% of the bar width (1/5 of max)
        const maxScale = guide.who * 5
        const barPct   = Math.min((val / maxScale) * 100, 100)
        const whoMarkerPct = (guide.who / maxScale) * 100  // = 20%
        const exceeded = val > guide.who
        const { label, color } = getStatusLabel((val / guide.who) * 100)

        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: info.color }}
                />
                <span className="text-xs font-mono text-white">{info.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-600" style={{ color: info.color }}>
                  {formatPollutant(val)} {info.unit}
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-600"
                  style={{ background: `${color}18`, color, border: `1px solid ${color}35` }}
                >
                  {label}
                </span>
              </div>
            </div>

            {/* Bar track */}
            <div className="relative h-2.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(59,111,232,0.1)' }}>

              {/* WHO safe limit marker */}
              <div
                className="absolute top-0 bottom-0 w-px z-10"
                style={{ left: `${whoMarkerPct}%`, background: 'rgba(0,229,160,0.6)' }}
              />

              {/* Filled bar */}
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width:      `${barPct}%`,
                  background: exceeded
                    ? `linear-gradient(90deg, ${info.color}cc, #FF3B4E)`
                    : info.color,
                  boxShadow:  `0 0 8px ${exceeded ? '#FF3B4E' : info.color}50`,
                }}
              />
            </div>

            {/* Scale labels */}
            <div className="flex justify-between mt-0.5">
              <span className="text-[9px] font-mono text-muted2">0</span>
              <span className="text-[9px] font-mono" style={{ color: '#00E5A0', marginLeft: `${whoMarkerPct - 10}%` }}>
                WHO {guide.who}
              </span>
              <span className="text-[9px] font-mono text-muted2">{maxScale} {info.unit}</span>
            </div>
          </div>
        )
      })}

      <p className="text-[10px] font-mono text-muted2 pt-1 border-t border-cobalt-300/10">
        Bar fills to 100% at WHO guideline. Red overflow = exceeds WHO limit.
      </p>
    </div>
  )
}

// ── View 2: Radar Chart ───────────────────────────────────────────────────────
function RadarView({ station }: { station: AQIStation | null }) {
  if (!station) return <EmptyState />

  const radarData = KEYS.map(key => {
    const info = POLLUTANT_INFO[key]
    const raw  = station[key as keyof AQIStation] as number | null
    const pct  = raw !== null && raw !== undefined
      ? Math.min((raw / GUIDELINES[key].who) * 100, 250)
      : 0
    return {
      subject:  info.label,
      value:    raw !== null && raw !== undefined ? Math.round(pct) : 0,
      whoSafe:  100,          // fixed reference line at WHO limit
      hasData:  raw !== null && raw !== undefined,
      fullMark: 250,
      rawVal:   raw,
      unit:     info.unit,
      color:    info.color,
    }
  })

  const hasAnyData = radarData.some(d => d.hasData)
  if (!hasAnyData) return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <span className="text-3xl mb-3">📡</span>
      <p className="text-sm text-muted">No individual pollutant readings</p>
      <p className="text-xs text-muted2 mt-1">This station only reports AQI — detailed breakdown unavailable</p>
    </div>
  )

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid
            stroke="rgba(59,111,232,0.15)"
            strokeDasharray="3 3"
          />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 200]}
            tick={{ fill: 'var(--muted2)', fontSize: 9, fontFamily: 'var(--font-mono)' }}
            tickCount={4}
            stroke="rgba(59,111,232,0.1)"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload
              const { label: statusLabel, color: statusColor } = getStatusLabel(d.value)
              return (
                <div className="px-3 py-2 rounded-xl text-xs"
                  style={{ background: 'rgba(10,17,40,0.97)', border: `1px solid ${statusColor}40`, fontFamily: 'var(--font-mono)' }}>
                  <div className="text-white font-600 mb-1">{d.subject}</div>
                  <div style={{ color: statusColor }}>{d.rawVal?.toFixed(1)} {d.unit}</div>
                  <div className="text-muted2">{d.value}% of WHO limit</div>
                  <div style={{ color: statusColor }}>{statusLabel}</div>
                </div>
              )
            }}
          />
          <Radar
            name="Pollutants"
            dataKey="value"
            stroke="#F5A623"
            fill="#F5A623"
            fillOpacity={0.15}
            strokeWidth={2}
            dot={{ fill: '#F5A623', r: 4, strokeWidth: 0 }}
          />
          {/* WHO safe zone — uses whoSafe: 100 field in data */}
          <Radar
            name="WHO Safe"
            dataKey="whoSafe"
            stroke="rgba(0,229,160,0.5)"
            fill="rgba(0,229,160,0.05)"
            fillOpacity={1}
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={false}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 -mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 rounded" style={{ background: '#F5A623' }} />
          <span className="text-[10px] font-mono text-muted">Current levels</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 rounded border-t border-dashed" style={{ borderColor: '#00E5A0' }} />
          <span className="text-[10px] font-mono text-muted">WHO safe limit (100%)</span>
        </div>
      </div>

      <p className="text-[10px] font-mono text-muted2 text-center mt-2">
        Each axis = % of WHO annual guideline. Wider shape = more polluted.
      </p>
    </div>
  )
}

// ── View 3: WHO vs India Comparison Table ─────────────────────────────────────
function ComparisonTable({ station }: { station: AQIStation | null }) {
  if (!station) return <EmptyState />

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(59,111,232,0.12)' }}>
            {['Pollutant', 'Current', 'WHO Limit', 'vs WHO', 'India NAAQS', 'vs India', 'Status'].map(h => (
              <th key={h}
                className="px-3 py-2.5 text-left font-mono uppercase tracking-wider"
                style={{ color: 'var(--muted2)', fontSize: 9 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {KEYS.map((key, i) => {
            const info    = POLLUTANT_INFO[key]
            const val     = station[key as keyof AQIStation] as number | null
            const guide   = GUIDELINES[key]
            const hasData = val !== null && val !== undefined

            const vsWho   = hasData ? getDeltaLabel(val!, guide.who)   : null
            const vsIndia = hasData ? getDeltaLabel(val!, guide.india)  : null
            const pct     = hasData ? (val! / guide.who) * 100 : 0
            const { label: statusLabel, color: statusColor } = getStatusLabel(pct)

            return (
              <tr
                key={key}
                style={{
                  borderBottom: '1px solid rgba(59,111,232,0.06)',
                  background: i % 2 === 0 ? 'rgba(59,111,232,0.02)' : 'transparent',
                }}
              >
                {/* Pollutant name */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: info.color }} />
                    <span className="font-mono font-600 text-white">{info.label}</span>
                  </div>
                </td>

                {/* Current value */}
                <td className="px-3 py-3">
                  <span className="font-mono font-600" style={{ color: hasData ? info.color : 'var(--muted2)' }}>
                    {hasData ? `${formatPollutant(val)} ${guide.unit}` : '—'}
                  </span>
                </td>

                {/* WHO limit */}
                <td className="px-3 py-3 font-mono text-muted">
                  {guide.who} {guide.unit}
                </td>

                {/* vs WHO */}
                <td className="px-3 py-3">
                  {vsWho ? (
                    <span className="font-mono font-600" style={{ color: vsWho.color }}>
                      {vsWho.arrow} {vsWho.text}
                    </span>
                  ) : <span className="text-muted2">—</span>}
                </td>

                {/* India NAAQS */}
                <td className="px-3 py-3 font-mono text-muted">
                  {guide.india} {guide.unit}
                </td>

                {/* vs India */}
                <td className="px-3 py-3">
                  {vsIndia ? (
                    <span className="font-mono font-600" style={{ color: vsIndia.color }}>
                      {vsIndia.arrow} {vsIndia.text}
                    </span>
                  ) : <span className="text-muted2">—</span>}
                </td>

                {/* Status badge */}
                <td className="px-3 py-3">
                  {hasData ? (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-600 whitespace-nowrap"
                      style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}30` }}
                    >
                      {statusLabel}
                    </span>
                  ) : <span className="text-muted2">—</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <p className="text-[10px] font-mono text-muted2 mt-3 px-3">
        WHO = World Health Organization annual guidelines · India NAAQS = National Ambient Air Quality Standards
      </p>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <span className="text-3xl mb-3">🔍</span>
      <p className="text-sm text-muted">No pollutant data available</p>
      <p className="text-xs text-muted2 mt-1">Search a city to load station data</p>
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="flex items-center gap-4">
          <div className="skeleton h-3 w-16 shrink-0" />
          <div className="skeleton h-2.5 flex-1 rounded-full" />
          <div className="skeleton h-3 w-12 shrink-0" />
        </div>
      ))}
    </div>
  )
}

// ── Main Export ───────────────────────────────────────────────────────────────
interface PollutantStatsProps {
  station:   AQIStation | null
  loading?:  boolean
  isKids?:   boolean
  className?: string
}

export function PollutantStats({ station, loading, isKids, className }: PollutantStatsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('bars')

  // Kids mode — show simplified health bars only, no tab switcher
  if (isKids) {
    return (
      <div
        className={clsx('rounded-3xl p-5', className)}
        style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.8)' }}
      >
        <h3 className="font-display font-700 text-sm mb-4" style={{ color: '#2D1B69', fontFamily: 'var(--font-display)' }}>
          🧪 Are these safe to breathe?
        </h3>
        {loading ? <LoadingSkeleton /> : <HealthBars station={station} />}
      </div>
    )
  }

  return (
    <div className={clsx('glass rounded-3xl overflow-hidden', className)}>

      {/* ── Header + Tab switcher ── */}
      <div
        className="flex items-center justify-between px-5 pt-4 pb-0"
        style={{ borderBottom: '1px solid rgba(59,111,232,0.1)' }}
      >
        <div className="pb-4">
          <div className="text-xs font-mono text-muted uppercase tracking-wider">
            Pollutant Analysis
          </div>
          <div className="text-[10px] font-mono text-muted2 mt-0.5">
            vs WHO & India NAAQS guidelines
          </div>
        </div>

        {/* Tab pills */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl mb-4"
          style={{ background: 'rgba(10,17,40,0.5)', border: '1px solid rgba(59,111,232,0.12)' }}
        >
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200',
                activeTab === tab.id
                  ? 'text-navy-800 font-600'
                  : 'text-muted hover:text-white'
              )}
              style={activeTab === tab.id ? {
                background: 'linear-gradient(135deg, #F5A623, #FFB84D)',
                boxShadow:  '0 2px 10px rgba(245,166,35,0.35)',
              } : {}}
            >
              <span style={{ fontSize: 12 }}>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="p-5">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {activeTab === 'bars'  && <HealthBars      station={station} />}
            {activeTab === 'radar' && <RadarView       station={station} />}
            {activeTab === 'table' && <ComparisonTable station={station} />}
          </>
        )}
      </div>
    </div>
  )
}