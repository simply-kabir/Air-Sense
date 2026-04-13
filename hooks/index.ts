'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { AQIStation, AppMode, AQITrendPoint } from '@/types'
import { fetchByCity, fetchByCoords, generateTrendData } from '@/lib/waqi'

// ─── useAppMode ───────────────────────────────────────────────────────────────

export function useAppMode() {
  const [mode, setMode] = useState<AppMode>('normal')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('aqi-mode') as AppMode | null
    if (saved === 'kids' || saved === 'normal') setMode(saved)
  }, [])

  const toggleMode = useCallback(() => {
    setMode(prev => {
      const next = prev === 'normal' ? 'kids' : 'normal'
      localStorage.setItem('aqi-mode', next)
      return next
    })
  }, [])

  return { mode, toggleMode, mounted }
}

// ─── useGeolocation ───────────────────────────────────────────────────────────

export function useGeolocation() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      return
    }

    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
      { timeout: 10000, maximumAge: 300000 }
    )
  }, [])

  return { coords, error, loading, requestLocation }
}

// ─── useCurrentStation ────────────────────────────────────────────────────────

export function useCurrentStation(defaultCity = 'Delhi') {
  const [station, setStation] = useState<AQIStation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trendData, setTrendData] = useState<AQITrendPoint[]>([])
  const abortRef = useRef<AbortController | null>(null)

  const loadByCity = useCallback(async (city: string) => {
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const data = await fetchByCity(city)
      if (data) {
        setStation(data)
        setTrendData(generateTrendData(data.aqi))
        // Persist last search
        localStorage.setItem('aqi-last-city', city)
        localStorage.setItem('aqi-last-lat', data.lat.toString())
        localStorage.setItem('aqi-last-lon', data.lon.toString())
      } else {
        setError(`No data found for "${city}"`)
      }
    } catch {
      setError('Failed to load air quality data')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadByCoords = useCallback(async (lat: number, lon: number) => {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchByCoords(lat, lon)
      if (data) {
        setStation(data)
        setTrendData(generateTrendData(data.aqi))
      } else {
        setError('No station found near your location')
      }
    } catch {
      setError('Failed to load air quality data')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load on mount — restore last city or use default
  useEffect(() => {
    const lastCity = localStorage.getItem('aqi-last-city')
    loadByCity(lastCity || defaultCity)
  }, [defaultCity, loadByCity])

  return { station, loading, error, trendData, loadByCity, loadByCoords }
}

// ─── useMapStations ───────────────────────────────────────────────────────────

export function useMapStations() {
  const [stations, setStations] = useState<AQIStation[]>([])
  const [loading, setLoading] = useState(false)

  const fetchForBounds = useCallback(async (
    minLat: number, minLon: number, maxLat: number, maxLon: number
  ) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        minLat: minLat.toString(),
        minLon: minLon.toString(),
        maxLat: maxLat.toString(),
        maxLon: maxLon.toString(),
      })
      const res = await fetch(`/api/air-quality/bounds?${params}`)
      const data = await res.json()
      setStations(data.stations || [])
    } catch (err) {
      console.error('Map stations error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  return { stations, loading, fetchForBounds }
}
