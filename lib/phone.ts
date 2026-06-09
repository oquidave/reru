// Ugandan phone number normalization to E.164 (+2567XXXXXXXX).
// Accepts: 07XXXXXXXX, 7XXXXXXXX, 256XXXXXXXXX, +256XXXXXXXXX (with spaces/dashes).
// All Ugandan mobile numbers are 9 digits after the country code and start with 7.

export function normalizeUgPhone(raw: string): string | null {
  const cleaned = raw.replace(/[^\d+]/g, '')
  let local: string
  if (cleaned.startsWith('+256')) local = cleaned.slice(4)
  else if (cleaned.startsWith('256')) local = cleaned.slice(3)
  else if (cleaned.startsWith('0')) local = cleaned.slice(1)
  else local = cleaned.replace(/^\+/, '')

  if (!/^7\d{8}$/.test(local)) return null
  return `+256${local}`
}

/** True when the input is a valid Ugandan mobile number in any accepted format. */
export function isValidUgPhone(raw: string): boolean {
  return normalizeUgPhone(raw) !== null
}
