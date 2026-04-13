import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseWAQIDetail } from '@/lib/waqi'
import type { WAQIDetailResponse } from '@/types'

const WAQI_TOKEN = process.env.WAQI_TOKEN!
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lon = parseFloat(searchParams.get('lon') || '0')

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Lat/lon required' }, { status: 400 })
  }

  // Fetch from WAQI geo endpoint
  try {
    const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${WAQI_TOKEN}`
    const res = await fetch(url)
    const json: WAQIDetailResponse = await res.json()

    if (json.status !== 'ok' || !json.data) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 })
    }

    const parsed = parseWAQIDetail(json.data)
    const now = new Date()
    const stationId = `${parsed.lat.toFixed(4)}_${parsed.lon.toFixed(4)}`

    const station = {
      station_id: stationId,
      ...parsed,
      fetched_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
    }

    // Cache non-blocking
    supabaseAdmin
      .from('air_quality_stations')
      .upsert(station, { onConflict: 'station_id' })
      .then(({ error }) => { if (error) console.error('Cache error:', error) })

    return NextResponse.json({ station, source: 'api' })
  } catch (err) {
    console.error('Geo fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
