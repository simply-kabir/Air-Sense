'use client'

import { useEffect, useRef } from 'react'
import type { AQIStation } from '@/types'
import { getAQIColor } from '@/lib/aqi-utils'

interface AQIGlobeProps {
  userLat?: number
  userLon?: number
  stations?: AQIStation[]
  isKids?: boolean
  className?: string
  style?: React.CSSProperties
}

function ll2xyz(lat: number, lon: number, r = 1): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return [
    -(r * Math.sin(phi) * Math.cos(theta)),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ]
}

function stationHash(s: AQIStation[]): string {
  return s.map(st => `${st.lat.toFixed(2)},${st.lon.toFixed(2)},${Math.round(st.aqi / 5) * 5}`).join('|')
}

function stationCentroid(s: AQIStation[]): { lat: number; lon: number } | null {
  if (!s.length) return null
  let la = 0, lo = 0
  for (const st of s) { la += st.lat; lo += st.lon }
  return { lat: la / s.length, lon: lo / s.length }
}

function nearestStation(s: AQIStation[], lat: number, lon: number): AQIStation | null {
  if (!s.length) return null
  let b = s[0], bd = Infinity
  for (const st of s) { const d = (st.lat - lat) ** 2 + (st.lon - lon) ** 2; if (d < bd) { bd = d; b = st } }
  return b
}

function stationName(s: AQIStation): string {
  const r = s as unknown as Record<string, unknown>
  return (r.name || r.stationName || r.city || r.location || 'Monitoring Station') as string
}

function healthInfo(aqi: number, kids = false) {
  if (kids) {
    if (aqi <= 50) return { cat: 'Good', rec: 'The air is clean! Perfect for playing outside! 🌿' }
    if (aqi <= 100) return { cat: 'Okay', rec: 'Air is okay, but take it easy outside. 👍' }
    if (aqi <= 150) return { cat: 'Not Great', rec: 'Better to play indoors today. 🏠' }
    if (aqi <= 200) return { cat: 'Bad', rec: 'Stay inside and keep windows closed! 😷' }
    if (aqi <= 300) return { cat: 'Very Bad', rec: 'Do NOT go outside! Stay indoors! ⚠️' }
    return { cat: 'Dangerous!', rec: 'Emergency! Stay inside, keep doors & windows shut! 🚨' }
  }
  if (aqi <= 50) return { cat: 'Good', rec: 'Air quality is satisfactory with little or no health risk.' }
  if (aqi <= 100) return { cat: 'Moderate', rec: 'Acceptable quality. Unusually sensitive people should limit prolonged outdoor exertion.' }
  if (aqi <= 150) return { cat: 'Unhealthy for Sensitive', rec: 'People with respiratory conditions, elderly & children should reduce outdoor exertion.' }
  if (aqi <= 200) return { cat: 'Unhealthy', rec: 'Everyone may begin to experience health effects. Reduce prolonged outdoor activity.' }
  if (aqi <= 300) return { cat: 'Very Unhealthy', rec: 'Health alert: serious effects possible for everyone. Avoid outdoor activity.' }
  return { cat: 'Hazardous', rec: 'Health emergency! Everyone should avoid all outdoor exertion.' }
}

/* ─── Dot generators (NO text, NO blue pin) ──────────────────────────── */

function makeDot(aqi: number, sz = 64): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = sz; c.height = sz
  const x = c.getContext('2d')!, m = sz / 2, col = getAQIColor(aqi)
  const g = x.createRadialGradient(m, m, sz * 0.06, m, m, sz * 0.5)
  g.addColorStop(0, col + 'cc'); g.addColorStop(0.45, col + '44'); g.addColorStop(1, col + '00')
  x.fillStyle = g; x.fillRect(0, 0, sz, sz)
  x.beginPath(); x.arc(m, m, sz * 0.22, 0, Math.PI * 2); x.fillStyle = col; x.fill()
  return c
}

function makeMainDot(aqi: number, sz = 128): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = sz; c.height = sz
  const x = c.getContext('2d')!, m = sz / 2, col = getAQIColor(aqi)
  const g = x.createRadialGradient(m, m, sz * 0.06, m, m, sz * 0.5)
  g.addColorStop(0, col + 'dd'); g.addColorStop(0.3, col + '66'); g.addColorStop(1, col + '00')
  x.fillStyle = g; x.fillRect(0, 0, sz, sz)
  x.beginPath(); x.arc(m, m, sz * 0.30, 0, Math.PI * 2)
  x.strokeStyle = 'rgba(255,255,255,0.45)'; x.lineWidth = sz * 0.03; x.stroke()
  x.beginPath(); x.arc(m, m, sz * 0.21, 0, Math.PI * 2); x.fillStyle = col; x.fill()
  return c
}

