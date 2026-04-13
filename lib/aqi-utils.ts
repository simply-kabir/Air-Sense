import type { AQICategory, KidsCategory, HealthRecommendation } from '@/types'

// ─── AQI Category Helpers ─────────────────────────────────────────────────────

export function getAQICategory(aqi: number): AQICategory {
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups'
  if (aqi <= 200) return 'Unhealthy'
  if (aqi <= 300) return 'Very Unhealthy'
  return 'Hazardous'
}

export function getKidsCategory(aqi: number): KidsCategory {
  if (aqi <= 50) return 'Super Fresh 🌟'
  if (aqi <= 100) return 'Okay 🙂'
  if (aqi <= 150) return 'Sneezy 🤧'
  if (aqi <= 200) return 'Yucky 😷'
  if (aqi <= 300) return 'Very Yucky 🚫'
  return 'Danger ⚠️'
}

export function getAQIColor(aqi: number): string {
  if (aqi <= 50) return '#00E5A0'
  if (aqi <= 100) return '#FFD60A'
  if (aqi <= 150) return '#FF8C00'
  if (aqi <= 200) return '#FF3B4E'
  if (aqi <= 300) return '#9B2FFF'
  return '#7B0000'
}

export function getAQIBgClass(aqi: number): string {
  if (aqi <= 50) return 'bg-aqi-good'
  if (aqi <= 100) return 'bg-aqi-moderate'
  if (aqi <= 150) return 'bg-aqi-sensitive'
  if (aqi <= 200) return 'bg-aqi-unhealthy'
  if (aqi <= 300) return 'bg-aqi-very'
  return 'bg-aqi-hazardous'
}

export function getAQITextClass(aqi: number): string {
  if (aqi <= 50) return 'text-aqi-good'
  if (aqi <= 100) return 'text-aqi-moderate'
  if (aqi <= 150) return 'text-aqi-sensitive'
  if (aqi <= 200) return 'text-aqi-unhealthy'
  if (aqi <= 300) return 'text-aqi-very'
  return 'text-aqi-hazardous'
}

export function getKidsEmoji(aqi: number): string {
  if (aqi <= 50) return '🌟'
  if (aqi <= 100) return '🙂'
  if (aqi <= 150) return '🤧'
  if (aqi <= 200) return '😷'
  if (aqi <= 300) return '🚫'
  return '⚠️'
}

export function getKidsBgColor(aqi: number): string {
  if (aqi <= 50) return '#E8FFF5'
  if (aqi <= 100) return '#FFFBE6'
  if (aqi <= 150) return '#FFF3E0'
  if (aqi <= 200) return '#FFE8EA'
  if (aqi <= 300) return '#F3E8FF'
  return '#FFE0E0'
}

export function getAQIRisk(aqi: number): number {
  return Math.min((aqi / 500) * 100, 100)
}

// ─── Pollutant Labels ─────────────────────────────────────────────────────────

export const POLLUTANT_INFO: Record<string, {
  label: string
  unit: string
  kidsLabel: string
  kidsDesc: string
  color: string
  maxSafe: number
}> = {
  pm25: {
    label: 'PM2.5',
    unit: 'μg/m³',
    kidsLabel: 'Tiny Dust ✨',
    kidsDesc: 'Really small bits that can sneak into your lungs',
    color: '#FF6B6B',
    maxSafe: 35,
  },
  pm10: {
    label: 'PM10',
    unit: 'μg/m³',
    kidsLabel: 'Dust Bits 🌫️',
    kidsDesc: 'Bigger dust particles floating in the air',
    color: '#FF8E53',
    maxSafe: 150,
  },
  o3: {
    label: 'O₃ Ozone',
    unit: 'ppb',
    kidsLabel: 'Sky Gas ☁️',
    kidsDesc: 'A gas that can make breathing feel tricky',
    color: '#A78BFA',
    maxSafe: 70,
  },
  no2: {
    label: 'NO₂',
    unit: 'ppb',
    kidsLabel: 'Car Smoke 🚗',
    kidsDesc: 'Comes from car exhausts and factories',
    color: '#60A5FA',
    maxSafe: 100,
  },
  so2: {
    label: 'SO₂',
    unit: 'ppb',
    kidsLabel: 'Stinky Gas 🏭',
    kidsDesc: 'A smelly gas from factories and fires',
    color: '#F59E0B',
    maxSafe: 75,
  },
  co: {
    label: 'CO',
    unit: 'ppm',
    kidsLabel: 'Invisible Gas 👻',
    kidsDesc: 'A sneaky gas you cannot see or smell',
    color: '#10B981',
    maxSafe: 9,
  },
}

