'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { CitySearch } from '@/components/ui/CitySearch'
import { getAQIColor, getAQICategory, formatAQI, getHealthRecommendations } from '@/lib/aqi-utils'
import type { AQIStation, MapViewport } from '@/types'
import { X, Wind, MapPin, RefreshCw } from 'lucide-react'
import clsx from 'clsx'

// Dynamically import Leaflet map (SSR disabled)
const AQIMap = dynamic(() => import('@/components/map/AQIMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-3xl flex items-center justify-center"
      style={{ background: 'rgba(10,17,40,0.8)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-cobalt-300/30 border-t-cobalt-300 animate-spin" />
        <span className="text-xs font-mono text-muted">Initialising map…</span>
      </div>
    </div>
  ),
})

// ── Selected station side panel ───────────────────────────────────────────────
function StationPanel({ station, onClose }: { station: AQIStation; onClose: () => void }) {
  const color = getAQIColor(station.aqi)
  const cat   = getAQICategory(station.aqi)
  const recs  = getHealthRecommendations(station.aqi).slice(0, 2)

  return (
    <div
      className="absolute top-4 right-4 z-30 w-64 rounded-3xl p-5 animate-scale-in"
      style={{
        background: 'rgba(10,17,40,0.95)',
        border: `1px solid ${color}30`,
        backdropFilter: 'blur(20px)',
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 24px ${color}15`,
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-muted hover:text-white transition-colors"
        style={{ background: 'rgba(59,111,232,0.15)' }}
      >
        <X size={12} />
      </button>

      {/* Station name */}
      <div className="pr-6 mb-3">
        <div className="text-xs font-mono text-muted2 mb-0.5">Selected Station</div>
        <div className="font-display font-700 text-white text-sm leading-snug"
          style={{ fontFamily:'var(--font-display)' }}>
          {station.name.split(',')[0]}
        </div>
      </div>

      {/* AQI */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl"
        style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
        <span
          className="font-display font-800 text-4xl leading-none"
          style={{ fontFamily:'var(--font-display)', color, textShadow: `0 0 20px ${color}50` }}
        >
          {formatAQI(station.aqi)}
        </span>
        <div>
          <div className="text-xs font-mono text-muted2 mb-0.5">AQI</div>
          <div className="text-xs font-display font-600" style={{ color, fontFamily:'var(--font-display)' }}>
            {cat}
          </div>
        </div>
      </div>

      {/* Pollutants mini grid */}
      <div className="grid grid-cols-3 gap-1.5 mb-4">
        {[
          ['PM2.5', station.pm25],
          ['PM10',  station.pm10],
          ['O₃',    station.o3],
          ['NO₂',   station.no2],
          ['SO₂',   station.so2],
          ['CO',    station.co],
        ].map(([label, val]) => (
          <div key={label as string}
            className="rounded-xl p-2 text-center"
            style={{ background: 'rgba(59,111,232,0.08)' }}>
            <div className="text-[9px] font-mono text-muted2">{label as string}</div>
            <div className="text-xs font-mono font-500 text-white mt-0.5">
              {val !== null && val !== undefined ? (val as number).toFixed(1) : '—'}
            </div>
          </div>
        ))}
      </div>

      {/* Rec */}
      {recs[0] && (
        <div className="rounded-xl p-2.5" style={{ background: 'rgba(10,17,40,0.5)', border:'1px solid rgba(59,111,232,0.1)' }}>
          <div className="text-[9px] font-mono text-muted2 uppercase tracking-wider mb-1">Recommendation</div>
          <p className="text-xs text-muted leading-snug">{recs[0].action}</p>
        </div>
      )}
    </div>
  )
}

// ── Main Map page ─────────────────────────────────────────────────────────────
export default function MapPage() {
  const [stations,    setStations]    = useState<AQIStation[]>([])
  const [loading,     setLoading]     = useState(false)
  const [selected,    setSelected]    = useState<AQIStation | null>(null)
  const [userCoords,  setUserCoords]  = useState<{ lat: number; lon: number } | null>(null)
  const [viewport,    setViewport]    = useState<MapViewport>({ lat: 28.6139, lon: 77.2090, zoom: 10 })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Restore last location from localStorage
  useEffect(() => {
    const lat  = parseFloat(localStorage.getItem('aqi-last-lat')  || '28.6139')
    const lon  = parseFloat(localStorage.getItem('aqi-last-lon')  || '77.2090')
    setViewport({ lat, lon, zoom: 10 })
  }, [])

  // Fetch stations when bounds change
  const handleBoundsChange = useCallback((minLat: number, minLon: number, maxLat: number, maxLon: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const p = new URLSearchParams({
          minLat: minLat.toString(), minLon: minLon.toString(),
          maxLat: maxLat.toString(), maxLon: maxLon.toString(),
        })
        const res  = await fetch(`/api/air-quality/bounds?${p}`)
        const data = await res.json()
        setStations(data.stations || [])
      } catch (e) {
        console.error('Map fetch error:', e)
      } finally {
        setLoading(false)
      }
    }, 600)
  }, [])

  // City search → fly to
  const handleCitySearch = useCallback(async (city: string) => {
    try {
      const res  = await fetch(`/api/air-quality/city?city=${encodeURIComponent(city)}`)
      const data = await res.json()
      if (data.station) {
        setViewport({ lat: data.station.lat, lon: data.station.lon, zoom: 11 })
        setSelected(data.station)
        localStorage.setItem('aqi-last-lat',  data.station.lat.toString())
        localStorage.setItem('aqi-last-lon',  data.station.lon.toString())
        localStorage.setItem('aqi-last-city', city)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  // Detect location
  const handleDetect = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lon } = pos.coords
      setUserCoords({ lat, lon })
      setViewport({ lat, lon, zoom: 11 })
    })
  }, [])

  // Stats bar
  const avgAqi     = stations.length ? Math.round(stations.reduce((a, s) => a + s.aqi, 0) / stations.length) : null
  const maxStation = stations.length ? stations.reduce((a, s) => s.aqi > a.aqi ? s : a) : null
  const minStation = stations.length ? stations.reduce((a, s) => s.aqi < a.aqi ? s : a) : null

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #0F1A3A 0%, #060B1A 60%, #03070F 100%)' }}
    >
      {/* Header */}
      <div className="px-4 pt-5 pb-3 md:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3 animate-fade-up">
          <div className="flex-1">
            <h1 className="font-display font-700 text-white text-2xl"
              style={{ fontFamily:'var(--font-display)' }}>
              AQI Map
            </h1>
            <p className="text-muted text-xs font-mono">
              {stations.length > 0 ? `${stations.length} stations in view` : 'Pan to load stations'}
            </p>
          </div>
          <div className="w-full sm:w-80">
            <CitySearch
              onSearch={handleCitySearch}
              onDetectLocation={handleDetect}
              loading={loading}
              placeholder="Fly to city…"
            />
          </div>
        </div>

        {/* Stats bar */}
        {stations.length > 0 && (
          <div className="flex gap-3 animate-fade-up-d1">
            {[
              { label: 'Avg AQI', value: avgAqi, color: avgAqi ? getAQIColor(avgAqi) : 'var(--muted)' },
              { label: 'Worst',   value: maxStation?.aqi, color: maxStation ? getAQIColor(maxStation.aqi) : 'var(--muted)', name: maxStation?.name.split(',')[0] },
              { label: 'Best',    value: minStation?.aqi, color: minStation ? getAQIColor(minStation.aqi) : 'var(--muted)', name: minStation?.name.split(',')[0] },
            ].map(stat => (
              <div key={stat.label}
                className="glass rounded-xl px-3 py-2 flex items-center gap-2"
                style={{ borderColor: `${stat.color}20` }}>
                <div>
                  <div className="text-[9px] font-mono text-muted2 uppercase">{stat.label}</div>
                  <div className="font-mono font-600 text-sm" style={{ color: stat.color }}>
                    {stat.value ?? '—'}
                  </div>
                  {stat.name && (
                    <div className="text-[9px] text-muted2 truncate max-w-[80px]">{stat.name}</div>
                  )}
                </div>
              </div>
            ))}
            <button
              onClick={() => handleBoundsChange(
                viewport.lat - 1, viewport.lon - 1,
                viewport.lat + 1, viewport.lon + 1
              )}
              className="glass rounded-xl px-3 py-2 text-muted hover:text-white transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={13} />
              <span className="text-xs font-mono">Refresh</span>
            </button>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 px-4 pb-5 md:px-8 min-h-[500px] animate-fade-up-d2">
        <div className="relative w-full h-full" style={{ minHeight: 500 }}>
          <AQIMap
            stations={stations}
            viewport={viewport}
            userLocation={userCoords}
            onBoundsChange={handleBoundsChange}
            onStationClick={setSelected}
            loading={loading}
            className="w-full h-full"
            style={{ minHeight: 500 }}
          />
          {selected && (
            <StationPanel station={selected} onClose={() => setSelected(null)} />
          )}
        </div>
      </div>
    </div>
  )
}
