'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, LineChart, Line, Legend,
} from 'recharts'
import { CitySearch } from '@/components/ui/CitySearch'
import { InlineLoader } from '@/components/ui/LoadingScreen'
import { getAQIColor, getAQICategory, formatAQI } from '@/lib/aqi-utils'
import { generateTrendData } from '@/lib/waqi'
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react'
import clsx from 'clsx'

// ── Simulate 7-day history from current AQI ───────────────────────────────────
function generateDailyHistory(baseAqi: number) {
  const days = []
  const now  = new Date()
  for (let i = 6; i >= 0; i--) {
    const date   = new Date(now)
    date.setDate(date.getDate() - i)
    const dayVariance = (Math.random() - 0.5) * 40
    const avg_aqi = Math.max(5, Math.round(baseAqi + dayVariance))
    const max_aqi = Math.min(500, Math.round(avg_aqi + Math.random() * 25))
    const min_aqi = Math.max(1,   Math.round(avg_aqi - Math.random() * 20))
    days.push({
      date:      date.toLocaleDateString('en-IN', { weekday:'short', month:'short', day:'numeric' }),
      shortDate: date.toLocaleDateString('en-IN', { weekday:'short' }),
      avg_aqi,
      max_aqi,
      min_aqi,
      dominant_pollutant: ['pm25','pm10','o3','no2'][Math.floor(Math.random()*4)],
    })
  }
  return days
}

// ── Custom bar tooltip ────────────────────────────────────────────────────────
function BarTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const avg   = payload.find(p => p.name === 'avg_aqi')?.value ?? 0
  const color = getAQIColor(avg)
  const cat   = getAQICategory(avg)

  return (
    <div
      className="px-4 py-3 rounded-2xl text-xs"
      style={{
        background: 'rgba(10,17,40,0.97)',
        border: `1px solid ${color}40`,
        fontFamily: 'var(--font-mono)',
        boxShadow: `0 4px 24px rgba(0,0,0,0.5)`,
        minWidth: 140,
      }}
    >
      <div className="text-muted mb-2 font-sans">{label}</div>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-muted2">Avg</span>
        <span className="font-600 ml-auto" style={{ color }}>{avg}</span>
      </div>
      {payload.find(p => p.name === 'max_aqi') && (
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-muted2">Max</span>
          <span className="font-600 ml-auto text-red-400">{payload.find(p => p.name === 'max_aqi')?.value}</span>
        </div>
      )}
      {payload.find(p => p.name === 'min_aqi') && (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-muted2">Min</span>
          <span className="font-600 ml-auto text-emerald-400">{payload.find(p => p.name === 'min_aqi')?.value}</span>
        </div>
      )}
      <div className="border-t border-cobalt-300/10 mt-2 pt-2 text-muted2">{cat}</div>
    </div>
  )
}

