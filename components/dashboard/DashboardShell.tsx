'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useCurrentStation, useMapStations } from '@/hooks'
import { useMode } from '@/components/ui/ModeProvider'
import { CitySearch } from '@/components/ui/CitySearch'
import { AQICard } from './AQICard'
import { PollutantGrid } from './PollutantGrid'
import { HealthRecommendations } from './HealthRecommendations'
import { AQITrendChart } from '@/components/charts/AQITrendChart'
import { AirBear } from '@/components/kids/AirBear'
import { PollutantStats } from './PollutantStats'
import { getAQIColor, getAirBearMessage } from '@/lib/aqi-utils'
import { AlertTriangle, RefreshCw, MapPin, Loader2 } from 'lucide-react'

// SSR-disabled Globe
const AQIGlobe = dynamic(() => import('@/components/globe/AQIGlobe'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-cobalt-300/30 border-t-cobalt-300 animate-spin" />
        <span className="text-xs font-mono text-muted">Loading globe…</span>
      </div>
    </div>
  ),
})

// ─── Helper: compute city average AQI from nearby stations ───────────────────
// Filters to stations within ~30km radius of the user's exact coords,
// excludes outliers (>300 AQI difference from median), returns rounded avg.
function computeCityAvg(
  stations: { aqi: number; lat: number; lon: number }[],
  userLat: number,
  userLon: number,
  radiusDeg = 0.3           // ~33km
): { avg: number; count: number } | null {
  if (!stations.length) return null

  // Filter by radius
  const nearby = stations.filter(s => {
    const dlat = s.lat - userLat
    const dlon = s.lon - userLon
    return Math.sqrt(dlat * dlat + dlon * dlon) <= radiusDeg
  })

  if (nearby.length < 2) return null   // need at least 2 to call it a "city avg"

  // Remove obvious outliers: stations > 200 AQI away from the median
  const sorted = [...nearby].sort((a, b) => a.aqi - b.aqi)
  const median = sorted[Math.floor(sorted.length / 2)].aqi
  const cleaned = nearby.filter(s => Math.abs(s.aqi - median) < 200)

  if (!cleaned.length) return null

  const avg = Math.round(cleaned.reduce((sum, s) => sum + s.aqi, 0) / cleaned.length)
  return { avg, count: cleaned.length }
}