// ─── Health Recommendations ───────────────────────────────────────────────────

export function getHealthRecommendations(aqi: number): HealthRecommendation[] {
  if (aqi <= 50) {
    return [
      { group: 'Everyone', icon: '🏃', message: 'Great day for outdoor activities', action: 'Enjoy outdoor exercise freely' },
      { group: 'Children', icon: '👧', message: 'Safe to play outdoors', action: 'No restrictions needed' },
      { group: 'Elderly', icon: '🧓', message: 'Excellent air quality', action: 'Outdoor walks are beneficial' },
    ]
  }
  if (aqi <= 100) {
    return [
      { group: 'General Public', icon: '🚶', message: 'Acceptable air quality', action: 'Unusually sensitive people should limit prolonged outdoor exertion' },
      { group: 'Sensitive Groups', icon: '⚠️', message: 'Consider reducing outdoor activity', action: 'Watch for symptoms like coughing or shortness of breath' },
    ]
  }
  if (aqi <= 150) {
    return [
      { group: 'Sensitive Groups', icon: '😮‍💨', message: 'Limit prolonged outdoor exertion', action: 'Take breaks during outdoor activities' },
      { group: 'Heart/Lung Patients', icon: '💙', message: 'Reduce outdoor activity', action: 'Keep rescue medication handy' },
      { group: 'Children', icon: '👧', message: 'Limit time outdoors', action: 'Reduce intense outdoor play' },
    ]
  }
  if (aqi <= 200) {
    return [
      { group: 'Everyone', icon: '😷', message: 'Avoid prolonged outdoor exertion', action: 'Wear N95 mask if going out' },
      { group: 'Sensitive Groups', icon: '🏠', message: 'Stay indoors when possible', action: 'Use air purifier indoors' },
      { group: 'Athletes', icon: '🏋️', message: 'Move workout indoors', action: 'Reschedule outdoor events' },
    ]
  }
  if (aqi <= 300) {
    return [
      { group: 'Everyone', icon: '🚨', message: 'Avoid all outdoor activity', action: 'Stay indoors with windows closed' },
      { group: 'Sensitive Groups', icon: '🏥', message: 'Seek medical advice if symptomatic', action: 'Run air purifier continuously' },
      { group: 'Children & Elderly', icon: '🛡️', message: 'Do not go outside', action: 'Keep air purifier at highest setting' },
    ]
  }
  return [
    { group: 'Everyone', icon: '⛔', message: 'Emergency health alert', action: 'Remain indoors — seal doors and windows' },
    { group: 'All Groups', icon: '🏥', message: 'Serious health effects likely', action: 'Wear proper respirator if evacuation required' },
  ]
}

// ─── Kids Messages ────────────────────────────────────────────────────────────

export function getAirBearMessage(aqi: number): string {
  if (aqi <= 50) return "Woohoo! The air is super clean today! Go outside and have fun! 🎉"
  if (aqi <= 100) return "The air is okay today. You can go outside, but maybe don't run too fast! 😊"
  if (aqi <= 150) return "The air is a bit sneezy today. Sensitive friends should play inside! 🤧"
  if (aqi <= 200) return "Eww, the air is yucky! Let's stay inside and play games today! 😷"
  if (aqi <= 300) return "The air is very yucky! Stay inside with the windows closed, okay? 🚫"
  return "Oh no! The air is really dangerous today! Do not go outside at all! ⚠️"
}

// ─── Number Formatting ────────────────────────────────────────────────────────

export function formatAQI(aqi: number | null | undefined): string {
  if (aqi === null || aqi === undefined) return '—'
  return Math.round(aqi).toString()
}

export function formatPollutant(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return '—'
  return value.toFixed(decimals)
}
