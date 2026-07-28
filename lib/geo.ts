import { z } from 'zod'

/**
 * Coordinate fields shared by every endpoint that accepts a pickup pin.
 *
 * All three are nullable so a caller can clear a previously saved pin by sending
 * nulls; omitting them entirely leaves the stored pin untouched.
 */
export const coordinateFields = {
  latitude:            z.number().min(-90).max(90).nullable().optional(),
  longitude:           z.number().min(-180).max(180).nullable().optional(),
  location_accuracy_m: z.number().min(0).max(100000).nullable().optional(),
}

export type CoordinateInput = {
  latitude?: number | null
  longitude?: number | null
  location_accuracy_m?: number | null
}

export type CoordinateUpdate = {
  latitude: number | null
  longitude: number | null
  location_accuracy_m: number | null
  location_captured_at: string | null
}

/**
 * Turn parsed coordinate input into the columns to write, or `null` when the
 * caller said nothing about location and the stored pin should be left alone.
 *
 * A pin is only accepted as a pair — the database enforces the same rule — so a
 * lone latitude or longitude is treated as clearing the pin rather than as a
 * half-written coordinate.
 */
export function coordinateUpdate(input: CoordinateInput): CoordinateUpdate | null {
  const mentionsLocation =
    input.latitude !== undefined || input.longitude !== undefined
  if (!mentionsLocation) return null

  const hasPair = typeof input.latitude === 'number' && typeof input.longitude === 'number'
  if (!hasPair) {
    return { latitude: null, longitude: null, location_accuracy_m: null, location_captured_at: null }
  }

  return {
    latitude:             input.latitude as number,
    longitude:            input.longitude as number,
    location_accuracy_m:  input.location_accuracy_m ?? null,
    location_captured_at: new Date().toISOString(),
  }
}
