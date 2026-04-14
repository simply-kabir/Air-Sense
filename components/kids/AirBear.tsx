'use client'

import { useMemo } from 'react'
import { getAQIColor, getKidsCategory } from '@/lib/aqi-utils'

interface AirBearProps {
  aqi: number
  size?: number
  animated?: boolean
  className?: string
}

export function AirBear({ aqi, size = 160, animated = true }: AirBearProps) {
  const color = getAQIColor(aqi)
  const cat   = getKidsCategory(aqi)

  const mood = useMemo(() => {
    if (aqi <= 50)  return 'happy'
    if (aqi <= 100) return 'okay'
    if (aqi <= 150) return 'sneeze'
    if (aqi <= 200) return 'mask'
    return 'scared'
  }, [aqi])

  // Fur palette shifts slightly with AQI
  const bearColor  = aqi <= 50 ? '#D4AD7E' : aqi <= 100 ? '#C9A070' : aqi <= 200 ? '#B89060' : '#A07850'
  const bearDark   = aqi <= 50 ? '#A07850' : aqi <= 100 ? '#8F6840' : aqi <= 200 ? '#7A5830' : '#6A4820'
  const bellyColor = aqi <= 50 ? '#F0DCC4' : '#E0C8A8'
  const cheekColor = aqi <= 100 ? '#FFB8B8' : aqi <= 200 ? '#FF9070' : '#FF7060'

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size, userSelect: 'none' }}>
      <svg
        viewBox="0 0 200 240"
        width={size}
        height={size * 1.2}
        xmlns="http://www.w3.org/2000/svg"
        style={animated ? { animation: 'float 4s ease-in-out infinite' } : undefined}
      >
        <defs>
          {/* Soft glow behind the bear based on AQI color */}
          <filter id="bear-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Background Aura ── */}
        <circle cx="100" cy="120" r="80" fill={color} opacity="0.12" filter="url(#bear-glow)" />

        {/* ── Body ── */}
        <ellipse cx="100" cy="185" rx="55" ry="45" fill={bearColor} />
        {/* Belly patch */}
        <ellipse cx="100" cy="190" rx="38" ry="32" fill={bellyColor} opacity="0.8" />

        {/* ── Little Paws ── */}
        <ellipse cx="55" cy="215" rx="18" ry="12" fill={bearColor} />
        <ellipse cx="145" cy="215" rx="18" ry="12" fill={bearColor} />
        {/* Paw pads */}
        <circle cx="48" cy="218" r="4" fill={bearDark} opacity="0.4" />
        <circle cx="56" cy="220" r="4" fill={bearDark} opacity="0.4" />
        <circle cx="138" cy="218" r="4" fill={bearDark} opacity="0.4" />
        <circle cx="146" cy="220" r="4" fill={bearDark} opacity="0.4" />

        {/* ── Ears ── */}
        <circle cx="48" cy="55" r="22" fill={bearColor} />
        <circle cx="48" cy="55" r="14" fill={bearDark} />
        <circle cx="152" cy="55" r="22" fill={bearColor} />
        <circle cx="152" cy="55" r="14" fill={bearDark} />

        {/* ── Head ── */}
        <circle cx="100" cy="95" r="60" fill={bearColor} />

        {/* ── Cheeks ── */}
        <circle cx="55" cy="110" r="14" fill={cheekColor} opacity="0.5" />
        <circle cx="145" cy="110" r="14" fill={cheekColor} opacity="0.5" />

        {/* ── Snout ── */}
        <ellipse cx="100" cy="110" rx="25" ry="20" fill={bellyColor} opacity="0.9" />

        {/* ── Face Elements (Conditional by Mood) ── */}
        {mood === 'scared' ? (
          <>
            <text x="78" y="92" fontSize="16" textAnchor="middle" fill={bearDark} fontWeight="bold">×</text>
            <text x="122" y="92" fontSize="16" textAnchor="middle" fill={bearDark} fontWeight="bold">×</text>
          </>
        ) : mood === 'mask' ? (
          <>
            <ellipse cx="78" cy="88" rx="10" ry="9" fill={bearDark} />
            <ellipse cx="122" cy="88" rx="10" ry="9" fill={bearDark} />
            <ellipse cx="76" cy="85" rx="4" ry="3.5" fill="white" opacity="0.6" />
            <ellipse cx="120" cy="85" rx="4" ry="3.5" fill="white" opacity="0.6" />
          </>
        ) : mood === 'sneeze' ? (
          <>
            <path d="M68 88 Q78 82 88 88" stroke={bearDark} strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M112 88 Q122 82 132 88" stroke={bearDark} strokeWidth="3.5" fill="none" strokeLinecap="round" />
            {/* Snot drip */}
            <ellipse cx="100" cy="118" rx="5" ry="8" fill="#B8E4FF" opacity="0.8" style={animated ? { animation: 'float 1.5s ease-in-out infinite' } : undefined} />
          </>
        ) : (
          <>
            {/* Happy / Okay big shiny eyes */}
            <ellipse cx="78" cy="88" rx="11" ry="13" fill={bearDark} />
            <ellipse cx="122" cy="88" rx="11" ry="13" fill={bearDark} />
            {/* Anime eye highlights */}
            <circle cx="83" cy="83" r="5" fill="white" opacity="0.8" />
            <circle cx="127" cy="83" r="5" fill="white" opacity="0.8" />
            <circle cx="75" cy="90" r="2.5" fill="white" opacity="0.4" />
            <circle cx="119" cy="90" r="2.5" fill="white" opacity="0.4" />
            {mood === 'happy' && (
              <>
                <text x="50" y="78" fontSize="12" textAnchor="middle" opacity="0.9">✨</text>
                <text x="150" y="78" fontSize="12" textAnchor="middle" opacity="0.9">✨</text>
              </>
            )}
          </>
        )}

        {/* ── Nose ── */}
        <ellipse cx="100" cy="103" rx="8" ry="6" fill={bearDark} />
        <ellipse cx="97" cy="101" rx="3" ry="2" fill="white" opacity="0.5" />

        {/* ── Mouth ── */}
        {mood === 'happy' && (
          <path d="M88 112 Q100 128 112 112" stroke={bearDark} strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
        {mood === 'okay' && (
          <path d="M90 114 Q100 120 110 114" stroke={bearDark} strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
        {mood === 'sneeze' && (
          <path d="M90 114 Q100 108 110 114" stroke={bearDark} strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
        {(mood === 'mask' || mood === 'scared') && (
          <path d="M88 114 Q100 108 112 114" stroke={bearDark} strokeWidth="3" fill="none" strokeLinecap="round" />
        )}

        {/* ── Mask (Very Unhealthy / Hazardous) ── */}
        {(mood === 'mask' || mood === 'scared') && (
          <g>
            <rect x="60" y="104" width="80" height="35" rx="10" fill="white" opacity="0.95" stroke={color} strokeWidth="2" />
            <path d="M60 110 Q45 110 42 105" stroke="white" strokeWidth="3" fill="none" opacity="0.9" />
            <path d="M60 130 Q45 130 42 135" stroke="white" strokeWidth="3" fill="none" opacity="0.9" />
            <path d="M140 110 Q155 110 158 105" stroke="white" strokeWidth="3" fill="none" opacity="0.9" />
            <path d="M140 130 Q155 130 158 135" stroke="white" strokeWidth="3" fill="none" opacity="0.9" />
            <path d="M70 115 Q100 110 130 115" stroke={color} strokeWidth="1.5" opacity="0.4" fill="none" />
            <path d="M68 125 Q100 120 132 125" stroke={color} strokeWidth="1.5" opacity="0.4" fill="none" />
          </g>
        )}

        {/* ── Scared sweat drops ── */}
        {mood === 'scared' && (
          <>
            <ellipse cx="35" cy="85" rx="5" ry="9" fill="#00D4FF" opacity="0.7" style={animated ? { animation: 'float 2s 0.3s ease-in-out infinite' } : undefined} />
            <ellipse cx="168" cy="90" rx="4" ry="7" fill="#00D4FF" opacity="0.6" style={animated ? { animation: 'float 2.3s ease-in-out infinite' } : undefined} />
          </>
        )}

        {/* ── AQI Badge on Belly ── */}
        <g transform="translate(75, 155)">
          <rect width="50" height="26" rx="13" fill={color} stroke="white" strokeWidth="2.5" />
          <text x="25" y="18" textAnchor="middle" fontSize="13" fontWeight="800" fill="white" fontFamily="'JetBrains Mono', monospace">
            {aqi}
          </text>
        </g>

      </svg>

      {/* Category Label */}
      <div
        className="mt-1 px-4 py-1 rounded-full text-xs font-display font-700 text-center"
        style={{
          background: `${color}25`,
          border: `1.5px solid ${color}50`,
          color,
          fontFamily: 'var(--font-display)',
          fontSize: size < 120 ? 10 : 12,
        }}
      >
        {cat}
      </div>
    </div>
  )
}