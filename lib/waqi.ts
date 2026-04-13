import type { AQIStation, WAQIDetailResponse, MapBounds } from '@/types'
import { getAQICategory } from './aqi-utils'

const WAQI_BASE = 'https://api.waqi.info'

// ─── Fetch stations in bounds (via our API route, never expose token to client) ─

export async function fetchStationsInBounds(bounds: MapBounds): Promise<AQIStation[]> {
  const params = new URLSearchParams({
    minLat: bounds.minLat.toString(),
    minLon: bounds.minLon.toString(),
    maxLat: bounds.maxLat.toString(),
    maxLon: bounds.maxLon.toString(),
  })

  const res = await fetch(`/api/air-quality/bounds?${params}`)
  if (!res.ok) throw new Error('Failed to fetch stations')

  const data = await res.json()
  return data.stations || []
}

// ─── Fetch single station detail (via our API route) ─────────────────────────

export async function fetchStationDetail(stationId: string): Promise<AQIStation | null> {
  const res = await fetch(`/api/air-quality/station?id=${encodeURIComponent(stationId)}`)
  if (!res.ok) return null

  const data = await res.json()
  return data.station || null
}

// ─── Fetch by city name ───────────────────────────────────────────────────────

export async function fetchByCity(city: string): Promise<AQIStation | null> {
  const res = await fetch(`/api/air-quality/city?city=${encodeURIComponent(city)}`)
  if (!res.ok) return null

  const data = await res.json()
  return data.station || null
}

// ─── Fetch by lat/lon ─────────────────────────────────────────────────────────

export async function fetchByCoords(lat: number, lon: number): Promise<AQIStation | null> {
  const res = await fetch(`/api/air-quality/nearest?lat=${lat}&lon=${lon}`)
  if (!res.ok) return null

  const data = await res.json()
  return data.station || null
}

// ─── Parse WAQI Detail Response → AQIStation ─────────────────────────────────

export function parseWAQIDetail(data: WAQIDetailResponse['data']): Omit<AQIStation, 'station_id' | 'fetched_at' | 'expires_at'> {
  const aqi = typeof data.aqi === 'number' ? data.aqi : parseInt(String(data.aqi))

  return {
    name: data.city.name,
    lat: data.city.geo[0],
    lon: data.city.geo[1],
    aqi,
    category: getAQICategory(aqi),
    dominant_pollutant: data.dominentpol || 'pm25',
    pm25: data.iaqi.pm25?.v ?? null,
    pm10: data.iaqi.pm10?.v ?? null,
    o3: data.iaqi.o3?.v ?? null,
    no2: data.iaqi.no2?.v ?? null,
    so2: data.iaqi.so2?.v ?? null,
    co: data.iaqi.co?.v ?? null,
    raw_pollutants: data.iaqi as Record<string, unknown>,
  }
}

// ─── Generate mock trend data (WAQI free tier doesn't provide hourly history) ─

export function generateTrendData(currentAqi: number) {
  const now = new Date()
  const points = []

  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000)
    const variance = (Math.random() - 0.5) * 30
    const timeVariance = Math.sin((time.getHours() / 24) * Math.PI * 2) * 20
    const aqi = Math.max(1, Math.round(currentAqi + variance + timeVariance))

    points.push({
      hour: time.getHours().toString().padStart(2, '0') + ':00',
      aqi,
      timestamp: time.toISOString(),
    })
  }

  return points
}
