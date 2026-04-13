'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { getAQIColor, getAQICategory, formatAQI } from '@/lib/aqi-utils'
import type { AQIStation, MapViewport } from '@/types'

interface AQIMapProps {
  stations: AQIStation[]
  viewport: MapViewport
  userLocation?: { lat: number; lon: number } | null
  onBoundsChange?: (minLat: number, minLon: number, maxLat: number, maxLon: number) => void
  onStationClick?: (station: AQIStation) => void
  loading?: boolean
  className?: string
}

// ─── Popup HTML builder ───────────────────────────────────────────────────────
function buildPopupHTML(s: AQIStation): string {
  const color = getAQIColor(s.aqi)
  const cat   = getAQICategory(s.aqi)
  return `
    <div style="min-width:180px;font-family:'DM Sans',sans-serif">
      <div style="font-size:11px;color:#8899CC;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">
        📡 Air Quality Station
      </div>
      <div style="font-size:14px;font-weight:600;color:#F0F4FF;margin-bottom:8px;line-height:1.3">
        ${s.name.split(',')[0]}
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="font-size:28px;font-weight:800;color:${color};font-family:'JetBrains Mono',monospace;line-height:1">
          ${formatAQI(s.aqi)}
        </span>
        <span style="font-size:11px;padding:2px 8px;border-radius:20px;background:${color}20;color:${color};border:1px solid ${color}40">
          ${cat}
        </span>
      </div>
      <div style="font-size:11px;color:#8899CC;margin-top:4px">
        Dominant: <span style="color:${color};font-family:'JetBrains Mono',monospace">${(s.dominant_pollutant || 'pm25').toUpperCase()}</span>
      </div>
      ${s.pm25 !== null ? `<div style="font-size:10px;color:#556088;margin-top:2px;font-family:'JetBrains Mono',monospace">PM2.5: ${s.pm25?.toFixed(1)} μg/m³</div>` : ''}
    </div>
  `
}

