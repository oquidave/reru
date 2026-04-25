# Product Requirements Document: RERU

**Version:** 1.1  
**Date:** 2026-04-23  
**Owner:** Brian Twesigye, Mukono Countryside Mixed Farm Ltd

---

## 1. Overview

### Problem Statement
Nsasa Estate residents in Mukono District, Uganda lack a reliable, organized waste collection service with transparent billing, collection tracking, and proper waste sorting guidance. Improper waste disposal leads to environmental degradation and public health risks in the community.

### Product Vision
RERU is a household waste collection and recycling service management platform that connects residents of Nsasa Estate to a regular, eco-conscious garbage collection service. The platform manages the full waste lifecycle — from client registration and collection scheduling through to composting and certified recycling — while giving clients full visibility into their service status, payment history, and environmental impact.

### Product Summary
- **Product Name:** RERU (Reusable Resources)
- **Operator:** Mukono Countryside Mixed Farm Ltd
- **Service Area:** Nsasa Estate, Mukono District, Uganda
- **Deployment:** Web application (mobile-responsive), live at [reru.odukar.com](https://reru.odukar.com)
- **Current State:** Production — Next.js 15 app with Supabase backend, deployed on Vercel

---

## 2. Target Users

### Primary: Registered Clients
Households in Nsasa Estate who subscribe to weekly waste collection.
- Need to track their next collection date and history
- Need to view and pay invoices
- Need guidance on waste sorting (color-coded bags)

### Secondary: Service Operations Staff (Admin)
Staff responsible for scheduling collections, managing client accounts, and tracking payments.
- Need to view all client accounts and their statuses
- Need to record completed/missed collections
- Need to generate, send, and manage invoices
- Need zone-level visibility of daily collection workload

---

## 3. Goals & Success Metrics

| Goal | Metric | Target (Year 1) |
|---|---|---|
| Client acquisition | Registered households | 200+ |
| Payment compliance | % invoices paid on time | ≥ 85% |
| Service reliability | % scheduled collections completed | ≥ 95% |
| Client retention | Annual plan renewal rate | ≥ 70% |
| Platform adoption | % clients using the app monthly | ≥ 60% |

---

## 4. Live Features (v1 — Production)

All features below are built and deployed. The Supabase backend is live with real data — there is no mock data layer.

### 4.1 Landing / Marketing Page
- Hero section with problem statement, service description, and CTA buttons (Register / Login)
- Four service pillars: Waste Collection, Composting, Recycling, Safe Disposal
- "How It Works" four-step onboarding: Register → Get Bags → Set Out Waste → We Collect
- Pricing plans display (Monthly vs. Annual)
- Contact information

### 4.2 Authentication
- **Login:** Phone number + 4-digit PIN via Supabase Auth
- **Registration (3-step wizard):**
  - Step 1: Full name and phone number
  - Step 2: Home address, zone selection (Zone A / B / C), preferred collection day (Mon–Fri)
  - Step 3: Plan selection (Monthly / Annual) and service agreement acceptance
- Protected routes enforced via Next.js middleware (unauthenticated users redirected to `/login`)

### 4.3 Client Dashboard (`/dashboard`)
- Next collection date with countdown (days remaining)
- Quick stats: Plan type, Account status, Paid-through date, Collection day
- Recent collections list (last 4) with status badges (Completed / Scheduled / Missed)
- Quick actions: View Invoices, View Service Agreement
- Payment reminder banner (amount due, due date)

### 4.4 Collections Page (`/dashboard/collections`)
- Summary cards: Total Completed / Scheduled / Missed counts
- Full chronological collection log with date, status, and notes

### 4.5 Invoices Page (`/dashboard/invoices`)
- Invoice list: ID, date, plan, amount, payment status
- Invoice detail view (`/dashboard/invoices/[id]`):
  - Billed-to and service provider details
  - Itemized table (Description, Qty, Unit Price, Amount)
  - Subtotal, 6% tax, Total
  - Payment instructions (Mobile Money, Bank Transfer, Cash)
  - Print / PDF download (jsPDF, client-side generation)

### 4.6 Service Agreement Page (`/dashboard/agreement`)
- Full legal contract terms (6 sections)
- Active status badge
- Signature blocks for both parties

### 4.7 App Shell
- Sidebar navigation (Desktop): Home, Collections, Invoices, Agreement
- Mobile-responsive sheet navigation (hamburger overlay)
- Client user card: name, zone, initials avatar
- Sign-out button

---

## 5. In Progress — Admin Dashboard (v1.5, Current Priority)

The admin dashboard is the next feature to be built. It will be a protected section of the same Next.js app under `/dashboard/admin/*`, accessible only to users with `admin` or `superadmin` roles.

### 5.1 Client Management
- View all registered clients with search, filter by zone, filter by plan, filter by status
- View individual client profile: contact info, plan, payment history, collection history
- Edit client details (address, zone, collection day, plan)
- Suspend / reactivate accounts (with reason recorded in audit log)

### 5.2 Collection Management
- Daily view: all clients due for collection today, grouped by zone
- Mark individual collections as Completed or Missed
- Add notes to a collection record (e.g., "client unavailable", "gate locked")
- Bulk-schedule collections for the next billing period

### 5.3 Invoice Management
- Generate invoices for individual clients or in bulk (all active clients)
- Mark invoices as Paid (with payment method and reference recorded)
- View overdue invoices and send payment reminders
- Download / print individual invoices

### 5.4 Payment & Overdue Tracking
- Dashboard view of payment compliance (% paid on time, overdue counts)
- Flag accounts with 3+ consecutive missed payments for suspension
- Export payment report as CSV

### 5.5 Zone-Level Operational View
- Map or list of which clients are in each zone
- Today's collection schedule grouped by zone
- Collector assignment per zone (v2)

---

## 6. Upcoming Features (v2)

### 6.0 Additional Client Interfaces

The API-first architecture means RERU's backend already supports non-web clients without changes. Planned client interfaces:

| Client | Access Method | Priority |
|---|---|---|
| **USSD** | `POST /api/auth/login` + `/api/user/dashboard` via Africa's Talking USSD gateway | High — reaches non-smartphone users |
| **Android app** | Bearer token auth + `/api/user/*` REST endpoints | Medium |
| **iOS app** | Bearer token auth + `/api/user/*` REST endpoints | Medium |
| **Desktop app** | Cookie-based or Bearer token auth + full API surface | Low |

USSD is the highest-priority non-web interface: it reaches residents without smartphones and requires only the `/api/user/dashboard` endpoint (single round-trip within the 180-second USSD session timeout).

### 6.1 Real-Time SMS Notifications
- Collection reminders sent the day before via Africa's Talking API
- Payment due reminders (sent on the 8th of each month)
- Collection confirmation SMS after each completed pickup

### 6.2 Mobile Money Payment Integration
- MTN MoMo API and Airtel Money API integration
- Automated payment confirmation and receipt generation
- Invoice auto-generation at the start of each billing period
- Service suspension trigger after 3 consecutive missed payments (automated)

### 6.3 Waste Tracking & Environmental Impact
- Record bag counts per collection (Organic, Plastic, Glass, Paper)
- Chain-of-custody log from pickup → sorting → disposal/recycling facility
- Client-facing environmental summary (e.g., kg diverted from landfill, CO₂ offset estimate)

### 6.4 In-App Notifications
- Notification bell with unread count
- Notification history (collection reminders, payment reminders, status changes)

### 6.5 GPS / Route Optimization
- Collection route planning for field staff
- Live ETA push notifications to clients on collection day

---

## 7. Data Models

All types are defined in `types/index.ts`. IDs are UUIDs (Supabase default).

### Client
| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | FK to Supabase `auth.users` |
| name | string | Full name |
| phone | string | Used as login identifier |
| address | string | Home address |
| zone | enum | `Zone A`, `Zone B`, `Zone C` |
| collection_day | enum | `Monday`–`Friday` |
| plan | enum | `monthly`, `annual` |
| status | enum | `active`, `suspended`, `cancelled` |
| paid_through | date | Last paid billing period end date (nullable) |
| created_at | timestamp | |

> Note: PIN is managed by Supabase Auth — not stored in the `clients` table.

### Invoice
| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| client_id | uuid | FK to `clients` |
| date | date | Invoice issue date |
| plan | string | Plan at time of invoice |
| qty | integer | Months covered |
| unit_price | integer | UGX |
| subtotal | integer | UGX |
| tax | integer | 6% of subtotal, UGX |
| total | integer | UGX |
| status | enum | `pending`, `paid`, `overdue` |
| paid_at | timestamp | Nullable |
| created_at | timestamp | |

### Collection
| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| client_id | uuid | FK to `clients` |
| scheduled_date | date | |
| status | enum | `scheduled`, `completed`, `missed` |
| bags_collected | integer | Nullable — filled on completion |
| notes | string | Nullable |
| recorded_by | uuid | FK to admin user (nullable) |
| completed_at | timestamp | Nullable |
| created_at | timestamp | |

---

## 8. Tech Stack

### Current (Production)

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| UI Library | React 19 |
| Styling | Tailwind CSS 3 |
| UI Components | Radix UI primitives (via Shadcn/UI pattern) |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| Toasts | Sonner |
| PDF Generation | jsPDF + jsPDF-autotable (client-side) |
| Date Utilities | date-fns |
| Backend / Database | Supabase (PostgreSQL, Auth, Storage) |
| Supabase Client | `@supabase/ssr` + `@supabase/supabase-js` |
| Package Manager | pnpm |
| Hosting | Vercel |

### Key Architectural Decisions

- **App Router (Next.js 15)**: All pages use the App Router with server and client components.
- **Multi-client API-first architecture**: The Next.js app serves as both the web interface and the backend API. All client data is exposed through a stable REST API surface (`app/api/**`) that any client — web, mobile, USSD, or desktop — can consume. Server components in the web app may read Supabase directly for optimal SSR performance, but all mutations and all external client access go through API routes.
- **Client API surface** (`/api/user/*`): A complete set of authenticated endpoints for non-web clients (USSD gateway, Android/iOS apps, desktop app):
  - `POST /api/auth/login` — returns session tokens (cookie-based for web, Bearer token for mobile/USSD)
  - `POST /api/auth/logout`
  - `GET /api/user/me` — profile + client record
  - `GET /api/user/dashboard` — aggregated dashboard data in one call (optimised for USSD 180s session limit)
  - `GET /api/user/collections` — collection history with pagination and status filter
  - `GET /api/user/collections/upcoming` — next N scheduled collections
  - `GET /api/user/invoices` — invoice list with status filter
  - `GET /api/user/invoices/[id]` — invoice detail
- **Supabase SSR**: Auth session is managed server-side using `@supabase/ssr`, with middleware refreshing the session on every request. Non-web clients authenticate via Bearer token (`Authorization: Bearer <access_token>` from the login response).
- **RLS everywhere**: Row Level Security is enabled on all user-data tables; application code never bypasses it.

---

## 9. Business Model

| Plan | Price | Notes |
|---|---|---|
| Monthly | UGX 25,000 / month | Flexible, cancel anytime |
| Annual | UGX 240,000 / year | Saves UGX 60,000 vs. monthly |

**Payment Methods (current — manual):**
- Mobile Money: 0778527802 (MTN MoMo), 0704132691 (Airtel Money)
- Bank Transfer: Bank of Africa, A/C 06566780001
- Cash (in person)

**Billing Terms:**
- Payment due by the 10th of each month
- Service suspended after 3 consecutive missed payments
- 3 months written notice required for termination
- Contract duration: 5 years, renewable by mutual consent

---

## 10. Geographic & Operational Scope

- **Service Area:** Nsasa Estate, Mukono District, Uganda
- **Zones:** Zone A, Zone B, Zone C (within the estate)
- **Collection Frequency:** Weekly (client selects preferred weekday at registration)
- **Waste Categories:** Organic (Black Soldier Fly / earthworm composting), Plastic, Glass, Paper
- **Disposal Facilities:** Katikolo (Mukono), Buyala (Kampala)
- **Recycling:** Certified third-party recycling facilities

---

## 11. Non-Functional Requirements

| Requirement | Detail |
|---|---|
| Mobile Responsiveness | Full functionality on screens 320px and wider; mobile breakpoint at 700px |
| Browser Support | Modern browsers (Chrome, Firefox, Safari, Edge — last 2 major versions) |
| Performance | Initial page load < 3s on 3G connection |
| Accessibility | WCAG 2.1 AA — sufficient color contrast, keyboard navigability, semantic HTML |
| Availability | 99.5% uptime (Vercel + Supabase SLAs) |
| Data Privacy | Client PII stored in Supabase (AWS us-east-1); no third-party data sharing without consent |
| Localization | UGX currency (`UGX X,XXX` format), `22 Apr 2026` date format, English (Uganda) |
| Security | RLS on all tables, bcrypt PIN hashing, HTTP security headers, rate limiting on auth endpoints |

---

## 12. Out of Scope (v1)

- Multi-estate or multi-city expansion
- Commercial / business client management (households only)
- Waste bin / IoT sensor integration
- Native mobile app builds (iOS / Android) — the API foundation is in place; building the app clients is v2
- USSD client implementation — the API foundation is in place; the USSD gateway integration is v2
- Multi-language support
- Carbon credit marketplace
- Third-party recycling partner portal

---

## 13. Open Questions

1. Which Mobile Money API should be integrated first — MTN MoMo, Airtel Money, or both simultaneously?
2. Should the admin dashboard support multiple field collectors with individual assignments, or is a single admin view sufficient for now?
3. Is there a target client count to onboard before the admin dashboard needs to be live?
4. Should invoice PDF generation remain client-side (jsPDF) or move to server-side for better fidelity?
