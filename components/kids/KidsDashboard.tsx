'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCurrentStation } from '@/hooks'
import { AirBear } from './AirBear'
import { KidsPollutantCard } from './KidsPollutantCard'
import { getAQIColor, getKidsCategory, getAirBearMessage } from '@/lib/aqi-utils'
import { POLLUTANT_INFO } from '@/lib/aqi-utils'
import { CitySearch } from '@/components/ui/CitySearch'
import { AlertTriangle, RefreshCw } from 'lucide-react'

const POLLUTANT_KEYS = Object.keys(POLLUTANT_INFO) as Array<keyof typeof POLLUTANT_INFO>

const FUN_FACTS = [
  { emoji: '🌳', text: 'One tree can clean the air for 4 people every day!' },
  { emoji: '🚗', text: 'Cars make the air dirtier when they burn petrol — that\'s PM2.5!' },
  { emoji: '😷', text: 'Masks help filter out big dust particles when the air is yucky.' },
  { emoji: '🏠', text: 'Staying inside with windows closed helps on bad air days.' },
  { emoji: '🌱', text: 'Indoor plants like spider plants can help clean the air inside!' },
  { emoji: '🚌', text: 'Taking the bus instead of a car helps keep the air cleaner.' },
  { emoji: '🌧️', text: 'Rain washes pollution out of the air — that\'s why it smells fresh after!' },
  { emoji: '💨', text: 'Wind blows dirty air away — that\'s why breezy days feel fresher!' },
]

const AQI_SCALE = [
  { max: 50,  label: 'Good',       color: '#00E5A0', emoji: '😊' },
  { max: 100, label: 'Okay',       color: '#FFD60A', emoji: '🙂' },
  { max: 150, label: 'A bit bad',  color: '#FF9F43', emoji: '😐' },
  { max: 200, label: 'Bad',        color: '#FF6B6B', emoji: '😷' },
  { max: 300, label: 'Very bad',   color: '#C44DFF', emoji: '🤢' },
  { max: 500, label: 'Dangerous',  color: '#8B1A1A', emoji: '⚠️' },
]

