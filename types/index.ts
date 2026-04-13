// ─── AQI Types ────────────────────────────────────────────────────────────────

export type AQICategory =
  | 'Good'
  | 'Moderate'
  | 'Unhealthy for Sensitive Groups'
  | 'Unhealthy'
  | 'Very Unhealthy'
  | 'Hazardous'

export type KidsCategory =
  | 'Super Fresh 🌟'
  | 'Okay 🙂'
  | 'Sneezy 🤧'
  | 'Yucky 😷'
  | 'Very Yucky 🚫'
  | 'Danger ⚠️'

export interface Pollutants {
  pm25: number | null
  pm10: number | null
  o3: number | null
  no2: number | null
  so2: number | null
  co: number | null
}

export interface AQIStation {
  station_id: string
  name: string
  lat: number
  lon: number
  aqi: number
  category: AQICategory
  dominant_pollutant: string
  pm25: number | null
  pm10: number | null
  o3: number | null
  no2: number | null
  so2: number | null
  co: number | null
  raw_pollutants: Record<string, unknown>
  fetched_at: string
  expires_at: string
}

export interface AQITrendPoint {
  hour: string
  aqi: number
  timestamp: string
}

export interface HealthRecommendation {
  group: string
  icon: string
  message: string
  action: string
}

// ─── WAQI API Types ───────────────────────────────────────────────────────────

export interface WAQIStation {
  uid: number
  aqi: string
  lat: number
  lon: number
  station: {
    name: string
    time: string
    tz: string
    url: string
    country: string
  }
}

export interface WAQIDetailResponse {
  status: string
  data: {
    aqi: number
    idx: number
    city: {
      name: string
      geo: [number, number]
      url: string
    }
    dominentpol: string
    iaqi: {
      pm25?: { v: number }
      pm10?: { v: number }
      o3?: { v: number }
      no2?: { v: number }
      so2?: { v: number }
      co?: { v: number }
      [key: string]: { v: number } | undefined
    }
    forecast?: {
      daily?: {
        pm25?: Array<{ avg: number; day: string; max: number; min: number }>
        pm10?: Array<{ avg: number; day: string; max: number; min: number }>
        o3?: Array<{ avg: number; day: string; max: number; min: number }>
      }
    }
    time: {
      s: string
      tz: string
      v: number
    }
  }
}

// ─── Map Types ────────────────────────────────────────────────────────────────

export interface MapBounds {
  minLat: number
  minLon: number
  maxLat: number
  maxLon: number
}

export interface MapViewport {
  lat: number
  lon: number
  zoom: number
}

// ─── App State ────────────────────────────────────────────────────────────────

export type AppMode = 'normal' | 'kids'

export interface AppSettings {
  mode: AppMode
  lastCity: string
  lastLat: number
  lastLon: number
}

// ─── History Types ────────────────────────────────────────────────────────────

export interface HistoryEntry {
  date: string
  avg_aqi: number
  max_aqi: number
  min_aqi: number
  dominant_pollutant: string
  station_count: number
}