export default function AQIMap({
  stations,
  viewport,
  userLocation,
  onBoundsChange,
  onStationClick,
  loading,
  className = '',
}: AQIMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<ReturnType<typeof import('leaflet')['map']> | null>(null)
  const markersRef   = useRef<ReturnType<typeof import('leaflet')['layerGroup']> | null>(null)
  const userPinRef   = useRef<ReturnType<typeof import('leaflet')['marker']> | null>(null)
  const [mapReady, setMapReady] = useState(false)

  // ── Init map ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || mapRef.current) return

    const initMap = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      if (!containerRef.current) return

      const map = L.map(containerRef.current, {
        center:          [viewport.lat, viewport.lon],
        zoom:            viewport.zoom,
        zoomControl:     false,
        attributionControl: false,
      })

      // Dark CartoDB tile layer
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { maxZoom: 18, subdomains: 'abcd' }
      ).addTo(map)

      // Custom zoom control (top-right)
      L.control.zoom({ position: 'topright' }).addTo(map)

      // Attribution
      L.control.attribution({ position: 'bottomright', prefix: false })
        .addAttribution('© WAQI · © Carto')
        .addTo(map)

      // Layer group for markers
      const markersLayer = L.layerGroup().addTo(map)
      markersRef.current = markersLayer

      // Bounds change callback
      map.on('moveend', () => {
        if (!onBoundsChange) return
        const b = map.getBounds()
        onBoundsChange(b.getSouth(), b.getWest(), b.getNorth(), b.getEast())
      })

      mapRef.current = map
      setMapReady(true)

      // Initial bounds fetch
      const b = map.getBounds()
      onBoundsChange?.(b.getSouth(), b.getWest(), b.getNorth(), b.getEast())
    }

    initMap()

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Update viewport when prop changes ────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return
    mapRef.current.setView([viewport.lat, viewport.lon], viewport.zoom, { animate: true })
  }, [viewport, mapReady])

  // ── Render station markers ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !markersRef.current || !mapReady) return

    const renderMarkers = async () => {
      const L = (await import('leaflet')).default
      markersRef.current!.clearLayers()

      stations.forEach(station => {
        const color  = getAQIColor(station.aqi)
        const size   = station.aqi > 200 ? 36 : station.aqi > 100 ? 32 : 28

        const icon = L.divIcon({
          className: '',
          html: `
            <div class="aqi-marker" style="
              width:${size}px;height:${size}px;
              background:${color};
              font-size:${size < 32 ? 10 : 11}px;
              color:#060B1A;
              font-weight:600;
              font-family:'JetBrains Mono',monospace;
              ${station.aqi > 150 ? `box-shadow:0 0 12px ${color}70,0 2px 6px rgba(0,0,0,0.4)` : ''}
            ">
              ${formatAQI(station.aqi)}
            </div>`,
          iconSize:   [size, size],
          iconAnchor: [size/2, size/2],
        })

        const marker = L.marker([station.lat, station.lon], { icon })
          .bindPopup(buildPopupHTML(station), {
            maxWidth: 240,
            className: 'aqi-popup',
          })
          .on('click', () => onStationClick?.(station))

        markersRef.current!.addLayer(marker)
      })
    }

    renderMarkers()
  }, [stations, mapReady, onStationClick])

  // ── User location pin ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return

    const renderUserPin = async () => {
      const L = (await import('leaflet')).default

      // Remove previous pin
      if (userPinRef.current) {
        userPinRef.current.remove()
        userPinRef.current = null
      }

      if (!userLocation) return

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="position:relative;display:flex;align-items:center;justify-content:center">
            <div style="
              position:absolute;
              width:40px;height:40px;
              border-radius:50%;
              border:2px solid rgba(0,212,255,0.5);
              animation:pulse-ring 2s ease-out infinite;
            "></div>
            <div style="
              position:absolute;
              width:60px;height:60px;
              border-radius:50%;
              border:1px solid rgba(0,212,255,0.25);
              animation:pulse-ring 2s 0.5s ease-out infinite;
            "></div>
            <div style="
              width:14px;height:14px;
              background:#00D4FF;
              border-radius:50%;
              border:2px solid white;
              box-shadow:0 0 12px rgba(0,212,255,0.8);
            "></div>
          </div>`,
        iconSize:   [60, 60],
        iconAnchor: [30, 30],
      })

      const pin = L.marker([userLocation.lat, userLocation.lon], { icon, zIndexOffset: 1000 })
        .bindPopup(`
          <div style="font-family:'DM Sans',sans-serif">
            <div style="font-size:12px;color:#00D4FF;font-weight:600">📍 Your Location</div>
            <div style="font-size:10px;color:#8899CC;font-family:'JetBrains Mono',monospace;margin-top:2px">
              ${userLocation.lat.toFixed(4)}°, ${userLocation.lon.toFixed(4)}°
            </div>
          </div>`)
        .addTo(mapRef.current!)

      userPinRef.current = pin
    }

    renderUserPin()
  }, [userLocation, mapReady])

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="w-full h-full rounded-3xl overflow-hidden" />

      {/* Loading overlay */}
      {loading && (
        <div
          className="absolute inset-0 rounded-3xl flex items-center justify-center z-20"
          style={{ background: 'rgba(6,11,26,0.6)', backdropFilter: 'blur(4px)' }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-cobalt-300/30 border-t-cobalt-300 animate-spin" />
            <span className="text-xs font-mono text-muted">Loading stations…</span>
          </div>
        </div>
      )}

      {/* Station count badge */}
      {stations.length > 0 && (
        <div
          className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-full text-xs font-mono"
          style={{
            background: 'rgba(6,11,26,0.85)',
            border: '1px solid rgba(59,111,232,0.25)',
            color: 'var(--muted)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {stations.length} stations
        </div>
      )}

      {/* Legend */}
      <div
        className="absolute bottom-3 left-3 z-10 px-3 py-2 rounded-xl"
        style={{
          background: 'rgba(6,11,26,0.9)',
          border: '1px solid rgba(59,111,232,0.2)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="text-[9px] font-mono text-muted2 uppercase tracking-wider mb-1.5">AQI Legend</div>
        <div className="flex items-center gap-3">
          {[
            { c: '#00E5A0', l: '0–50' },
            { c: '#FFD60A', l: '51–100' },
            { c: '#FF8C00', l: '101–150' },
            { c: '#FF3B4E', l: '151–200' },
            { c: '#9B2FFF', l: '201–300' },
            { c: '#7B0000', l: '300+' },
          ].map(({ c, l }) => (
            <div key={l} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
              <span className="text-[9px] font-mono text-muted2">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