export function KidsDashboard() {
  const { station, loading, error, loadByCity, loadByCoords } = useCurrentStation('Delhi')
  const [factIndex, setFactIndex] = useState(0)

  const aqi    = station?.aqi ?? 80
  const color  = getAQIColor(aqi)
  const cat    = getKidsCategory(aqi)
  const msg    = getAirBearMessage(aqi)

  useEffect(() => {
    setFactIndex(Math.floor(Math.random() * FUN_FACTS.length))
  }, [station?.name])

  const handleDetect = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => loadByCoords(pos.coords.latitude, pos.coords.longitude),
      () => {}
    )
  }, [loadByCoords])

  return (
    <div
      className="min-h-screen"
      style={{
        color: '#2D1B69', // Force global text color to dark purple for this page
        background: aqi <= 50
          ? 'linear-gradient(160deg, #E8FFF5 0%, #F0F8FF 50%, #FFF8F0 100%)'
          : aqi <= 100
          ? 'linear-gradient(160deg, #FFFDE8 0%, #FFF8F0 50%, #F0FFF8 100%)'
          : aqi <= 150
          ? 'linear-gradient(160deg, #FFF3E0 0%, #FFF8F0 60%, #FFEEEE 100%)'
          : 'linear-gradient(160deg, #FFE8E8 0%, #FFF0F0 60%, #FFE0F0 100%)',
      }}
    >
      {/* Floating blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[
          { x: '10%',  y: '15%', size: 200, color: `${color}18`, delay: '0s'   },
          { x: '75%',  y: '20%', size: 150, color: '#4ECDC418',  delay: '1s'   },
          { x: '60%',  y: '70%', size: 180, color: '#FFE66D18',  delay: '2s'   },
          { x: '5%',   y: '65%', size: 120, color: '#C77DFF15',  delay: '0.5s' },
        ].map((b, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              left: b.x, top: b.y,
              width: b.size, height: b.size,
              background: b.color,
              animationDelay: b.delay,
              filter: 'blur(30px)',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">

        {/* Search bar - ADDED isKids={true} HERE */}
        <div className="mb-6 animate-fade-up">
          <CitySearch
            onSearch={loadByCity}
            onDetectLocation={handleDetect}
            loading={loading}
            isKids={true}
            placeholder="Search your city... 🏙️"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-100 border border-red-200 animate-scale-in">
            <AlertTriangle size={16} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-600 flex-1">{error}</p>
            <button onClick={() => loadByCity('Delhi')} className="text-xs text-red-500 flex items-center gap-1 hover:underline">
              <RefreshCw size={12} /> Try again
            </button>
          </div>
        )}

        {/* ── Hero section ── */}
        <div
          className="rounded-3xl p-6 mb-5 text-center animate-fade-up-d1 relative overflow-hidden"
          style={{
            background: `${color}15`,
            border: `2px solid ${color}35`,
          }}
        >
          {station && (
            <div className="text-sm font-display mb-3" style={{ color: 'rgba(45,27,105,0.7)', fontWeight: 700 }}>
              📍 {station.name.split(',')[0]}
            </div>
          )}

          <div className="flex justify-center mb-4">
            {loading ? (
              <div className="w-40 h-44 rounded-3xl skeleton" />
            ) : (
              <AirBear aqi={aqi} size={150} animated />
            )}
          </div>

          <div className="flex items-center justify-center gap-3 mb-2">
            <div>
              <div className="text-xs font-mono mb-0.5" style={{ color: 'rgba(45,27,105,0.5)' }}>
                Air Quality Score
              </div>
              <div
                className="font-display leading-none"
                style={{
                  fontWeight: 800,
                  fontSize: 'clamp(3rem, 10vw, 5rem)',
                  color,
                  textShadow: `0 0 30px ${color}50`,
                }}
              >
                {loading ? '—' : aqi}
              </div>
            </div>
          </div>

          <div
            className="inline-block px-5 py-2 rounded-full text-sm font-display mb-4"
            style={{
              background: `${color}20`,
              border: `2px solid ${color}40`,
              color,
              fontWeight: 700,
            }}
          >
            {cat}
          </div>

          <div
            className="rounded-2xl p-4 text-sm leading-relaxed"
            style={{
              background: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.8)',
              color: '#2D1B69',
              fontWeight: 500,
            }}
          >
            {loading ? (
              <div className="skeleton h-4 w-3/4 mx-auto" />
            ) : (
              <span>🐻 {msg}</span>
            )}
          </div>
        </div>

        {/* ── AQI Scale Legend ── */}
        <div className="mb-5 rounded-2xl p-3 flex flex-wrap justify-center gap-x-4 gap-y-1 animate-fade-up-d2" style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.7)' }}>
          {AQI_SCALE.map(scale => (
            <div key={scale.max} className="flex items-center gap-1 text-[10px]" style={{ color: aqi <= scale.max ? scale.color : 'rgba(45,27,105,0.4)', fontWeight: aqi <= scale.max ? 700 : 400 }}>
              <span>{scale.emoji}</span>
              <span>{scale.label}</span>
            </div>
          ))}
        </div>

        {/* ── Pollutants ── */}
        <div className="animate-fade-up-d3">
          <h2 className="font-display font-700 text-center mb-3 text-base" style={{ color: '#2D1B69' }}>
            🧪 What's floating in the air?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {loading
              ? Array(6).fill(0).map((_, i) => (
                  <div key={i} className="rounded-2xl skeleton h-24" />
                ))
              : POLLUTANT_KEYS.map(key => (
                  <KidsPollutantCard key={key} pollutant={key} station={station} />
                ))
            }
          </div>
        </div>

        {/* ── Fun facts strip ── */}
        <div className="mt-6 animate-fade-up-d4">
          <div className="rounded-3xl p-4" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.8)' }}>
            <h3 className="font-display font-700 mb-2 text-sm" style={{ color: '#2D1B69' }}>
              🌍 Did you know?
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(45, 27, 105, 0.7)' }}>
              <strong>{FUN_FACTS[factIndex].emoji} {FUN_FACTS[factIndex].text}</strong>
            </p>
          </div>
        </div>

        <div className="mt-4 text-center animate-fade-up-d5">
          <p className="text-xs font-mono" style={{ color: 'rgba(45,27,105,0.4)' }}>
            Data from WAQI · Updates every hour 🕐
          </p>
        </div>
      </div>
    </div>
  )
}