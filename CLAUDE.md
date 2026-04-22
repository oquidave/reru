# Reru — Project Instructions

## Backend: Supabase

This project uses [Supabase](https://supabase.com) as the backend (database, auth, storage).

- **Project URL:** `https://crjgohirzgkxatywuvoz.supabase.co`
- **Project ID:** `crjgohirzgkxatywuvoz`
- **Region:** AWS us-east-1

All credentials (API keys, DB connection strings, secrets) are in `.env.local`. Never hardcode them — always read from environment variables.

Key variables in `.env.local`:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (client-safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key (client-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only, never expose to client) |
| `SUPABASE_JWT_SECRET` | JWT secret for token verification |
| `POSTGRES_URL` | Pooled Postgres connection string |
| `POSTGRES_URL_NON_POOLING` | Direct Postgres connection (for migrations) |

## Database Operations

Use the **Supabase MCP server** for all database operations (schema changes, migrations, queries, inspecting tables). It is available in this Claude Code session — prefer it over writing raw SQL or shell psql commands.

Examples of what to use the MCP server for:
- Listing and inspecting tables
- Running migrations
- Querying data for debugging
- Creating or modifying RLS policies
- Managing storage buckets

## Design System

Always follow the design system in `docs/design-system/` when writing any app components or UI code.

- **Tokens:** Use CSS custom properties from `colors_and_type.css` for all colors, typography, spacing, shadows, and border radii. Never hardcode raw values.
- **Components:** Reference `preview/` pages for expected appearance and variants of buttons, forms, cards, badges, and navigation.
- **Guidelines:** Follow the principles in `README.md` for tone, iconography, and visual style.

When in doubt, check the design system before inventing new styles.

## Development Guidelines

- Use the Supabase client library (`@supabase/supabase-js`) for all database/auth/storage interactions in application code.
- Use the **anon key** on the client side; use the **service role key** only in server-side code (API routes, server actions).
- Row Level Security (RLS) should be enabled on all user-data tables.
- Prefer Supabase Auth for authentication flows.
