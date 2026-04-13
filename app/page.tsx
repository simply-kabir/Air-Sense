'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  MapPin, Search, Wind, Loader2, AlertTriangle,
  ChevronRight, Globe2, BarChart3, Heart, Star,
  Zap, Shield, Clock, Users,
} from 'lucide-react'
import clsx from 'clsx'

// ── Helpers ───────────────────────────────────────────────────────────────────
function getAQIInfo(aqi: number) {
  if (aqi <= 50)  return { emoji: '😊', color: '#00E5A0', label: 'Good' }
  if (aqi <= 100) return { emoji: '🙂', color: '#FFD60A', label: 'Moderate' }
  if (aqi <= 150) return { emoji: '😐', color: '#FF8C00', label: 'Sensitive' }
  if (aqi <= 200) return { emoji: '😷', color: '#FF3B4E', label: 'Unhealthy' }
  if (aqi <= 300) return { emoji: '🤢', color: '#9B2FFF', label: 'Very Unhealthy' }
  return             { emoji: '☠️', color: '#7B0000', label: 'Hazardous' }
}

// ── Particle Canvas ───────────────────────────────────────────────────────────
function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let animId: number
    const pts: { x:number;y:number;vx:number;vy:number;size:number;opacity:number;color:string }[] = []
    const colors = ['#3B6FE8','#F5A623','#00D4FF','#2553B8','#FFB84D']

    const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 70; i++) pts.push({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random()-.5)*.3, vy: (Math.random()-.5)*.3,
      size: Math.random()*2+.5, opacity: Math.random()*.45+.08,
      color: colors[Math.floor(Math.random()*colors.length)],
    })

    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height)
      for (let i = 0; i < pts.length; i++) {
        for (let j = i+1; j < pts.length; j++) {
          const dx = pts[i].x-pts[j].x, dy = pts[i].y-pts[j].y
          const d = Math.sqrt(dx*dx+dy*dy)
          if (d < 110) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(59,111,232,${.06*(1-d/110)})`
            ctx.lineWidth = .5
            ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y); ctx.stroke()
          }
        }
      }
      pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2)
        ctx.fillStyle = p.color+Math.round(p.opacity*255).toString(16).padStart(2,'0')
        ctx.fill()
        p.x+=p.vx; p.y+=p.vy
        if(p.x<0||p.x>canvas.width)p.vx*=-1
        if(p.y<0||p.y>canvas.height)p.vy*=-1
      })
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize',resize) }
  }, [])

  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-0" style={{ opacity:.65 }} />
}

// ── Feature tile data ─────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Globe2,
    color: '#3B6FE8',
    bg:    'rgba(59,111,232,0.12)',
    title: 'Interactive 3D Globe',
    desc:  'Your city pinned at the centre of a live globe with nearby AQI stations',
  },
  {
    icon: Zap,
    color: '#F5A623',
    bg:    'rgba(245,166,35,0.12)',
    title: 'Real-Time Station Data',
    desc:  'Station-level readings updated every hour from thousands of monitors worldwide',
  },
  {
    icon: BarChart3,
    color: '#00D4FF',
    bg:    'rgba(0,212,255,0.12)',
    title: '7-Day History',
    desc:  'Track how air quality has changed over the past week with interactive charts',
  },
  {
    icon: Heart,
    color: '#FF6B6B',
    bg:    'rgba(255,107,107,0.12)',
    title: 'Health Guidance',
    desc:  'Personalised recommendations for your health group based on current AQI',
  },
  {
    icon: Star,
    color: '#FFD080',
    bg:    'rgba(255,208,128,0.12)',
    title: 'Kids Mode 🐻',
    desc:  'Air Bear turns complex data into fun, emoji-friendly info for young ones',
  },
  {
    icon: Shield,
    color: '#00E5A0',
    bg:    'rgba(0,229,160,0.12)',
    title: 'Pollutant Breakdown',
    desc:  'PM2.5, PM10, O₃, NO₂, SO₂ and CO with safe-level indicators at a glance',
  },
]

const TRUST_BADGES = [
  { icon: Globe2, value: '500+',  label: 'Cities Covered' },
  { icon: Clock,  value: 'Hourly', label: 'Data Refresh' },
  { icon: Users,  value: 'Free',   label: 'Always & Forever' },
  { icon: Zap,    value: 'Live',   label: 'Station-Level' },
]

const HOW_STEPS = [
  { n: '01', icon: MapPin,  title: 'Share your location', desc: 'One tap to detect your city, or type it manually' },
  { n: '02', icon: Globe2,  title: 'See the globe', desc: 'Your location pinned on a live, spinning 3D globe' },
  { n: '03', icon: Heart,   title: 'Breathe informed', desc: 'Get AQI, pollutants and health advice instantly' },
]

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter()
  const [city,       setCity]       = useState('')
  const [kidsMode,   setKidsMode]   = useState(false)
  const [locStatus,  setLocStatus]  = useState<'idle'|'loading'|'success'|'denied'|'error'>('idle')
  const [locName,    setLocName]    = useState<string|null>(null)
  const [quickAQI,   setQuickAQI]   = useState<{ city:string;aqi:number;color:string;emoji:string;label:string }|null>(null)
  const [searching,  setSearching]  = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const lastCity  = localStorage.getItem('aqi-last-city')
    const savedMode = localStorage.getItem('aqi-mode')
    if (lastCity)          setCity(lastCity)
    if (savedMode==='kids') setKidsMode(true)

    // Fetch preview AQI for Delhi
    fetch('/api/air-quality/city?city=Delhi')
      .then(r => r.json())
      .then(d => {
        if (d.station) {
          const { emoji, color, label } = getAQIInfo(d.station.aqi)
          setQuickAQI({ city: d.station.name.split(',')[0], aqi: d.station.aqi, color, emoji, label })
        }
      })
      .catch(() => {
        const fallback = getAQIInfo(162)
        setQuickAQI({ city:'Delhi', aqi:162, ...fallback })
      })
  }, [])

  const handleDetect = useCallback(() => {
    if (!navigator.geolocation) { setLocStatus('error'); return }
    setLocStatus('loading')
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lon } = pos.coords
        setLocStatus('success')
        try {
          const res  = await fetch(`/api/air-quality/nearest?lat=${lat}&lon=${lon}`)
          const data = await res.json()
          if (data.station) {
            const name = data.station.name.split(',')[0]
            setLocName(name); setCity(name)
            const info = getAQIInfo(data.station.aqi)
            setQuickAQI({ city: name, aqi: data.station.aqi, ...info })
            localStorage.setItem('aqi-last-lat',  lat.toString())
            localStorage.setItem('aqi-last-lon',  lon.toString())
            localStorage.setItem('aqi-last-city', name)
            localStorage.setItem('aqi-mode', kidsMode ? 'kids' : 'normal')
            setTimeout(() => router.push('/dashboard'), 1200)
          }
        } catch { setLocStatus('error') }
      },
      () => setLocStatus('denied'),
      { timeout: 10000, maximumAge: 300000 }
    )
  }, [kidsMode, router])

  const handleSearch = useCallback(async () => {
    if (!city.trim()) { inputRef.current?.focus(); return }
    setSearching(true)
    localStorage.setItem('aqi-last-city', city.trim())
    localStorage.setItem('aqi-mode', kidsMode ? 'kids' : 'normal')
    await new Promise(r => setTimeout(r, 500))
    router.push('/dashboard')
  }, [city, kidsMode, router])

  const canSearch = city.trim().length > 0 || locStatus === 'success'

  return (
    <div
      className="relative min-h-screen flex flex-col overflow-x-hidden"
      style={{ background: 'radial-gradient(ellipse at 60% 35%, #0F1A3A 0%, #060B1A 55%, #03070F 100%)' }}
    >
      {/* Grid */}
      <div className="fixed inset-0 z-0 opacity-35 pointer-events-none"
        style={{ backgroundImage:'linear-gradient(rgba(59,111,232,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(59,111,232,0.06) 1px,transparent 1px)', backgroundSize:'48px 48px' }} />
      <ParticleCanvas />

      {/* Ambient glows */}
      <div className="fixed top-[-15%] right-[-8%] w-[600px] h-[600px] rounded-full pointer-events-none z-0"
        style={{ background:'radial-gradient(circle,rgba(59,111,232,0.12) 0%,transparent 70%)' }} />
      <div className="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{ background:'radial-gradient(circle,rgba(245,166,35,0.08) 0%,transparent 70%)' }} />

      {/* ── Header ── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'linear-gradient(135deg,#3B6FE8,#00D4FF)' }}>
            <Wind size={16} className="text-white" />
          </div>
          <span className="font-display font-700 text-white text-lg" style={{ fontFamily:'var(--font-display)' }}>AirPulse</span>
        </div>

        {/* Kids toggle in header */}
        <button
          onClick={() => { const n=!kidsMode; setKidsMode(n); localStorage.setItem('aqi-mode', n?'kids':'normal') }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-2xl border transition-all duration-300"
          style={kidsMode ? { background:'rgba(245,166,35,0.12)', border:'1px solid rgba(245,166,35,0.3)' } : { background:'rgba(15,26,58,0.5)', border:'1px solid rgba(59,111,232,0.18)' }}
        >
          <span style={{ fontSize:16, animation: kidsMode ? 'float 3s ease-in-out infinite' : 'none' }}>{kidsMode ? '🐻' : '⭐'}</span>
          <span className="text-xs hidden sm:block" style={{ fontFamily:'var(--font-display)', color: kidsMode ? '#FFD080' : 'var(--muted)' }}>
            {kidsMode ? 'Kids On' : 'Kids Mode'}
          </span>
          <div className="relative rounded-full shrink-0 transition-all duration-300"
            style={{ width:30,height:17, background: kidsMode?'#F5A623':'rgba(30,45,107,0.8)', border: kidsMode?'1px solid rgba(255,182,0,0.4)':'1px solid rgba(59,111,232,0.3)' }}>
            <span className="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all duration-300"
              style={{ left: kidsMode ? 14 : 2 }} />
          </div>
        </button>
      </header>

      {/* ════════════════════════════════════════════════════════
          HERO
          ════════════════════════════════════════════════════════ */}
      <main className="relative z-10 flex-1">
        <section className="flex flex-col items-center justify-center px-5 pt-8 pb-12 text-center">

          {/* Status pill */}
          <div className="mb-6 animate-fade-up">
            <div className="glass rounded-full px-4 py-1.5 inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-aqi-good animate-pulse" />
              <span className="text-xs font-mono text-muted">Live data · 500+ cities · Updated hourly</span>
            </div>
          </div>

          {/* Headline */}
          <div className="max-w-2xl animate-fade-up-d1">
            <h1 className="font-display font-800 leading-tight mb-4"
              style={{ fontSize:'clamp(2.2rem,5vw,3.8rem)', fontFamily:'var(--font-display)' }}>
              {kidsMode ? (
                <><span className="text-white">Is the air safe</span>{' '}
                  <span className="gradient-text-gold text-glow-gold">to play outside?</span> 🌬️</>
              ) : (
                <><span className="text-white">Know what you</span><br />
                  <span className="gradient-text-gold text-glow-gold">breathe, right now</span></>
              )}
            </h1>
            <p className="text-muted text-base md:text-lg leading-relaxed font-300 animate-fade-up-d2">
              {kidsMode
                ? 'Find out if the air is clean or yucky — with your buddy Air Bear! 🐻'
                : 'Station-level AQI, interactive 3D globe, pollutant breakdown and health guidance — personalised to your location.'}
            </p>
          </div>

          {/* ── Input card ── */}
          <div className="mt-9 w-full max-w-md animate-fade-up-d3">
            <div className="glass-gold rounded-3xl p-5 shadow-card-lg">
              {/* Detect location */}
              <button
                onClick={handleDetect}
                disabled={locStatus==='loading'||locStatus==='success'}
                className={clsx(
                  'w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-display font-600 text-sm transition-all duration-300 mb-3',
                  locStatus==='success' ? 'bg-aqi-good/20 border border-aqi-good/40 text-aqi-good cursor-default'
                  : locStatus==='loading' ? 'bg-navy-500/30 border border-cobalt-300/25 text-muted cursor-wait'
                  : 'bg-navy-600/40 border border-cobalt-300/25 text-white hover:border-gold-400/40 hover:bg-navy-500/50'
                )}
                style={{ fontFamily:'var(--font-display)' }}
              >
                {locStatus==='loading' ? <><Loader2 size={17} className="animate-spin text-cobalt-300" />Detecting location…</>
                  : locStatus==='success' ? <><MapPin size={17} className="text-aqi-good" />📍 {locName ?? 'Location detected'}</>
                  : <><MapPin size={17} className="text-gold-300" />Use My Location</>}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-cobalt-300/10" />
                <span className="text-[11px] text-muted2 font-mono">or search manually</span>
                <div className="flex-1 h-px bg-cobalt-300/10" />
              </div>

              {/* Input + CTA */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted2 pointer-events-none" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && handleSearch()}
                    placeholder="Search city…"
                    className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white placeholder:text-muted2 outline-none transition-all"
                    style={{ background:'rgba(10,17,40,0.6)', border:'1px solid rgba(59,111,232,0.2)', fontFamily:'var(--font-body)' }}
                    onFocus={e => e.target.style.borderColor='rgba(245,166,35,0.4)'}
                    onBlur={e  => e.target.style.borderColor='rgba(59,111,232,0.2)'}
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={!canSearch||searching}
                  className="px-4 py-3 rounded-xl font-display font-600 text-sm flex items-center gap-1.5 transition-all duration-200"
                  style={canSearch && !searching ? {
                    background:'linear-gradient(135deg,#F5A623,#FFB84D)',
                    color:'#060B1A',
                    boxShadow:'0 4px 20px rgba(245,166,35,0.35)',
                    fontFamily:'var(--font-display)',
                  } : {
                    background:'rgba(15,26,58,0.6)',
                    border:'1px solid rgba(59,111,232,0.18)',
                    color:'var(--muted2)',
                    opacity: 0.5,
                  }}
                >
                  {searching ? <Loader2 size={15} className="animate-spin" /> : <ChevronRight size={15} />}
                  {searching ? 'Loading' : 'Check'}
                </button>
              </div>

              {/* Error states */}
              {locStatus==='denied' && (
                <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-aqi-unhealthy/10 border border-aqi-unhealthy/20 animate-scale-in">
                  <AlertTriangle size={13} className="text-aqi-unhealthy mt-0.5 shrink-0" />
                  <p className="text-xs text-aqi-unhealthy/90">Location denied. Please search your city manually.</p>
                </div>
              )}
              {locStatus==='error' && (
                <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-gold-400/10 border border-gold-400/20 animate-scale-in">
                  <AlertTriangle size={13} className="text-gold-300 mt-0.5 shrink-0" />
                  <p className="text-xs text-gold-200">Could not detect location. Try searching manually.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick AQI preview */}
          {quickAQI && (
            <div className="mt-4 animate-fade-up-d4">
              <div
                className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl"
                style={{ background:'rgba(15,26,58,0.7)', border:`1px solid ${quickAQI.color}28`, backdropFilter:'blur(12px)' }}
              >
                <span style={{ fontSize:22 }}>{quickAQI.emoji}</span>
                <div className="text-left">
                  <span className="text-xs font-mono text-muted2">{quickAQI.city} right now</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-display font-700" style={{ color:quickAQI.color, fontFamily:'var(--font-display)' }}>{quickAQI.aqi}</span>
                    <span className="text-xs text-muted">AQI · {quickAQI.label}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ════════════════════════════════════════════════════════
            TRUST BADGES
            ════════════════════════════════════════════════════════ */}
        <section className="relative z-10 px-5 pb-10 animate-fade-up-d4">
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TRUST_BADGES.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl text-center"
                  style={{ background:'rgba(15,26,58,0.55)', border:'1px solid rgba(59,111,232,0.12)', backdropFilter:'blur(12px)' }}
                >
                  <Icon size={16} className="text-cobalt-300 opacity-70" />
                  <span className="font-display font-700 text-white text-lg leading-none" style={{ fontFamily:'var(--font-display)' }}>{value}</span>
                  <span className="text-[10px] font-mono text-muted2">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            FEATURE TILES
            ════════════════════════════════════════════════════════ */}
        <section className="relative z-10 px-5 pb-14">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="font-display font-700 text-white text-2xl mb-2" style={{ fontFamily:'var(--font-display)' }}>
                Everything you need to <span className="gradient-text-gold">breathe smart</span>
              </h2>
              <p className="text-muted text-sm">Built for anyone who cares about the air around them</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
                <div
                  key={title}
                  className="relative rounded-2xl p-5 card-hover group"
                  style={{ background:'rgba(10,17,40,0.6)', border:'1px solid rgba(59,111,232,0.12)', backdropFilter:'blur(12px)' }}
                >
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110"
                    style={{ background: bg, border: `1px solid ${color}30` }}
                  >
                    <Icon size={18} style={{ color }} />
                  </div>
                  <h3 className="font-display font-700 text-white text-sm mb-1.5" style={{ fontFamily:'var(--font-display)' }}>{title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{desc}</p>

                  {/* Hover accent line */}
                  <div
                    className="absolute bottom-0 left-5 right-5 h-px rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            HOW IT WORKS
            ════════════════════════════════════════════════════════ */}
        <section className="relative z-10 px-5 pb-16">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="font-display font-700 text-white text-2xl" style={{ fontFamily:'var(--font-display)' }}>
                How it works
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {HOW_STEPS.map(({ n, icon: Icon, title, desc }) => (
                <div key={n} className="flex flex-col items-center text-center gap-3 p-5 rounded-2xl"
                  style={{ background:'rgba(10,17,40,0.4)', border:'1px solid rgba(59,111,232,0.1)' }}>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background:'rgba(59,111,232,0.15)', border:'1px solid rgba(59,111,232,0.25)' }}>
                      <Icon size={20} className="text-cobalt-300" />
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-700"
                      style={{ background:'#F5A623', color:'#060B1A' }}>{n}</span>
                  </div>
                  <div>
                    <div className="font-display font-700 text-white text-sm mb-1" style={{ fontFamily:'var(--font-display)' }}>{title}</div>
                    <p className="text-xs text-muted">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 text-center pb-8 px-5">
        <div className="h-px bg-gradient-to-r from-transparent via-cobalt-300/15 to-transparent mb-6" />
        <p className="text-xs text-muted2 font-mono">
          AirPulse · Powered by WAQI · Data updates every hour · Free forever
        </p>
      </footer>
    </div>
  )
}
