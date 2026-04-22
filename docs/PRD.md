# Product Requirements Document: RERU

**Version:** 1.0  
**Date:** 2026-04-22  
**Owner:** Brian Twesigye, Mukono Countryside Mixed Farm Ltd

---

## 1. Overview

### Problem Statement
Nsasa Estate residents in Mukono District, Uganda lack a reliable, organized waste collection service with transparent billing, collection tracking, and proper waste sorting guidance. Improper waste disposal leads to environmental degradation and public health risks.

### Product Vision
RERU is a household waste collection and recycling service management platform that connects residents of Nsasa Estate to a regular, eco-conscious garbage collection service. The platform manages the full waste lifecycle — from client registration and collection scheduling through to composting and certified recycling — while giving clients full visibility into their service status, payment history, and environmental impact.

### Product Summary
- **Product Name:** RERU (Reusable Resources)
- **Operator:** Mukono Countryside Mixed Farm Ltd
- **Service Area:** Nsasa Estate, Mukono District, Uganda
- **Deployment:** Web application (mobile-responsive)
- **Current State:** Frontend MVP (single-page React app with mock data, no backend)

---

## 2. Target Users

### Primary: Registered Clients
Households in Nsasa Estate who subscribe to weekly waste collection.
- Need to track their next collection date and history
- Need to view and pay invoices
- Need guidance on waste sorting

### Secondary: Service Operations Staff (Admin)
Staff responsible for scheduling collections, managing client accounts, and tracking payments.
- Need to view all client accounts and statuses
- Need to record completed/missed collections
- Need to generate and send invoices

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

## 4. Current MVP Features

### 4.1 Landing / Marketing Page
- Hero section with service description and CTA buttons (Register / Login)
- Four service pillars: Waste Collection, Composting, Recycling, Safe Disposal
- "How It Works" four-step onboarding flow: Register → Get Bags → Set Out Waste → We Collect
- Pricing plans display (Monthly vs. Annual)
- Contact information and social links

### 4.2 Authentication
- **Login:** Phone number + 4-digit PIN
- **Registration (3-step wizard):**
  - Step 1: Full name and phone number
  - Step 2: Home address, zone selection (Zone A / B / C), preferred collection day (Mon–Fri)
  - Step 3: Plan selection (Monthly / Annual) and service agreement acceptance

### 4.3 Client Dashboard
- Next collection date with countdown (days remaining)
- Quick stats: Plan type, Account status, Paid-through date, Collection day
- Recent collections list (last 4) with status badges (Completed / Scheduled / Missed)
- Quick actions: View Invoices, View Service Agreement
- Payment reminder banner (amount due, due date)

### 4.4 Collections Page
- Summary cards: Total Completed / Scheduled / Missed counts
- Full chronological collection log with date, status, and notes

### 4.5 Invoices Page
- Invoice list: ID, date, plan, amount, payment status
- Invoice detail view (PDF-style):
  - Billed-to and service provider details
  - Itemized table (Description, Qty, Unit Price, Amount)
  - Subtotal, 6% tax, Total
  - Payment instructions (Mobile Money, Bank Transfer, Cash)
  - Download PDF button (placeholder)

### 4.6 Service Agreement Page
- Full legal contract terms (6 sections)
- Active status badge
- Signature blocks for both parties

### 4.7 App Shell
- Sidebar navigation (Desktop): Home, Collections, Invoices, Agreement
- Mobile-responsive hamburger menu (full-screen overlay)
- Client user card: name, zone, initials avatar
- Sign-out button

---

## 5. Feature Requirements (Upcoming / v2)

### 5.1 Backend & Database
- REST API or GraphQL server for all client, collection, and invoice data
- Persistent database (PostgreSQL recommended)
- Secure session management (JWT or server-side sessions)
- Role-based access control (Client, Admin, Superadmin)

### 5.2 Real Authentication
- Phone number OTP verification at registration
- Secure PIN hashing (bcrypt)
- Password reset via SMS OTP
- Session expiry and refresh token support

### 5.3 Payment Integration
- Mobile Money API integration (MTN MoMo, Airtel Money)
- Automated payment confirmation and receipt generation
- Invoice auto-generation at the start of each billing period
- Overdue reminders (SMS + in-app)
- Service suspension after 3 consecutive missed payments (automated flag)

### 5.4 Notifications
- SMS alerts: collection reminders (day before), payment due reminders, collection confirmations
- In-app notification bell with unread count
- Email receipts for invoice payment

### 5.5 PDF Invoice Generation
- Server-side PDF generation for invoices
- Download and email delivery

### 5.6 Admin Dashboard
- Client management (view, edit, suspend, activate accounts)
- Collection scheduling and recording (bulk and per-client)
- Invoice management (generate, mark paid, send)
- Payment tracking and overdue reports
- Zone-level operational view (which clients are due for collection today)

