'use client'

import { useCallback, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { Crosshair, MapPin, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { MapMarker } from '@/components/shared/location-map'

// Leaflet touches `window` on import, so it must never run during SSR.
const LocationMap = dynamic(
  () => import('@/components/shared/location-map').then((m) => m.LocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-xl bg-green-50 border border-reru-border flex items-center justify-center">
        <p className="text-sm text-reru-text-secondary">Loading map…</p>
      </div>
    ),
  }
)

export interface Coordinates {
  latitude: number
  longitude: number
  accuracy_m?: number | null
}

interface LocationCaptureProps {
  value: Coordinates | null
  onChange: (value: Coordinates | null) => void
  /** Shown on the map pin. */
  label?: string
  /** Copy tailored to who is capturing. */
  hint?: string
}

export function LocationCapture({ value, onChange, label = 'Pickup point', hint }: LocationCaptureProps) {
  const [locating, setLocating] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const markers: MapMarker[] = useMemo(
    () => (value ? [{ id: 'pin', latitude: value.latitude, longitude: value.longitude, label }] : []),
    [value, label]
  )

  const handlePick = useCallback(
    (coords: { latitude: number; longitude: number }) => {
      setError(null)
      // Match the precision of the GPS path and the numeric(9,6) columns, so the
      // value shown, stored, and re-read are the same number.
      onChange({
        latitude:   Number(coords.latitude.toFixed(6)),
        longitude:  Number(coords.longitude.toFixed(6)),
        accuracy_m: null, // a hand-placed pin has no device accuracy to report
      })
    },
    [onChange]
  )

  function useMyLocation() {
    setError(null)

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('This device or browser does not support location. Drop a pin on the map instead.')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        onChange({
          latitude:   Number(pos.coords.latitude.toFixed(6)),
          longitude:  Number(pos.coords.longitude.toFixed(6)),
          accuracy_m: pos.coords.accuracy ? Number(pos.coords.accuracy.toFixed(1)) : null,
        })
      },
      (err) => {
        setLocating(false)
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was denied. Allow it in your browser settings, or drop a pin on the map.'
            : err.code === err.TIMEOUT
              ? 'Getting your location timed out. Try again outdoors, or drop a pin on the map.'
              : 'Could not get your location. Drop a pin on the map instead.'
        )
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  function updateField(field: 'latitude' | 'longitude', raw: string) {
    const n = Number(raw)
    if (raw.trim() === '' || !Number.isFinite(n)) return
    const next = {
      latitude:   field === 'latitude'  ? n : (value?.latitude  ?? 0),
      longitude:  field === 'longitude' ? n : (value?.longitude ?? 0),
      accuracy_m: null,
    }
    if (next.latitude < -90 || next.latitude > 90 || next.longitude < -180 || next.longitude > 180) return
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>{label}</Label>
        {value && (
          <button
            type="button"
            onClick={() => { onChange(null); setError(null) }}
            className="inline-flex items-center gap-1 text-sm font-medium text-reru-text-muted hover:text-reru-danger transition-colors"
          >
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {hint && <p className="text-sm text-reru-text-secondary">{hint}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={useMyLocation} disabled={locating} className="gap-2">
          <Crosshair size={14} />
          {locating ? 'Getting location…' : 'Use my current location'}
        </Button>
        {value && (
          <span className="inline-flex items-center gap-1.5 text-sm text-reru-text-secondary">
            <MapPin size={14} className="text-green-700" />
            <span className="tabular-nums">{value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}</span>
            {value.accuracy_m != null && (
              <span className="text-reru-text-muted">±{Math.round(value.accuracy_m)} m</span>
            )}
          </span>
        )}
      </div>

      {error && <p className="text-sm text-reru-danger">{error}</p>}

      <LocationMap
        markers={markers}
        center={value ?? undefined}
        zoom={value ? 17 : 14}
        onPick={handlePick}
        className="h-64 w-full rounded-xl border border-reru-border overflow-hidden z-0"
      />
      <p className="text-xs text-reru-text-muted">
        Tap the map to place or move the pin. Leave it empty if you would rather not share a location.
      </p>

      {/* Manual entry — a fallback when GPS is unavailable and coordinates are known. */}
      <details className="text-sm">
        <summary className="cursor-pointer text-reru-text-secondary hover:text-reru-text-primary transition-colors">
          Enter coordinates manually
        </summary>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="space-y-1.5">
            <Label htmlFor="latitude" className="text-xs">Latitude</Label>
            <Input
              id="latitude"
              inputMode="decimal"
              defaultValue={value?.latitude ?? ''}
              onBlur={(e) => updateField('latitude', e.target.value)}
              placeholder="0.353600"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="longitude" className="text-xs">Longitude</Label>
            <Input
              id="longitude"
              inputMode="decimal"
              defaultValue={value?.longitude ?? ''}
              onBlur={(e) => updateField('longitude', e.target.value)}
              placeholder="32.755400"
            />
          </div>
        </div>
      </details>
    </div>
  )
}
