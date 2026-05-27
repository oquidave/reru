import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL:     z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY:    z.string().min(1),
  SUPABASE_JWT_SECRET:          z.string().min(1),
  NEXT_PUBLIC_BASE_URL:         z.string().url().optional(),
  AFRICAS_TALKING_USERNAME:     z.string().optional(),
  AFRICAS_TALKING_API_KEY:      z.string().optional(),
  // ioTec Pay (mobile money). Optional so dev/build works before merchant onboarding.
  IOTEC_CLIENT_ID:              z.string().optional(),
  IOTEC_CLIENT_SECRET:          z.string().optional(),
  IOTEC_WALLET_ID:              z.string().optional(),
  IOTEC_AUTH_URL:               z.string().url().default('https://id.iotec.io/connect/token'),
  IOTEC_API_URL:                z.string().url().default('https://pay.iotec.io'),
  // Shared secret ioTec sends as `Authorization: Bearer <value>` on each callback.
  // When set, the webhook rejects calls that don't match.
  IOTEC_WEBHOOK_SECRET:         z.string().optional(),
})

export const env = envSchema.parse(process.env)
