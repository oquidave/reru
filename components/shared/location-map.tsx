'use client'

import { useEffect, useRef, useState } from 'react'
import type { Map as LeafletMap, Marker, LayerGroup } from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface MapMarker {
  id: string
  latitude: number
  longitude: number
  label: string
  /** Optional second line in the popup. */
  sublabel?: string
  /** Drives the pin colour; defaults to the brand green. */
  tone?: 'default' | 'success' | 'danger' | 'warning'
}

interface LocationMapProps {
  markers: MapMarker[]
  /** Falls back to the centroid of the markers, then to Nsasa Estate. */
  center?: { latitude: number; longitude: number }
  zoom?: number
  className?: string
  /** When set, clicking the map reports the clicked point — used for pin-drop capture. */
  onPick?: (coords: { latitude: number; longitude: number }) => void
}

/** Nsasa Estate, Mukono District — the service area, used when there is nothing to centre on. */
const FALLBACK_CENTER: [number, number] = [0.3536, 32.7554]

const TONE_COLORS: Record<NonNullable<MapMarker['tone']>, string> = {
  // `default` must not read as `success` — on the collection map it means "nothing
  // scheduled today", which is not the same as "collected".
  default: 'var(--color-text-muted)',
  success: 'var(--color-green-700)',
  danger:  'var(--color-danger)',
  warning: 'var(--color-warning)',
}

export function LocationMap({ markers, center, zoom = 15, className, onPick }: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef       = useRef<LeafletMap | null>(null)
  const layerRef     = useRef<LayerGroup | null>(null)
  const onPickRef    = useRef(onPick)
  const [failed, setFailed] = useState(false)
  const [tilesFailed, setTilesFailed] = useState(false)

  // Keep the latest handler without re-initialising the map on every render.
  useEffect(() => { onPickRef.current = onPick }, [onPick])

  // Initialise once.
  useEffect(() => {
    let cancelled = false
    let map: LeafletMap | null = null
    let tileTimer: ReturnType<typeof setTimeout> | undefined
    let anyTileLoaded = false

    void (async () => {
      try {
        const L = await import('leaflet')
        if (cancelled || !containerRef.current || mapRef.current) return

        map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(FALLBACK_CENTER, zoom)

        const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        })
        // Pins still plot without a basemap, which looks like a rendering bug rather
        // than a network problem — say so instead of showing an empty grey square.
        // On a weak connection tile requests hang rather than failing, so a timeout
        // backs up the error event; either way the notice appears exactly once.
        tileTimer = setTimeout(() => { if (!cancelled && !anyTileLoaded) setTilesFailed(true) }, 8000)
        tiles.on('tileerror', () => { if (!cancelled && !anyTileLoaded) setTilesFailed(true) })
        tiles.on('tileload',  () => {
          anyTileLoaded = true
          if (!cancelled) setTilesFailed(false)
        })
        tiles.addTo(map)

        layerRef.current = L.layerGroup().addTo(map)
        map.on('click', (e) => {
          onPickRef.current?.({ latitude: e.latlng.lat, longitude: e.latlng.lng })
        })

        mapRef.current = map
        // The container is often sized by flex/grid after mount; without this the
        // tile grid renders against a stale size and leaves grey gaps.
        setTimeout(() => map?.invalidateSize(), 0)
      } catch {
        if (!cancelled) setFailed(true)
      }
    })()

    return () => {
      cancelled = true
      clearTimeout(tileTimer)
      mapRef.current?.remove()
      mapRef.current = null
      layerRef.current = null
    }
    // Deliberately mount-only: markers and centre are synced by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync markers.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const L = await import('leaflet')
      if (cancelled || !mapRef.current || !layerRef.current) return

      layerRef.current.clearLayers()

      const placed: Marker[] = []
      for (const m of markers) {
        const color = TONE_COLORS[m.tone ?? 'default']
        const icon = L.divIcon({
          className: '',
          // A div icon avoids Leaflet's default marker PNGs, which resolve to broken
          // bundler-relative paths, and lets pins carry design-system colours.
          html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)"></span>`,
          iconSize:   [18, 18],
          iconAnchor: [9, 9],
        })

        const marker = L.marker([m.latitude, m.longitude], { icon })
        const popup = m.sublabel
          ? `<strong>${escapeHtml(m.label)}</strong><br/>${escapeHtml(m.sublabel)}`
          : `<strong>${escapeHtml(m.label)}</strong>`
        marker.bindPopup(popup)
        marker.addTo(layerRef.current)
        placed.push(marker)
      }

      if (center) {
        mapRef.current.setView([center.latitude, center.longitude], zoom)
      } else if (placed.length === 1 && markers[0]) {
        mapRef.current.setView([markers[0].latitude, markers[0].longitude], zoom)
      } else if (placed.length > 1) {
        mapRef.current.fitBounds(L.featureGroup(placed).getBounds(), { padding: [32, 32], maxZoom: 17 })
      }
    })()
    return () => { cancelled = true }
  }, [markers, center, zoom])

  if (failed) {
    return (
      <div className={className}>
        <div className="h-full w-full flex items-center justify-center bg-green-50 border border-reru-border rounded-xl">
          <p className="reru-body text-reru-text-secondary text-center px-4">
            The map could not be loaded. Coordinates are still saved and shown as numbers.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} className={className} role="application" aria-label="Map of collection locations" />
      {tilesFailed && (
        <p className="text-xs text-reru-text-muted">
          Map imagery could not be loaded, so only the pins are shown. Their positions are still correct.
        </p>
      )}
    </div>
  )
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
