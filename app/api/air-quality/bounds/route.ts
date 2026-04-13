import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAQICategory } from '@/lib/aqi-utils'
import type { AQIStation } from '@/types'

const WAQI_TOKEN = process.env.WAQI_TOKEN!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use service role key server-side for writes
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const minLat = parseFloat(searchParams.get('minLat') || '0')
  const minLon = parseFloat(searchParams.get('minLon') || '0')
  const maxLat = parseFloat(searchParams.get('maxLat') || '0')
  const maxLon = parseFloat(searchParams.get('maxLon') || '0')

  if (!minLat || !maxLat) {
    return NextResponse.json({ error: 'Invalid bounds' }, { status: 400 })
  }

  // 1. Check Supabase cache first
  const { data: cached } = await supabaseAdmin
    .from('air_quality_stations')
    .select('*')
    .gte('lat', minLat)
    .lte('lat', maxLat)
    .gte('lon', minLon)
    .lte('lon', maxLon)
    .gt('expires_at', new Date().toISOString())

  if (cached && cached.length > 0) {
    return NextResponse.json({ stations: cached, source: 'cache' }, {
      headers: { 'Cache-Control': 'public, max-age=3600' }
    })
  }

  // 2. Fetch from WAQI API
  try {
    const waqiUrl = `https://api.waqi.info/map/bounds/?token=${WAQI_TOKEN}&latlng=${minLat},${minLon},${maxLat},${maxLon}`
    const res = await fetch(waqiUrl, { next: { revalidate: 3600 } })
    const json = await res.json()

    if (json.status !== 'ok') {
      return NextResponse.json({ error: 'WAQI API error', stations: [] }, { status: 500 })
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000) // +1 hour

    const stations: Omit<AQIStation, 'station_id'>[] = json.data
      .filter((s: { aqi: string | number }) => s.aqi !== '-' && !isNaN(Number(s.aqi)))
      .map((s: {
        uid: number
        aqi: string | number
        lat: number
        lon: number
        station: { name: string }
      }) => {
        const aqi = parseInt(String(s.aqi))
        return {
          name: s.station.name,
          lat: s.lat,
          lon: s.lon,
          aqi,
          category: getAQICategory(aqi),
          dominant_pollutant: 'pm25',
          pm25: null,
          pm10: null,
          o3: null,
          no2: null,
          so2: null,
          co: null,
          raw_pollutants: {},
          fetched_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        }
      })

    // 3. Cache to Supabase (non-blocking)
    if (stations.length > 0) {
      supabaseAdmin
        .from('air_quality_stations')
        .upsert(
          stations.map(s => ({ ...s, station_id: `${s.lat.toFixed(4)}_${s.lon.toFixed(4)}` })),
          { onConflict: 'station_id' }
        )
        .then(({ error }) => { if (error) console.error('Cache write error:', error) })
    }

    return NextResponse.json({ stations, source: 'api' }, {
      headers: { 'Cache-Control': 'public, max-age=3600' }
    })
  } catch (err) {
    console.error('WAQI fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch air quality data', stations: [] }, { status: 500 })
  }
}
