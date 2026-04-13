'use client'

import { getAQIColor, getAQICategory, formatAQI } from '@/lib/aqi-utils'
import type { AQIStation } from '@/types'

// ── Static helper: build Leaflet DivIcon HTML string ─────────────────────────
// Called server-side-safe (no window access)
export function buildMarkerHTML(aqi: number): string {
  const color = getAQIColor(aqi)
  const size  = aqi > 200 ? 38 : aqi > 100 ? 32 : 28
  const glow  = aqi > 150 ? `box-shadow:0 0 14px ${color}70,0 2px 6px rgba(0,0,0,0.5);` : 'box-shadow:0 2px 6px rgba(0,0,0,0.4);'

  return `<div style="
    width:${size}px;
    height:${size}px;
    background:${color};
    border-radius:50%;
    display:flex;
    align-items:center;
    justify-content:center;
    font-family:'JetBrains Mono',monospace;
    font-weight:600;
    font-size:${size < 32 ? 10 : 11}px;
    color:#060B1A;
    border:2px solid rgba(255,255,255,0.25);
    cursor:pointer;
    transition:transform 0.15s ease;
    ${glow}
  ">${formatAQI(aqi)}</div>`
}

// ── Popup HTML builder ────────────────────────────────────────────────────────
export function buildPopupHTML(station: AQIStation): string {
  const color = getAQIColor(station.aqi)
  const cat   = getAQICategory(station.aqi)

  const pollutantRow = (label: string, val: number | null, unit: string) =>
    val !== null
      ? `<div style="display:flex;justify-content:space-between;padding:2px 0;">
           <span style="color:#556088">${label}</span>
           <span style="color:#F0F4FF;font-family:'JetBrains Mono',monospace">${val.toFixed(1)} ${unit}</span>
         </div>`
      : ''

  return `
    <div style="min-width:190px;font-family:'DM Sans',sans-serif;font-size:12px;">
      <div style="font-size:10px;color:#8899CC;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px;">
        📡 Air Quality Station
      </div>
      <div style="font-size:14px;font-weight:600;color:#F0F4FF;margin-bottom:10px;line-height:1.3;">
        ${station.name.split(',')[0]}
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;padding:8px;border-radius:10px;background:${color}12;border:1px solid ${color}25;">
        <span style="font-size:30px;font-weight:800;color:${color};font-family:'JetBrains Mono',monospace;line-height:1;text-shadow:0 0 16px ${color}60;">
          ${formatAQI(station.aqi)}
        </span>
        <div>
          <div style="font-size:9px;color:#8899CC;text-transform:uppercase;margin-bottom:2px;">AQI</div>
          <div style="font-size:11px;color:${color};font-weight:600;">${cat}</div>
        </div>
      </div>
      <div style="border-top:1px solid rgba(59,111,232,0.1);padding-top:8px;margin-bottom:8px;">
        ${pollutantRow('PM2.5', station.pm25, 'μg/m³')}
        ${pollutantRow('PM10',  station.pm10, 'μg/m³')}
        ${pollutantRow('O₃',   station.o3,   'ppb')}
        ${pollutantRow('NO₂',  station.no2,  'ppb')}
      </div>
      <div style="font-size:10px;color:#556088;">
        Dominant: <span style="color:${color};font-family:'JetBrains Mono',monospace;">${(station.dominant_pollutant || 'PM2.5').toUpperCase()}</span>
      </div>
    </div>
  `
}

// ── User location marker HTML ─────────────────────────────────────────────────
export function buildUserPinHTML(): string {
  return `
    <div style="position:relative;width:60px;height:60px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;width:48px;height:48px;border-radius:50%;border:1.5px solid rgba(0,212,255,0.45);animation:pulse-ring 2s ease-out infinite;"></div>
      <div style="position:absolute;width:64px;height:64px;border-radius:50%;border:1px solid rgba(0,212,255,0.2);animation:pulse-ring 2s 0.6s ease-out infinite;"></div>
      <div style="width:14px;height:14px;background:#00D4FF;border-radius:50%;border:2.5px solid white;box-shadow:0 0 14px rgba(0,212,255,0.9);"></div>
    </div>
  `
}

// ── React display component (used in station detail panel) ───────────────────
interface MarkerBadgeProps {
  aqi: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function MarkerBadge({ aqi, size = 'md', showLabel = false }: MarkerBadgeProps) {
  const color    = getAQIColor(aqi)
  const category = getAQICategory(aqi)
  const dims     = { sm: 28, md: 36, lg: 48 }[size]
  const fontSize = { sm: 10, md: 12, lg: 15 }[size]

  return (
    <div className="flex items-center gap-2">
      <div
        style={{
          width:        dims,
          height:       dims,
          background:   color,
          borderRadius: '50%',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          fontSize,
          fontWeight:   700,
          color:        '#060B1A',
          fontFamily:   'var(--font-mono)',
          boxShadow:    aqi > 150 ? `0 0 12px ${color}60` : '0 2px 6px rgba(0,0,0,0.3)',
          border:       '2px solid rgba(255,255,255,0.2)',
          flexShrink:   0,
        }}
      >
        {formatAQI(aqi)}
      </div>
      {showLabel && (
        <span className="text-xs font-mono" style={{ color }}>
          {category}
        </span>
      )}
    </div>
  )
}
