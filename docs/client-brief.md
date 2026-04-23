# RERU — Executive Product Brief
**Bryan** · Confidential · April 2026

---

## The Problem

Nsasa Estate residents have no reliable, organised way to dispose of household waste. Garbage ends up in Nakiyanja River, on roadsides, and in empty plots — creating health hazards and environmental damage for the entire community. There is no system for scheduling pickups, tracking payments, or giving residents any visibility into the service they are paying for.

---

## The Solution

**RERU** (Reusable Resources) is a digital waste collection management platform that brings order, transparency, and accountability to household waste collection in Nsasa Estate. It connects residents directly to the service — letting them register, track their collections, view invoices, and understand where their waste goes — while giving the operations team the tools to run the service efficiently.

---

## The Platform

RERU is a **web application** — it runs in any browser on a phone, tablet, or computer. No app download is required to get started. Residents simply open the website, register, and begin using the service.

---

## What the Platform Includes

### 1. Public Website (Marketing & Registration)
The face of RERU online. Any visitor can:
- Learn what the service offers and how it works
- See pricing plans at a glance
- Register as a new client in under 5 minutes

### 2. Client Portal (For Registered Residents)
Once registered, each client gets a private, secure account where they can:
- **See their next collection date** and how many days away it is
- **Track their full collection history** — which pickups were completed, scheduled, or missed
- **View and download invoices** — with payment instructions included
- **Access their service agreement** at any time
- Receive reminders for upcoming collections and due payments

### 3. Admin Dashboard *(In Development — Next Release)*
A management console for the operations team to run the service day-to-day:
- **Client Management** — view, search, and manage all registered households; suspend or reactivate accounts
- **Collection Recording** — mark daily collections as completed or missed; add notes per visit
- **Zone Planning** — see which clients are due for collection today, grouped by zone
- **Invoice Management** — generate, send, and mark invoices as paid
- **Overdue Tracking** — identify and follow up on late payments; flag accounts for suspension after repeated non-payment

---

## Roadmap — What's Coming Next

| Feature | Details | Timeline |
|---|---|---|
| **Mobile Money Payments** | In-app payment for invoices via MTN MoMo and Airtel Money, powered by [Iotec](https://iotec.io/) — a Ugandan payment provider that supports both networks. KYC and merchant onboarding with Iotec is currently under way. | After onboarding completes |
| **SMS Notifications** | Automated text reminders for upcoming collections and payment due dates | v2 |
| **Android App** | A dedicated mobile app for Android phones (Play Store). Developer account already secured — one-time cost of $25. | v2 |
| **iPhone App** | A dedicated mobile app for Apple devices (App Store). Requires an annual Apple developer licence of $99/year. | v3 |
| **Waste Impact Reports** | Client-facing summary of how much waste they have diverted from landfill — kg recycled, composted, and safely disposed | v3 |

---

## Costs & Investment

| Item | Cost | Notes |
|---|---|---|
| **Domain Name** | $40/year (.co.ug) or $35/year (.com) | A `.co.ug` domain signals a Uganda-based business and is recommended. A `.com` is more universally recognised but good names are harder to find. Decision required from the client. |
| **Hosting & Infrastructure** | ~$25/month (~UGX 90,000) | Covers the web server and database platform (Vercel + Supabase). This scales automatically with the number of users. |
| **Development & Maintenance** | Sweat equity arrangement | Ongoing development, feature releases, bug fixes, and technical maintenance are provided by David Okwii under an agreement to be formalised separately. |
| **Mobile Money Integration** | No platform fee | Iotec charges a per-transaction fee (standard industry practice). No upfront cost to integrate. |
| **Android App** (future) | $25 one-time | Google Play Store developer account already secured. |
| **iPhone App** (future) | $99/year | Apple Developer Programme annual licence required. |

**Estimated annual running cost (Year 1, excluding development):**
- Domain: ~$40
- Hosting: ~$300 ($25 × 12)
- **Total: ~$340/year (~UGX 1,250,000/year)**

---

## Questions for the Client

The following decisions are needed to move forward:

1. **Domain name** — Do you prefer `reru.co.ug` (Ugandan identity, $40/year) or a `.com` variant ($35/year)? Are there other name preferences to consider?

2. **Iotec Mobile Money onboarding** — What is the current status of the KYC documents submitted to Iotec? Is there a point of contact on your side managing that process?

3. **Admin access** — Who on the operations team will use the Admin Dashboard day-to-day? How many people need access, and at what level (full admin vs. data entry only)?

4. **Client onboarding** — When you are ready to go live with the Admin Dashboard, do you have an existing list of registered clients to import, or will all clients register themselves through the website?

5. **Development & Maintenance agreement** — Are you ready to proceed with formalising the sweat equity arrangement with David? If so, what form should that take — a signed letter of agreement, a contract, or another instrument?

6. **Android & iPhone apps** — These are planned for a later phase. Is there a rough timeline or client demand driving urgency on either platform?

7. **Growth ambition — Nsasa Estate only, or broader?** — Is the vision for RERU to serve Nsasa Estate exclusively as your own internal tool, or do you see it eventually becoming a product that other waste collection companies across Uganda (or the region) could licence and use for their own operations? This has significant implications for how the platform is designed and priced going forward.

8. **Field workers — the pickup crew** — Will the garbage collection team (the people on the trucks doing the actual pickups) interact with the system at all? For example, should they be able to mark a collection as completed or flag a missed pickup directly from their phone while in the field? If yes:
   - What devices do they carry? (Basic smartphones, feature phones, or nothing?)
   - Would they be comfortable using a simple mobile app, or is something simpler — like WhatsApp or SMS — more realistic for them?
   - What happens when they are in an area with poor or no internet signal? Does the system need to work offline and sync later?

9. **USSD (short codes like \*123#)** — USSD works on any mobile phone — even basic phones with no internet — and is widely used in Uganda for mobile banking. Should RERU offer a USSD option so that residents can check their next collection date, confirm payments, or register without needing a smartphone or internet access? This would significantly broaden reach but adds development complexity.

10. **WhatsApp notifications** — WhatsApp is widely used across Uganda. Would you prefer that collection reminders and payment alerts are sent via WhatsApp (in addition to or instead of plain SMS)? WhatsApp Business API allows automated messages but requires a verified business number and carries a per-message cost.

11. **Communication preference — SMS vs WhatsApp vs both?** — For client-facing notifications (reminders, receipts, alerts), which channel do you believe your clients are most likely to respond to? Are most of your clients on WhatsApp, or is plain SMS more reliable for your area?

---

*Prepared by David Okwii · April 2026 · For internal review — not for distribution*