// ─── Main shell ───────────────────────────────────────────────────────────────
export function DashboardShell() {
  const { isKids } = useMode()

  const {
    station, loading, error,
    trendData, loadByCity, loadByCoords,
  } = useCurrentStation('Delhi')

  const { stations: mapStations, fetchForBounds } = useMapStations()

  // Track exact user coords from geolocation (not from station lookup)
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null)
  // Track whether the CURRENT station was loaded via auto-detect or manual search
  const [isAutoDetect, setIsAutoDetect] = useState(false)
  const [locLoading, setLocLoading] = useState(false)

  // Restore saved coords on mount (but treat restored as NOT auto-detect —
  // user didn't press "Locate me" this session)
  useEffect(() => {
    const lat = parseFloat(localStorage.getItem('aqi-last-lat') || '')
    const lon = parseFloat(localStorage.getItem('aqi-last-lon') || '')
    if (!isNaN(lat) && !isNaN(lon)) setUserCoords({ lat, lon })
    // isAutoDetect stays false for restored sessions
  }, [])

  // When station loads, fetch nearby stations for globe + city avg
  useEffect(() => {
    if (!station) return
    const { lat, lon } = station
    fetchForBounds(lat - 8, lon - 8, lat + 8, lon + 8)
  }, [station, fetchForBounds])

  // ── Manual city search ────────────────────────────────────────────────────
  const handleSearch = useCallback((city: string) => {
    setIsAutoDetect(false)      // ← manual search = single AQI only
    loadByCity(city)
  }, [loadByCity])

  // ── Auto-detect location ──────────────────────────────────────────────────
  const handleDetect = useCallback(() => {
    if (!navigator.geolocation) return
    setLocLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lon } = pos.coords
        setUserCoords({ lat, lon })
        setIsAutoDetect(true)   // ← auto-detect = may show dual AQI
        loadByCoords(lat, lon)
        localStorage.setItem('aqi-last-lat', lat.toString())
        localStorage.setItem('aqi-last-lon', lon.toString())
        setLocLoading(false)
      },
      () => setLocLoading(false),
      { timeout: 10000 }
    )
  }, [loadByCoords])

  // ── Compute city average from mapStations ─────────────────────────────────
  const cityAQIData = useMemo(() => {
    // Only relevant when user auto-detected AND we have their exact coords
    if (!isAutoDetect || !userCoords || mapStations.length < 2) return null
    return computeCityAvg(mapStations, userCoords.lat, userCoords.lon)
  }, [isAutoDetect, userCoords, mapStations])

  const aqi = station?.aqi ?? 100
  const aqiColor = getAQIColor(aqi)
  const globeLat = userCoords?.lat ?? station?.lat ?? 28.6139
  const globeLon = userCoords?.lon ?? station?.lon ?? 77.2090

  // ── Kids / normal page background ────────────────────────────────────────
  const pageStyle = isKids ? {
    background: aqi <= 50
      ? 'linear-gradient(160deg,#E8FFF5 0%,#F0F8FF 50%,#FFF8F0 100%)'
      : aqi <= 100
        ? 'linear-gradient(160deg,#FFFDE8 0%,#FFF8F0 50%,#F0FFF8 100%)'
        : aqi <= 150
          ? 'linear-gradient(160deg,#FFF3E0 0%,#FFF8F0 60%,#FFEEEE 100%)'
          : 'linear-gradient(160deg,#FFE8E8 0%,#FFF0F0 60%,#FFE0F0 100%)',
  } : {
    background: 'radial-gradient(ellipse at 70% 10%,#0F1A3A 0%,#060B1A 50%,#03070F 100%)',
  }

  return (
    <div className="min-h-screen" style={pageStyle}>

      {/* Grid overlay — normal mode */}
      {!isKids && (
        <div className="fixed inset-0 pointer-events-none z-0 opacity-30"
          style={{
            backgroundImage: 'linear-gradient(rgba(59,111,232,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(59,111,232,0.06) 1px,transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      )}

      {/* Floating blobs — kids mode */}
      {isKids && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          {[
            { x: '8%', y: '12%', size: 200, color: `${aqiColor}18`, delay: '0s' },
            { x: '72%', y: '18%', size: 160, color: '#4ECDC418', delay: '1s' },
            { x: '55%', y: '68%', size: 180, color: '#FFE66D18', delay: '2s' },
            { x: '3%', y: '62%', size: 130, color: '#C77DFF15', delay: '0.5s' },
          ].map((b, i) => (
            <div key={i} className="absolute rounded-full"
              style={{ left: b.x, top: b.y, width: b.size, height: b.size, background: b.color, animation: `float 6s ${b.delay} ease-in-out infinite`, filter: 'blur(32px)' }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-5 md:px-8 md:py-7">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 animate-fade-up">
          <div className="flex-1">
            <h1
              className="font-display font-700 text-2xl md:text-3xl mb-1 leading-tight"
              style={{ fontFamily: 'var(--font-display)', color: isKids ? '#2D1B69' : 'white' }}
            >
              {isKids ? '🌍 How\'s the Air Today?' : 'Air Quality Dashboard'}
            </h1>
            {station && (
              <div className="flex items-center gap-1.5">
                <MapPin size={12} style={{ color: isKids ? '#7A5590' : 'var(--muted)' }} />
                <span className="text-xs font-mono" style={{ color: isKids ? '#7A5590' : 'var(--muted)' }}>
                  {station.name}
                  {isAutoDetect && userCoords && (
                    <span style={{ color: 'var(--cyan-400)' }}> · 📍 Your location</span>
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Locate button */}
            <button
              onClick={handleDetect}
              disabled={locLoading}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-mono transition-all shrink-0"
              style={isKids ? {
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(78,205,196,0.4)',
                color: '#2D1B69',
              } : {
                background: 'rgba(10,17,40,0.6)',
                border: isAutoDetect
                  ? '1px solid rgba(0,212,255,0.4)'
                  : '1px solid rgba(59,111,232,0.2)',
                color: isAutoDetect ? 'var(--cyan-400)' : 'var(--muted)',
              }}
            >
              {locLoading
                ? <Loader2 size={13} className="animate-spin" />
                : <MapPin size={13} />
              }
              {locLoading ? 'Locating…' : isAutoDetect ? 'Located ✓' : 'Locate me'}
            </button>

            <div className="flex-1 sm:w-72">
              <CitySearch onSearch={handleSearch} loading={loading} placeholder="Search city…" />
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-2xl bg-aqi-unhealthy/10 border border-aqi-unhealthy/25 animate-scale-in">
            <AlertTriangle size={15} className="text-aqi-unhealthy mt-0.5 shrink-0" />
            <p className="text-sm text-aqi-unhealthy/90 flex-1">{error}</p>
            <button
              onClick={() => { setIsAutoDetect(false); loadByCity('Delhi') }}
              className="text-xs font-mono text-muted hover:text-white flex items-center gap-1 shrink-0"
            >
              <RefreshCw size={11} /> Retry
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════
            TOP ROW: AQI card (left) · Globe (right)
            ════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

          {/* LEFT — AQI card (or Kids hero) */}
          <div className="flex flex-col gap-4 animate-fade-up-d1">
            {isKids ? (
              <div
                className="rounded-3xl p-6 flex flex-col items-center text-center"
                style={{ background: `${aqiColor}15`, border: `2px solid ${aqiColor}35` }}
              >
                {loading
                  ? <div className="w-36 h-40 skeleton rounded-3xl" />
                  : <AirBear aqi={aqi} size={140} animated />
                }
                <div className="mt-4 text-sm font-body leading-relaxed px-2"
                  style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 16, padding: '12px 16px', color: '#2D1B69' }}>
                  🐻 {loading ? '…' : getAirBearMessage(aqi)}
                </div>
              </div>
            ) : (
              <AQICard
                station={station}
                loading={loading}
                isAutoDetect={isAutoDetect}
                cityAvgAqi={cityAQIData?.avg ?? null}
                nearbyCount={cityAQIData?.count ?? 0}
              />
            )}
            <HealthRecommendations aqi={aqi} loading={loading} />
          </div>

          {/* RIGHT — Globe wrapper: matches left column height */}
          <div
            className="relative rounded-3xl overflow-hidden animate-fade-up-d2"
            style={{
              background: isKids
                ? 'radial-gradient(ellipse at center,#E8F4FF 0%,#D0E8FF 100%)'
                : 'radial-gradient(ellipse at center,#0A1128 0%,#03070F 100%)',
              border: isKids
                ? '2px solid rgba(78,205,196,0.3)'
                : '1px solid rgba(59,111,232,0.15)',
              /* Explicit height so Three.js gets real pixels */
              minHeight: 500,
            }}
          >
            {/* Top labels */}
            <div className="absolute top-3 left-4 z-10 text-xs font-mono uppercase tracking-wider"
              style={{ color: isKids ? '#7A5590' : 'var(--muted2)' }}>
              {isKids ? '🌍 Your World' : 'Live Globe'}
            </div>
            {mapStations.length > 0 && (
              <div className="absolute top-3 right-4 z-10 px-2.5 py-1 rounded-full text-[10px] font-mono"
                style={{ background: 'rgba(6,11,26,0.7)', border: '1px solid rgba(59,111,232,0.2)', color: 'var(--muted)', backdropFilter: 'blur(8px)' }}>
                {mapStations.length} stations nearby
              </div>
            )}

            {/* Globe fills the entire container */}
            <AQIGlobe
              userLat={globeLat}
              userLon={globeLon}
              stations={mapStations}
              isKids={isKids}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
              }}
            />
          </div>
        </div>

        {/* ════════════════════════════════════════════
            MIDDLE: 24h trend chart
            ════════════════════════════════════════════ */}
        <div className="mb-5 animate-fade-up-d3">
          <AQITrendChart data={trendData} loading={loading} currentAqi={aqi} />
        </div>

        {/* ════════════════════════════════════════════
            BOTTOM: Pollutant grid
            ════════════════════════════════════════════ */}
        <div className="animate-fade-up-d4">
          <div className="mb-3">
            <span
              className="text-xs font-mono uppercase tracking-wider"
              style={{ color: isKids ? '#7A5590' : 'var(--muted)' }}
            >
              {isKids ? '🧪 What\'s floating in the air?' : 'Pollutant Breakdown'}
            </span>
          </div>
          <PollutantGrid station={station} loading={loading} />
        </div>

        {/* ════════════════════════════════════════════
            STATS: Pollutant analysis panel
            ════════════════════════════════════════════ */}
        <div className="mt-5 animate-fade-up-d5">
          <PollutantStats
            station={station}
            loading={loading}
            isKids={isKids}
          />
        </div>

        {/* Kids fun facts */}
        {isKids && (
          <div
            className="mt-5 rounded-3xl p-5 animate-fade-up-d5"
            style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.8)' }}
          >
            <h3 className="font-display font-700 text-sm mb-3" style={{ color: '#2D1B69', fontFamily: 'var(--font-display)' }}>
              🌍 Did You Know?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs leading-relaxed" style={{ color: '#4A3570' }}>
              <p>🌳 One tree cleans the air for 4 people every day!</p>
              <p>🚗 Cars make the air dirtier when they burn petrol — that's PM2.5!</p>
              <p>😷 Masks help filter out big dust particles on yucky air days</p>
              <p>🏠 Staying inside with windows closed helps when air is bad</p>
            </div>
          </div>
        )}

        <div className="mt-6 text-center animate-fade-in">
          <p className="text-xs font-mono" style={{ color: isKids ? 'rgba(45,27,105,0.35)' : 'var(--muted2)' }}>
            Data sourced from WAQI · Station-level readings · Updates every hour
            {cityAQIData && isAutoDetect && (
              <span style={{ color: 'var(--muted2)' }}>
                {' '}· City avg from {cityAQIData.count} stations
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}