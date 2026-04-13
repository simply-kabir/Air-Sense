import { createClient } from '@supabase/supabase-js'
import type { AQIStation } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Database Types ───────────────────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      air_quality_stations: {
        Row: AQIStation
        Insert: Omit<AQIStation, 'station_id'> & { station_id?: string }
        Update: Partial<AQIStation>
      }
    }
  }
}

// ─── Query Helpers ────────────────────────────────────────────────────────────

export async function getStationsInBounds(
  minLat: number,
  minLon: number,
  maxLat: number,
  maxLon: number
): Promise<AQIStation[]> {
  const { data, error } = await supabase
    .from('air_quality_stations')
    .select('*')
    .gte('lat', minLat)
    .lte('lat', maxLat)
    .gte('lon', minLon)
    .lte('lon', maxLon)
    .gt('expires_at', new Date().toISOString())
    .order('aqi', { ascending: false })

  if (error) {
    console.error('Supabase query error:', error)
    return []
  }

  return data || []
}

export async function getStationById(stationId: string): Promise<AQIStation | null> {
  const { data, error } = await supabase
    .from('air_quality_stations')
    .select('*')
    .eq('station_id', stationId)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error) return null
  return data
}

export async function upsertStations(stations: Omit<AQIStation, 'station_id'>[]): Promise<void> {
  const { error } = await supabase
    .from('air_quality_stations')
    .upsert(stations, { onConflict: 'station_id' })

  if (error) {
    console.error('Supabase upsert error:', error)
  }
}
