'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LocationCapture, type Coordinates } from '@/components/shared/location-capture'
import { Button } from '@/components/ui/button'

interface AdminClientLocationCardProps {
  clientId: string
  clientName: string
  initial: Coordinates | null
  capturedAt: string | null
}

export function AdminClientLocationCard({ clientId, clientName, initial, capturedAt }: AdminClientLocationCardProps) {
  const router = useRouter()
  const [coords, setCoords] = useState<Coordinates | null>(initial)
  const [saving, setSaving] = useState(false)

  const dirty =
    coords?.latitude !== initial?.latitude || coords?.longitude !== initial?.longitude

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          latitude:            coords?.latitude ?? null,
          longitude:           coords?.longitude ?? null,
          location_accuracy_m: coords?.accuracy_m ?? null,
        }),
      })
      const json = await res.json().catch(() => null) as { ok: boolean; error?: string } | null
      if (!json || !json.ok) {
        toast.error(json?.error ?? 'Failed to save the location. Please try again.')
        return
      }
      toast.success(coords ? 'Pickup location saved' : 'Pickup location cleared')
      router.refresh()
    } catch {
      toast.error('Could not reach the server. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-reru-border rounded-xl shadow-card p-6 mb-8">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="reru-card-title text-reru-text-primary">Pickup location</h2>
          <p className="text-sm text-reru-text-secondary mt-0.5">
            {initial
              ? capturedAt
                ? `Last updated ${new Date(capturedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                : 'A location is saved for this client'
              : 'No location saved yet — drop a pin so the crew can find this household'}
          </p>
        </div>
        {dirty && (
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save location'}
          </Button>
        )}
      </div>

      <LocationCapture
        value={coords}
        onChange={setCoords}
        label={clientName}
        hint="Use the device location when standing at the gate, or tap the map to place the pin by hand."
      />
    </div>
  )
}