### 5.7 Waste Tracking
- Record bag counts per collection (organic, plastic, glass, paper)
- Chain-of-custody log from pickup → sorting → facility
- Client-facing environmental impact summary (e.g., kg recycled, CO₂ offset)

### 5.8 GPS / Route Optimization (Future)
- Collection route planning for field staff
- Live ETA notifications to clients on collection day

---

## 6. Data Models

### Client
| Field | Type | Notes |
|---|---|---|
| id | integer | Primary key |
| name | string | Full name |
| phone | string | Used as login identifier |
| pin_hash | string | Hashed 4-digit PIN |
| address | string | Home address |
| zone | enum | Zone A, Zone B, Zone C |
| collection_day | enum | Monday–Friday |
| plan | enum | monthly, annual |
| status | enum | active, suspended, cancelled |
| paid_through | date | Last paid billing period end |
| created_at | timestamp | |

### Invoice
| Field | Type | Notes |
|---|---|---|
| id | string | e.g., INV-01234 |
| client_id | integer | FK to Client |
| date | date | Invoice issue date |
| plan | enum | monthly, annual |
| qty | integer | Months covered |
| unit_price | integer | UGX |
| subtotal | integer | UGX |
| tax | integer | 6% of subtotal |
| total | integer | UGX |
| status | enum | pending, paid, overdue |
| paid_at | timestamp | Nullable |

### Collection
| Field | Type | Notes |
|---|---|---|
| id | integer | Primary key |
| client_id | integer | FK to Client |
| scheduled_date | date | |
| status | enum | scheduled, completed, missed |
| bags_collected | integer | Nullable (on completion) |
| notes | string | Nullable |
| recorded_by | integer | FK to Admin user |
| completed_at | timestamp | Nullable |

---

## 7. Tech Stack

### Current (MVP)
| Layer | Technology |
|---|---|
| UI | React 18 (UMD, browser-loaded) |
| Styling | Custom CSS (OKLCH color space) |
| JSX Compilation | Babel Standalone (in-browser) |
| Data | Hardcoded mock data in JS |
| Hosting | Static file server |

### Recommended (Production)
| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite (bundled, code-split) |
| Styling | Tailwind CSS or existing design system extracted to CSS modules |
| Backend | Node.js (Express) or Python (FastAPI) |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| SMS | Africa's Talking API (Uganda coverage) |
| Payments | MTN MoMo API / Airtel Money API |
| PDF | Puppeteer or WeasyPrint (server-side) |
| Hosting | VPS or managed cloud (e.g., DigitalOcean, Render) |

---

## 8. Business Model

| Plan | Price | Notes |
|---|---|---|
| Monthly | UGX 25,000 / month | Flexible, cancel anytime |
| Annual | UGX 240,000 / year | Saves UGX 60,000 vs. monthly |

**Payment Methods:**
- Mobile Money: 0778527802 (MTN), 0704132691 (Airtel)
- Bank Transfer: Bank of Africa, A/C 06566780001
- Cash (in person)

**Billing Terms:**
- Payment due by the 10th of each month
- Service suspended after 3 consecutive missed payments
- 3 months notice required for termination
- Contract duration: 5 years, renewable by mutual consent

---

## 9. Geographic & Operational Scope

- **Service Area:** Nsasa Estate, Mukono District, Uganda
- **Zones:** Zone A, Zone B, Zone C (within the estate)
- **Collection Frequency:** Weekly (client selects preferred weekday)
- **Waste Categories:** Organic (Black Soldier Fly / earthworm composting), Plastic, Glass, Paper
- **Disposal Facilities:** Katikolo (Mukono), Buyala (Kampala)
- **Recycling:** Certified third-party recycling facilities

---

## 10. Non-Functional Requirements

| Requirement | Detail |
|---|---|
| Mobile Responsiveness | Full functionality on screens 320px and wider |
| Browser Support | Modern browsers (Chrome, Firefox, Safari, Edge — last 2 major versions) |
| Performance | Initial page load < 3s on 3G connection |
| Accessibility | WCAG 2.1 AA — sufficient color contrast, keyboard navigability, semantic HTML |
| Availability | 99.5% uptime target |
| Data Privacy | Client PII stored securely; no third-party data sharing without consent |
| Localization | UGX currency, dd-MMM-YYYY date format, English (Uganda) |

---

## 11. Out of Scope (v1)

- Multi-estate or multi-city expansion
- Commercial/business client management
- Waste bin / IoT sensor integration
- Native mobile app (iOS / Android)
- Multi-language support
- Carbon credit marketplace
- Third-party recycling partner portal

---

## 12. Open Questions

1. What backend hosting environment is available / preferred?
2. Which Mobile Money API provider should be prioritized (MTN MoMo, Airtel, or both)?
3. Should the admin dashboard be a separate app or a protected route within the existing client app?
4. Is there an existing staff headcount for field operations that the scheduling feature needs to account for?
5. What is the target go-live date for the backend-integrated version?
