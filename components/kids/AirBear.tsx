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
  const color  = getAQIColor(aqi)
  const cat    = getKidsCategory(aqi)

  const mood = useMemo(() => {
    if (aqi <= 50)  return 'happy'
    if (aqi <= 100) return 'okay'
    if (aqi <= 150) return 'sneeze'
    if (aqi <= 200) return 'mask'
    return 'scared'
  }, [aqi])

  // Palette shifts with AQI
  const bearColor   = aqi <= 50  ? '#C8A882' : aqi <= 100 ? '#C4A07A' : aqi <= 200 ? '#B8956A' : '#A07850'
  const bearDark    = aqi <= 50  ? '#9A7A55' : aqi <= 100 ? '#906C45' : aqi <= 200 ? '#7A5830' : '#6A4820'
  const bellyColor  = aqi <= 50  ? '#E8D4B8' : '#D4B890'
  const cheekColor  = aqi <= 100 ? '#FFB0B0' : aqi <= 200 ? '#FF9070' : '#FF7050'

  return (
    <div
      className="relative inline-flex flex-col items-center"
      style={{ width: size, userSelect: 'none' }}
    >
      <svg
        viewBox="0 0 160 180"
        width={size}
        height={size * 1.1}
        xmlns="http://www.w3.org/2000/svg"
        style={animated ? { animation: 'float 4s ease-in-out infinite' } : undefined}
      >
        {/* ── Aura glow behind bear ── */}
        <ellipse cx="80" cy="150" rx="45" ry="12" fill={color} opacity="0.15" />
        <circle cx="80" cy="88" r="58" fill={color} opacity="0.07" />

        {/* ── Ears ── */}
        <circle cx="38" cy="52" r="18" fill={bearColor} />
        <circle cx="38" cy="52" r="11" fill={bearDark} />
        <circle cx="38" cy="52" r="6"  fill={bearColor} opacity="0.5" />

        <circle cx="122" cy="52" r="18" fill={bearColor} />
        <circle cx="122" cy="52" r="11" fill={bearDark} />
        <circle cx="122" cy="52" r="6"  fill={bearColor} opacity="0.5" />

        {/* ── Head ── */}
        <circle cx="80" cy="90" r="52" fill={bearColor} />

        {/* ── Belly / snout area ── */}
        <ellipse cx="80" cy="100" rx="28" ry="22" fill={bellyColor} opacity="0.7" />

        {/* ── Cheeks ── */}
        <circle cx="52" cy="100" r="10" fill={cheekColor} opacity="0.5" />
        <circle cx="108" cy="100" r="10" fill={cheekColor} opacity="0.5" />

        {/* ── Eyes ── */}
        {mood === 'scared' ? (
          <>
            {/* Scared eyes — spirals / crosses */}
            <text x="59" y="84" fontSize="14" textAnchor="middle" fill={bearDark} fontWeight="bold">×</text>
            <text x="101" y="84" fontSize="14" textAnchor="middle" fill={bearDark} fontWeight="bold">×</text>
          </>
        ) : mood === 'mask' ? (
          <>
            <ellipse cx="60" cy="82" rx="8" ry="7" fill={bearDark} />
            <ellipse cx="100" cy="82" rx="8" ry="7" fill={bearDark} />
            <ellipse cx="60" cy="80" rx="4" ry="3" fill="white" opacity="0.5" />
            <ellipse cx="100" cy="80" rx="4" ry="3" fill="white" opacity="0.5" />
          </>
        ) : mood === 'sneeze' ? (
          <>
            {/* Squinting */}
            <path d="M52 80 Q60 75 68 80" stroke={bearDark} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M92 80 Q100 75 108 80" stroke={bearDark} strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* Normal / happy eyes */}
            <ellipse cx="60" cy="82" rx="8" ry={mood === 'happy' ? 7 : 8} fill={bearDark} />
            <ellipse cx="100" cy="82" rx="8" ry={mood === 'happy' ? 7 : 8} fill={bearDark} />
            <ellipse cx="57" cy="79" rx="3" ry="2.5" fill="white" opacity="0.6" />
            <ellipse cx="97" cy="79" rx="3" ry="2.5" fill="white" opacity="0.6" />
            {/* Happy sparkle */}
            {mood === 'happy' && (
              <>
                <text x="38" y="72" fontSize="10" textAnchor="middle" opacity="0.8">✨</text>
                <text x="122" y="72" fontSize="10" textAnchor="middle" opacity="0.8">✨</text>
              </>
            )}
          </>
        )}

        {/* ── Nose ── */}
        <ellipse cx="80" cy="94" rx="7" ry="5" fill={bearDark} />
        <ellipse cx="78" cy="92" rx="2.5" ry="1.5" fill="white" opacity="0.4" />

        {/* ── Mouth — varies by mood ── */}
        {mood === 'happy' && (
          <path d="M68 104 Q80 116 92 104" stroke={bearDark} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}
        {mood === 'okay' && (
          <path d="M70 106 Q80 111 90 106" stroke={bearDark} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}
        {mood === 'sneeze' && (
          <>
            <path d="M72 106 Q80 102 88 106" stroke={bearDark} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Snot */}
            <ellipse cx="80" cy="108" rx="4" ry="6" fill="#B8E4FF" opacity="0.7"
              style={animated ? { animation: 'float 1.5s ease-in-out infinite' } : undefined} />
          </>
        )}
        {(mood === 'mask' || mood === 'scared') && (
          <path d="M68 106 Q80 102 92 106" stroke={bearDark} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}

        {/* ── Mask (for yucky / very yucky / danger) ── */}
        {(mood === 'mask' || mood === 'scared') && (
          <g>
            <rect x="54" y="96" width="52" height="26" rx="8"
              fill="white" opacity="0.92"
              stroke={color} strokeWidth="1.5" />
            {/* Mask straps */}
            <path d="M54 100 Q42 100 40 96" stroke="white" strokeWidth="2" fill="none" opacity="0.8" />
            <path d="M54 116 Q42 116 40 120" stroke="white" strokeWidth="2" fill="none" opacity="0.8" />
            <path d="M106 100 Q118 100 120 96" stroke="white" strokeWidth="2" fill="none" opacity="0.8" />
            <path d="M106 116 Q118 116 120 120" stroke="white" strokeWidth="2" fill="none" opacity="0.8" />
            {/* Mask lines */}
            <path d="M60 104 Q80 100 100 104" stroke={color} strokeWidth="1" opacity="0.3" fill="none" />
            <path d="M58 110 Q80 107 102 110" stroke={color} strokeWidth="1" opacity="0.3" fill="none" />
          </g>
        )}

        {/* ── AQI badge on bear's chest ── */}
        <g transform="translate(65, 130)">
          <rect width="30" height="18" rx="9" fill={color} opacity="0.9" />
          <text
            x="15" y="13"
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            fill="#060B1A"
            fontFamily="'JetBrains Mono', monospace"
          >
            {aqi}
          </text>
        </g>

        {/* ── Scared sweat drops ── */}
        {mood === 'scared' && (
          <>
            <ellipse cx="30" cy="75" rx="4" ry="7" fill="#00D4FF" opacity="0.6"
              style={animated ? { animation: 'float 2s 0.3s ease-in-out infinite' } : undefined} />
            <ellipse cx="132" cy="80" rx="3" ry="5" fill="#00D4FF" opacity="0.5"
              style={animated ? { animation: 'float 2.3s ease-in-out infinite' } : undefined} />
          </>
        )}
      </svg>

      {/* Category label */}
      <div
        className="mt-1 px-3 py-1 rounded-full text-xs font-display font-700 text-center"
        style={{
          background: `${color}20`,
          border: `1px solid ${color}40`,
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