/* ─── Component ──────────────────────────────────────────────────────── */

export default function AQIGlobe({
  userLat = 28.6139, userLon = 77.2090, stations = [],
  isKids = false, className = '', style,
}: AQIGlobeProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number>(0)
  const cleanRef = useRef<(() => void) | null>(null)
  const pr = useRef({ userLat, userLon, stations, isKids })
  pr.current = { userLat, userLon, stations, isKids }

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    cancelAnimationFrame(frameRef.current)
    if (cleanRef.current) { cleanRef.current(); cleanRef.current = null }
    while (el.firstChild) el.removeChild(el.firstChild)

    let alive = true

    const boot = async (W: number, H: number) => {
      const mod = await import('three')
      const THREE = (mod as unknown as { default: typeof mod }).default ?? mod
      if (!alive || !wrapRef.current) return

      /* ── Renderer ────────────────────────────────────────────── */
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)
      Object.assign(renderer.domElement.style, {
        position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block', cursor: 'grab',
      })
      wrapRef.current.appendChild(renderer.domElement)

      /* ── Scene / Camera / Lights ─────────────────────────────── */
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 1000)
      camera.position.z = 3.2

      scene.add(new THREE.AmbientLight(0x223355, 1.5))
      const sun = new THREE.DirectionalLight(0xfff5e0, 2.2); sun.position.set(6, 3, 5); scene.add(sun)
      const fill = new THREE.DirectionalLight(0x2244aa, 0.3); fill.position.set(-5, -2, -4); scene.add(fill)

      /* ── Stars ───────────────────────────────────────────────── */
      const sp: number[] = []
      for (let i = 0; i < 2000; i++) {
        const r = 9 + Math.random() * 4, t = Math.random() * Math.PI * 2, q = Math.acos(2 * Math.random() - 1)
        sp.push(r * Math.sin(q) * Math.cos(t), r * Math.sin(q) * Math.sin(t), r * Math.cos(q))
      }
      const sg = new THREE.BufferGeometry()
      sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3))
      scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.018, transparent: true, opacity: 0.85 })))

      /* ── Earth texture ───────────────────────────────────────── */
      const loader = new THREE.TextureLoader(); loader.crossOrigin = 'anonymous'
      let earthTex: THREE.Texture
      try {
        earthTex = await new Promise<THREE.Texture>((res, rej) =>
          loader.load('https://unpkg.com/three-globe/example/img/earth-night.jpg', res, undefined, rej))
      } catch {
        const fc = document.createElement('canvas'); fc.width = 512; fc.height = 256
        const fctx = fc.getContext('2d')!
        const g = fctx.createLinearGradient(0, 0, 512, 256)
        g.addColorStop(0, '#041830'); g.addColorStop(1, '#082040')
        fctx.fillStyle = g; fctx.fillRect(0, 0, 512, 256)
        earthTex = new THREE.CanvasTexture(fc)
      }
      if (!alive) { earthTex.dispose(); renderer.dispose(); return }

      let bumpTex: THREE.Texture | undefined
      try {
        bumpTex = await new Promise<THREE.Texture>((res, rej) =>
          loader.load('https://unpkg.com/three-globe/example/img/earth-topology.png', res, undefined, rej))
      } catch { /* optional */ }
      if (!alive) { earthTex.dispose(); bumpTex?.dispose(); renderer.dispose(); return }

      /* ── Earth + Atmosphere ──────────────────────────────────── */
      const earth = new THREE.Mesh(
        new THREE.SphereGeometry(1, 96, 96),
        new THREE.MeshPhongMaterial({ map: earthTex, bumpMap: bumpTex, bumpScale: 0.005, specular: new THREE.Color(0x111122), shininess: 12 })
      )
      const atmos1 = new THREE.Mesh(new THREE.SphereGeometry(1.055, 64, 64),
        new THREE.MeshPhongMaterial({ color: 0x2266ff, transparent: true, opacity: 0.09, side: THREE.FrontSide }))
      const atmos2 = new THREE.Mesh(new THREE.SphereGeometry(1.12, 64, 64),
        new THREE.MeshPhongMaterial({ color: 0x0044cc, transparent: true, opacity: 0.04, side: THREE.FrontSide }))

      const world = new THREE.Group(); scene.add(world)
      world.add(earth, atmos1, atmos2)

      const stationsGroup = new THREE.Group(); world.add(stationsGroup)

      /* ── Station sprites ─────────────────────────────────────── */
      const dotCache = new Map<number, THREE.SpriteMaterial>()
      const mainDotCache = new Map<number, THREE.SpriteMaterial>()

      const applyStations = (stList: AQIStation[], vLat: number, vLon: number) => {
        while (stationsGroup.children.length > 0) stationsGroup.remove(stationsGroup.children[0])
        const main = nearestStation(stList, vLat, vLon)

        stList.slice(0, 60).forEach(s => {
          const isMain = !!main && s.lat === main.lat && s.lon === main.lon && s.aqi === main.aqi
          const bucket = Math.round(s.aqi / 5) * 5

          if (isMain) {
            if (!mainDotCache.has(bucket)) {
              mainDotCache.set(bucket, new THREE.SpriteMaterial({
                map: new THREE.CanvasTexture(makeMainDot(bucket)),
                transparent: true, depthTest: false, sizeAttenuation: true,
              }))
            }
            const [x, y, z] = ll2xyz(s.lat, s.lon, 1.045)
            const spr = new THREE.Sprite(mainDotCache.get(bucket)!)
            spr.scale.set(0.11, 0.11, 1)
            spr.position.set(x, y, z)
            spr.userData = { station: s, isMain: true }
            stationsGroup.add(spr)
          } else {
            if (!dotCache.has(bucket)) {
              dotCache.set(bucket, new THREE.SpriteMaterial({
                map: new THREE.CanvasTexture(makeDot(bucket)),
                transparent: true, depthTest: false, sizeAttenuation: true,
              }))
            }
            const [x, y, z] = ll2xyz(s.lat, s.lon, 1.04)
            const spr = new THREE.Sprite(dotCache.get(bucket)!)
            spr.scale.set(0.055, 0.055, 1)
            spr.position.set(x, y, z)
            spr.userData = { station: s, isMain: false }
            stationsGroup.add(spr)
          }
        })
      }

      /* ── Rotation state ──────────────────────────────────────── */
      const initLon = pr.current.userLon * (Math.PI / 180)
      const initLat = pr.current.userLat * (Math.PI / 180)
      let currentX = initLat, currentY = -(Math.PI / 2 + initLon)
      let targetX = currentX, targetY = currentY
      let startX = currentX, startY = currentY
      let animStart = 0, isAnimating = false
      world.rotation.x = currentX; world.rotation.y = currentY

      let viewLat = pr.current.userLat, viewLon = pr.current.userLon

      const rotateTo = (lat: number, lon: number) => {
        const ntx = lat * (Math.PI / 180)
        let nty = -(Math.PI / 2 + lon * (Math.PI / 180))
        if (Math.abs(targetX - ntx) < 0.001 && Math.abs(targetY - nty) < 0.001) return
        startX = currentX; startY = currentY; targetX = ntx
        let dy = nty - startY
        while (dy > Math.PI) dy -= 2 * Math.PI
        while (dy < -Math.PI) dy += 2 * Math.PI
        targetY = startY + dy; animStart = performance.now(); isAnimating = true
        viewLat = lat; viewLon = lon
      }

      /* ── Previous-frame snapshots ────────────────────────────── */
      let prevUserLat = pr.current.userLat, prevUserLon = pr.current.userLon
      let prevHash = stationHash(pr.current.stations)
      let prevCent = stationCentroid(pr.current.stations)
      applyStations(pr.current.stations, viewLat, viewLon)

      /* ── Tooltip ─────────────────────────────────────────────── */
      const tip = document.createElement('div')
      Object.assign(tip.style, {
        position: 'absolute', pointerEvents: 'none', zIndex: '100',
        opacity: '0', transition: 'opacity 0.12s ease',
        maxWidth: '240px', overflow: 'hidden',
      })
      wrapRef.current.appendChild(tip)

      const rc = new THREE.Raycaster()
      const ndc = new THREE.Vector2(-9, -9)
      let hovered: THREE.Sprite | null = null

      const clampTip = (localX: number, localY: number, tw: number, th: number, cw: number, ch: number) => {
        const pad = 8
        let tx = localX + 16, ty = localY - 10
        if (tx + tw > cw - pad) tx = localX - tw - 16
        if (ty + th > ch - pad) ty = ch - th - pad
        if (ty < pad) ty = pad
        if (tx < pad) tx = pad
        return { tx, ty }
      }

      const showTip = (spr: THREE.Sprite, pageX: number, pageY: number) => {
        const st = spr.userData.station as AQIStation
        if (!st) return
        const col = getAQIColor(st.aqi)
        const info = healthInfo(st.aqi, pr.current.isKids)
        const nm = stationName(st)
        const main = spr.userData.isMain

        tip.innerHTML = `
          <div style="background:rgba(8,14,28,0.94);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px 14px;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:0 6px 24px rgba(0,0,0,0.5);font-family:'Inter',system-ui,-apple-system,sans-serif;">
            <div style="display:flex;align-items:center;gap:9px;margin-bottom:9px;">
              <div style="min-width:40px;height:40px;border-radius:9px;background:${col}1a;border:1.5px solid ${col}55;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;color:${col};font-family:'SF Mono',Consolas,monospace;flex-shrink:0;">${st.aqi}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:12.5px;font-weight:600;color:#e2e5ec;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${nm}</div>
                ${main ? '<div style="font-size:9.5px;color:#00E5FF;margin-top:2px;letter-spacing:0.3px;">● Your Location</div>' : ''}
              </div>
            </div>
            <div style="font-size:10.5px;font-weight:600;color:${col};padding:3px 9px;border-radius:6px;background:${col}15;display:inline-block;margin-bottom:7px;">${info.cat}</div>
            <div style="font-size:11px;color:#7c8599;line-height:1.45;">${info.rec}</div>
          </div>`

        // Keep invisible, measure, position, then reveal
        tip.style.opacity = '0'

        requestAnimationFrame(() => {
          if (!wrapRef.current || !alive) return
          const cr = wrapRef.current.getBoundingClientRect()
          const tw = tip.offsetWidth, th = tip.offsetHeight
          const lx = pageX - cr.left, ly = pageY - cr.top
          const { tx, ty } = clampTip(lx, ly, tw, th, cr.width, cr.height)
          tip.style.left = tx + 'px'
          tip.style.top = ty + 'px'
          requestAnimationFrame(() => { tip.style.opacity = '1' })
        })
      }

      const moveTip = (pageX: number, pageY: number) => {
        if (!wrapRef.current) return
        const cr = wrapRef.current.getBoundingClientRect()
        const tw = tip.offsetWidth, th = tip.offsetHeight
        const lx = pageX - cr.left, ly = pageY - cr.top
        const { tx, ty } = clampTip(lx, ly, tw, th, cr.width, cr.height)
        tip.style.left = tx + 'px'
        tip.style.top = ty + 'px'
      }

      const hideTip = () => {
        if (hovered) { tip.style.opacity = '0'; hovered = null; renderer.domElement.style.cursor = 'grab' }
      }

      const onMove = (e: MouseEvent) => {
        const r = renderer.domElement.getBoundingClientRect()
        ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1
        ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1
        rc.setFromCamera(ndc, camera)
        const hits = rc.intersectObjects(stationsGroup.children, false)
        if (hits.length && hits[0].object.userData.station) {
          const spr = hits[0].object as THREE.Sprite
          if (spr !== hovered) { hovered = spr; showTip(spr, e.clientX, e.clientY); renderer.domElement.style.cursor = 'pointer' }
          else moveTip(e.clientX, e.clientY)
        } else hideTip()
      }

      const onLeave = () => hideTip()

      const onTouch = (e: TouchEvent) => {
        const t = e.touches[0]; if (!t) return
        const r = renderer.domElement.getBoundingClientRect()
        ndc.x = ((t.clientX - r.left) / r.width) * 2 - 1
        ndc.y = -((t.clientY - r.top) / r.height) * 2 + 1
        rc.setFromCamera(ndc, camera)
        const hits = rc.intersectObjects(stationsGroup.children, false)
        if (hits.length && hits[0].object.userData.station) {
          const spr = hits[0].object as THREE.Sprite
          if (spr !== hovered) { hideTip(); hovered = spr; showTip(spr, t.clientX, t.clientY) }
        } else hideTip()
      }

      renderer.domElement.addEventListener('mousemove', onMove)
      renderer.domElement.addEventListener('mouseleave', onLeave)
      renderer.domElement.addEventListener('touchstart', onTouch, { passive: true })

      /* ── Resize ──────────────────────────────────────────────── */
      const ro = new ResizeObserver(entries => {
        const r = entries[0].contentRect
        if (!r.width || !r.height) return
        camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); renderer.setSize(r.width, r.height)
      })
      ro.observe(el)

      /* ── Render loop ─────────────────────────────────────────── */
      let t = 0
      const tick = () => {
        if (!alive) return
        frameRef.current = requestAnimationFrame(tick)
        const p = pr.current

        const userChanged = (p.userLat !== prevUserLat || p.userLon !== prevUserLon)
        const curHash = stationHash(p.stations)
        const stationsChanged = (curHash !== prevHash)
        const curCent = stationCentroid(p.stations)

        if (stationsChanged) {
          prevHash = curHash
          applyStations(p.stations, viewLat, viewLon)
        }

        if (userChanged) {
          prevUserLat = p.userLat; prevUserLon = p.userLon
          rotateTo(p.userLat, p.userLon)
          prevCent = curCent
        } else if (stationsChanged && curCent) {
          const shifted = prevCent && (Math.abs(curCent.lat - prevCent.lat) > 0.5 || Math.abs(curCent.lon - prevCent.lon) > 0.5)
          if (shifted || !prevCent) rotateTo(curCent.lat, curCent.lon)
          prevCent = curCent
        }

        if (isAnimating) {
          const elapsed = performance.now() - animStart
          let prog = elapsed / 1000
          if (prog >= 1) { prog = 1; isAnimating = false; currentX = targetX; currentY = targetY }
          else {
            const ease = 1 - Math.pow(1 - prog, 3)
            currentX = startX + (targetX - startX) * ease
            currentY = startY + (targetY - startY) * ease
          }
          world.rotation.x = currentX; world.rotation.y = currentY
        }

        renderer.render(scene, camera)
      }
      tick()

      /* ── Cleanup ─────────────────────────────────────────────── */
      cleanRef.current = () => {
        alive = false
        cancelAnimationFrame(frameRef.current); ro.disconnect()
        renderer.domElement.removeEventListener('mousemove', onMove)
        renderer.domElement.removeEventListener('mouseleave', onLeave)
        renderer.domElement.removeEventListener('touchstart', onTouch)
        dotCache.forEach(m => { m.map?.dispose(); m.dispose() })
        mainDotCache.forEach(m => { m.map?.dispose(); m.dispose() })
        earthTex.dispose(); bumpTex?.dispose(); renderer.dispose()
        if (wrapRef.current?.contains(renderer.domElement)) wrapRef.current.removeChild(renderer.domElement)
        if (wrapRef.current?.contains(tip)) wrapRef.current.removeChild(tip)
      }
    }

    const dimRO = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      if (width > 10 && height > 10) { dimRO.disconnect(); boot(width, height) }
    })
    dimRO.observe(el)

    return () => {
      alive = false; dimRO.disconnect(); cancelAnimationFrame(frameRef.current)
      if (cleanRef.current) { cleanRef.current(); cleanRef.current = null }
      if (wrapRef.current) while (wrapRef.current.firstChild) wrapRef.current.removeChild(wrapRef.current.firstChild)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={wrapRef} className={className} style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
          style={{ background: 'rgba(4,12,28,0.85)', border: '1px solid rgba(0,229,255,0.45)', backdropFilter: 'blur(10px)', color: '#00E5FF' }}>
          <span className="w-2 h-2 rounded-full shrink-0"
            style={{ background: '#00E5FF', boxShadow: '0 0 8px #00E5FF', animation: 'pulse 2s ease-in-out infinite' }} />
          {isKids ? '📍 You are here!' : 'Your location'}
        </div>
      </div>
      {stations.length > 0 && (
        <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
          <div className="px-3 py-1.5 rounded-full text-xs font-mono"
            style={{ background: 'rgba(4,12,28,0.85)', border: '1px solid rgba(59,111,232,0.35)', backdropFilter: 'blur(10px)', color: 'var(--muted)' }}>
            {stations.length} stations
          </div>
        </div>
      )}
    </div>
  )
}