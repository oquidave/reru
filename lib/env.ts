import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL:     z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY:    z.string().min(1),
  SUPABASE_JWT_SECRET:          z.string().min(1),
  NEXT_PUBLIC_BASE_URL:         z.string().url().optional(),
  AFRICAS_TALKING_USERNAME:     z.string().optional(),
  AFRICAS_TALKING_API_KEY:      z.string().optional(),
})

export const env = envSchema.parse(process.env)