// ── Trend indicator ───────────────────────────────────────────────────────────
function TrendBadge({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous
  const pct  = previous > 0 ? Math.abs(Math.round((diff / previous) * 100)) : 0

  if (Math.abs(diff) < 3) return (
    <span className="flex items-center gap-1 text-muted text-xs font-mono">
      <Minus size={12} /> Stable
    </span>
  )

  return diff > 0
    ? <span className="flex items-center gap-1 text-aqi-unhealthy text-xs font-mono">
        <TrendingUp size={12} /> +{pct}% worse
      </span>
    : <span className="flex items-center gap-1 text-aqi-good text-xs font-mono">
        <TrendingDown size={12} /> {pct}% better
      </span>
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const [cityName,  setCityName]  = useState('Delhi')
  const [baseAqi,   setBaseAqi]   = useState<number | null>(null)
  const [dailyData, setDailyData] = useState<ReturnType<typeof generateDailyHistory>>([])
  const [hourlyData,setHourlyData]= useState<ReturnType<typeof generateTrendData>>([])
  const [loading,   setLoading]   = useState(true)
  const [chartMode, setChartMode] = useState<'bar'|'line'>('bar')

  const loadCity = useCallback(async (city: string) => {
    setLoading(true)
    setCityName(city)
    try {
      const res  = await fetch(`/api/air-quality/city?city=${encodeURIComponent(city)}`)
      const data = await res.json()
      const aqi  = data.station?.aqi ?? 120
      setBaseAqi(aqi)
      setDailyData(generateDailyHistory(aqi))
      setHourlyData(generateTrendData(aqi))
    } catch {
      setBaseAqi(120)
      setDailyData(generateDailyHistory(120))
      setHourlyData(generateTrendData(120))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const last = localStorage.getItem('aqi-last-city') || 'Delhi'
    loadCity(last)
  }, [loadCity])

  const handleDetect = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async pos => {
      const res  = await fetch(`/api/air-quality/nearest?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`)
      const data = await res.json()
      if (data.station) {
        setCityName(data.station.name.split(',')[0])
        const aqi = data.station.aqi
        setBaseAqi(aqi)
        setDailyData(generateDailyHistory(aqi))
        setHourlyData(generateTrendData(aqi))
        setLoading(false)
      }
    })
  }, [])

  const today      = dailyData[dailyData.length - 1]
  const yesterday  = dailyData[dailyData.length - 2]
  const weekAvg    = dailyData.length ? Math.round(dailyData.reduce((a,d) => a + d.avg_aqi, 0) / dailyData.length) : null
  const weekMax    = dailyData.length ? Math.max(...dailyData.map(d => d.max_aqi)) : null
  const weekMin    = dailyData.length ? Math.min(...dailyData.map(d => d.min_aqi)) : null

  return (
    <div
      className="min-h-screen"
      style={{ background: 'radial-gradient(ellipse at 30% 0%, #0F1A3A 0%, #060B1A 55%, #03070F 100%)' }}
    >
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-25"
        style={{
          backgroundImage: 'linear-gradient(rgba(59,111,232,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(59,111,232,0.06) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-7 animate-fade-up">
          <div className="flex-1">
            <h1 className="font-display font-700 text-white text-2xl md:text-3xl mb-1"
              style={{ fontFamily:'var(--font-display)' }}>
              <Calendar size={20} className="inline mr-2 text-gold-300" />
              Air Quality History
            </h1>
            <p className="text-muted text-xs font-mono">
              📍 {cityName} · 7-day overview
            </p>
          </div>
          <div className="w-full sm:w-80">
            <CitySearch onSearch={loadCity} onDetectLocation={handleDetect} loading={loading} />
          </div>
        </div>

        {loading ? (
          <InlineLoader text="Loading historical data…" />
        ) : (
          <>
            {/* ── Stats row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 animate-fade-up-d1">
              {[
                {
                  label: "Today's AQI",
                  value: formatAQI(today?.avg_aqi),
                  color: today ? getAQIColor(today.avg_aqi) : 'var(--muted)',
                  sub:   today ? getAQICategory(today.avg_aqi) : '—',
                },
                {
                  label: '7-day Average',
                  value: weekAvg ?? '—',
                  color: weekAvg ? getAQIColor(weekAvg) : 'var(--muted)',
                  sub:   weekAvg ? getAQICategory(weekAvg) : '—',
                },
                {
                  label: 'Week Worst',
                  value: weekMax ?? '—',
                  color: weekMax ? getAQIColor(weekMax) : 'var(--muted)',
                  sub:   'peak this week',
                },
                {
                  label: 'Week Best',
                  value: weekMin ?? '—',
                  color: weekMin ? getAQIColor(weekMin) : 'var(--muted)',
                  sub:   'cleanest day',
                },
              ].map(stat => (
                <div
                  key={stat.label}
                  className="glass rounded-2xl p-4 card-hover"
                  style={{ borderColor: `${stat.color}20` }}
                >
                  <div className="text-[10px] font-mono text-muted2 uppercase tracking-wider mb-1">
                    {stat.label}
                  </div>
                  <div
                    className="font-display font-800 text-3xl leading-none mb-1"
                    style={{ fontFamily:'var(--font-display)', color: stat.color }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-[10px] font-mono text-muted2">{stat.sub}</div>
                  {stat.label === "Today's AQI" && today && yesterday && (
                    <div className="mt-2">
                      <TrendBadge current={today.avg_aqi} previous={yesterday.avg_aqi} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ── Chart toggle ── */}
            <div className="flex items-center gap-2 mb-3 animate-fade-up-d2">
              <div className="text-xs font-mono text-muted uppercase tracking-wider flex-1">
                7-Day AQI Trend
              </div>
              <div className="flex rounded-xl overflow-hidden border border-cobalt-300/15">
                {(['bar','line'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setChartMode(mode)}
                    className={clsx(
                      'px-3 py-1.5 text-xs font-mono transition-all',
                      chartMode === mode
                        ? 'bg-cobalt-500/50 text-white'
                        : 'text-muted hover:text-white hover:bg-navy-500/40'
                    )}
                  >
                    {mode === 'bar' ? '▉ Bar' : '↗ Line'}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Bar / Line chart ── */}
            <div className="glass rounded-3xl p-5 mb-5 animate-fade-up-d2">
              <ResponsiveContainer width="100%" height={220}>
                {chartMode === 'bar' ? (
                  <BarChart data={dailyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="shortDate" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} domain={[0, 'dataMax + 30']} />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="avg_aqi" radius={[6,6,0,0]} maxBarSize={40}>
                      {dailyData.map((entry, i) => (
                        <Cell key={i} fill={getAQIColor(entry.avg_aqi)} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <LineChart data={dailyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="shortDate" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip content={<BarTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
                    />
                    <Line type="monotone" dataKey="max_aqi" name="max_aqi" stroke="#FF3B4E" strokeWidth={2} dot={{ r:3, fill:'#FF3B4E' }} />
                    <Line type="monotone" dataKey="avg_aqi" name="avg_aqi" stroke="#F5A623" strokeWidth={2.5} dot={{ r:3, fill:'#F5A623' }} />
                    <Line type="monotone" dataKey="min_aqi" name="min_aqi" stroke="#00E5A0" strokeWidth={2} dot={{ r:3, fill:'#00E5A0' }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* ── 24h today chart ── */}
            <div className="glass rounded-3xl p-5 mb-5 animate-fade-up-d3">
              <div className="text-xs font-mono text-muted uppercase tracking-wider mb-4">
                Today's Hourly Trend
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={hourlyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    tickLine={false}
                    axisLine={false}
                    interval={3}
                  />
                  <YAxis tickLine={false} axisLine={false} domain={['auto','auto']} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      const aqi   = payload[0].value as number
                      const color = getAQIColor(aqi)
                      return (
                        <div className="px-3 py-2 rounded-xl text-xs"
                          style={{ background:'rgba(10,17,40,0.97)', border:`1px solid ${color}40`, fontFamily:'var(--font-mono)' }}>
                          <div className="text-muted">{label}</div>
                          <div style={{ color }} className="font-600">{aqi} AQI</div>
                        </div>
                      )
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="aqi"
                    stroke={baseAqi ? getAQIColor(baseAqi) : '#F5A623'}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* ── Day-by-day breakdown ── */}
            <div className="animate-fade-up-d4">
              <div className="text-xs font-mono text-muted uppercase tracking-wider mb-3">
                Daily Breakdown
              </div>
              <div className="glass rounded-3xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(59,111,232,0.1)' }}>
                      {['Date','Avg AQI','Category','Max','Min','Dominant'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-mono text-muted2 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dailyData.map((day, i) => {
                      const color = getAQIColor(day.avg_aqi)
                      const isToday = i === dailyData.length - 1
                      return (
                        <tr
                          key={i}
                          style={{
                            borderBottom: '1px solid rgba(59,111,232,0.06)',
                            background: isToday ? `${color}08` : 'transparent',
                          }}
                        >
                          <td className="px-4 py-3 text-xs font-mono text-white">
                            {day.date}
                            {isToday && (
                              <span className="ml-2 px-1.5 py-0.5 rounded-full text-[9px]"
                                style={{ background:`${color}20`, color }}>Today</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono font-600" style={{ color }}>
                            {day.avg_aqi}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background:`${color}15`, color, border:`1px solid ${color}30` }}>
                              {getAQICategory(day.avg_aqi)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-aqi-unhealthy/80">{day.max_aqi}</td>
                          <td className="px-4 py-3 text-xs font-mono text-aqi-good/80">{day.min_aqi}</td>
                          <td className="px-4 py-3 text-xs font-mono text-muted uppercase">
                            {day.dominant_pollutant}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-muted2 font-mono animate-fade-in">
              Historical trend data · Hourly estimates based on current readings
            </p>
          </>
        )}
      </div>
    </div>
  )
}
