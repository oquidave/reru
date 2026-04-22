# RERU Design System

**Reusable Resources (RERU)** — waste collection and management startup serving Nsasa Estate, Mukono District, Kampala, Uganda. Part of Mukono Countryside Mixed Farm Ltd.

## Sources
- Prototype app: `reru-app/index.html` + `reru-app/components/`
- Service agreement PDF: `uploads/SERVICE AGREEMENT FOR HOUSEHOLD GARBAGE COLLECTION-final.pdf`
- Invoice PDF: `uploads/Reusable Resources-1.pdf`
- Flyer: `uploads/WhatsApp Image 2026-04-20 at 09.30.48.jpeg`

No external Figma link or production codebase was provided. This design system is derived from the MVP prototype.

---

## Product Context

RERU is a B2C waste collection SaaS for households and small businesses in peri-urban Uganda. It has two surfaces:

1. **Marketing / Landing page** — public-facing, drives household registrations
2. **Client Web App** — authenticated portal for registered clients: dashboard, collections log, invoices, service agreement

**Business model:** Monthly (UGX 25,000) or Annual (UGX 240,000) subscription. Payments via MTN Mobile Money, Bank of Africa transfer, or cash.

---

## Content Fundamentals

**Tone:** Warm, direct, community-focused. RERU speaks like a trusted neighbour, not a corporate entity. It acknowledges the local problem (waste in Nakiyanja River, roadsides, empty plots) directly, without shame.

**Voice examples:**
- "Tired of waste dumped in Nakiyanja River, road sides and empty plots?"
- "A Cleaner Community Starts Here."
- "Good morning, Stephen 👋"
- "Place bags at your gate by 8:00 AM"
- "We Collect. You Track."

**Rules:**
- Sentence case for body text and UI labels. ALL CAPS only for section overline pills and table headers.
- Second-person "you / your" throughout.
- Currency always written as `UGX X,XXX` — never "Shs" or "USh".
- Dates use Ugandan format: `22 Apr 2026` (day first, month abbreviated).
- Addresses written in full: Plot, Estate, Sub-county, District.
- No bullet-heavy copy in marketing. Use short, punchy phrases separated by em-dashes or line breaks.
- Emoji: used sparingly — only in greeting contexts (👋) and waste-bag sorting guides. Never in UI chrome.

---

## Visual Foundations

### Colors
Forest green is the primary hue. All greens are defined in OKLCH at hue 145, keeping perceptual consistency across the scale. No blue-greens; no yellow-greens.

- **Brand primary:** `green700` — used for primary buttons, active nav, headings on light
- **Hero / dark surfaces:** `green900` — sidebar, hero, footer
- **Tints:** `green100` / `green50` — icon wells, card backgrounds, section alternates
- **Accent:** `oklch(68% 0.16 160)` — teal-adjacent; "Best Value" badges, highlight tags only
- **Danger:** `oklch(52% 0.18 25)` — errors, missed collection status
- **Warning:** `oklch(72% 0.16 75)` — pending payment status

### Typography
- **Font:** [Outfit](https://fonts.google.com/specimen/Outfit) (Google Fonts) — weights 400, 500, 600, 700, 800
- **Display headings:** 800 weight, `letter-spacing: -0.03em`, `text-wrap: balance`
- **Section headings:** 800, `-0.02em`
- **Card titles / list items:** 700, no letter-spacing
- **Body / descriptions:** 400–500, `line-height: 1.6–1.7`
- **Labels / overlines:** 600–700, `text-transform: uppercase`, `letter-spacing: 0.06–0.08em`, `font-size: 11–13px`
- **Minimum font size:** 12px (hint/caption). UI chrome never below 13px.

### Spacing
Base unit: **4px**. All spacing values are multiples of 4.
Common values: 4, 8, 10, 12, 14, 16, 20, 24, 28, 32, 36, 48, 64, 72, 80px

### Corner Radii
- Buttons: `10px`
- Input fields: `10px`
- Cards (default): `16px`
- Cards (large/hero): `20px`
- Icon wells: `8–12px` (smaller wells use 8px, larger use 12px)
- Avatars / step circles: `50%` (full circle)
- Pills / badges: `99px`
- Sidebar nav items: `10px`

### Shadows
- **Default card:** `0 1px 4px rgba(0,0,0,0.04)` — almost invisible; relies on border
- **Hover card:** `0 4px 20px rgba(0,80,0,0.08)` — green-tinted elevation
- **Elevated card (pricing):** `0 8px 40px rgba(0,80,0,0.18)`
- No heavy drop shadows. Depth is expressed through border-color darkening, not shadow stacking.

### Borders
- All borders: `1.5px solid` — not 1px. This is intentional for a slightly weightier feel on mobile.
- Default border color: `oklch(90% 0.03 145)` — very light warm green-grey
- Hover/focus borders: escalate to `green200` or `green500`
- Dividers inside cards: `1px solid` border (thinner than outer border)

### Backgrounds
- **Page background:** `oklch(97% 0.01 145)` — off-white with faint green tint
- **Card/surface:** `#ffffff`
- **Section alt:** `green50` — for "How it works" zebra sections
- **Hero / dark sections:** `linear-gradient(135deg, green900, green700, green500)` — left-to-right diagonal
- No background images. No textures. No patterns.
- Decorative circles: `rgba(255,255,255,0.04)` on dark backgrounds only — subtle, large (200–320px), positioned off-edge

### Hover & Interaction States
- **Primary button:** `green700 → green600` on hover (color shift, no scale)
- **Ghost / outline button:** transparent → `green50` background
- **Card (hover=true):** border escalates to `green200`, shadow lifts to green-tinted
- **List rows:** `transparent → green50` background on hover
- **Transitions:** `all 0.15s ease` — quick, no bounce, no spring
- **Focused inputs:** border → `green500`, background → `#ffffff`

### Navigation (App)
- Left sidebar, 220px wide, `green900` background
- Active item: `rgba(255,255,255,0.12)` background, white text + icon
- Inactive: `rgba(255,255,255,0.55)` text, `rgba(255,255,255,0.5)` icon
- User card at bottom of sidebar: `rgba(255,255,255,0.06)` background
- Mobile: top bar replaces sidebar, with full-screen overlay nav on toggle

### Iconography
See ICONOGRAPHY section below.

### Animation
- No page transitions, no slide animations
- State changes: `transition: all 0.15s ease` only
- No bounce, spring or entrance animations in MVP

---

## Iconography

**System:** Custom SVG inline icons, Lucide-style (stroke-based, 24×24 viewBox, `strokeLinecap: round`, `strokeLinejoin: round`).

**Style:** Stroke only — no fills. `strokeWidth: 1.8` default, `2.0–2.5` for emphasis (check marks, active states).

**Color:** Always `currentColor` so they inherit from parent. Override explicitly when needed (e.g. icon wells use `green600`).

**Icon wells:** Small container divs with `green100` background and explicit `border-radius`. Size: 34–44px depending on context.

**Icon set used in RERU prototype:**

| Name | Usage |
|------|-------|
| `home` | Dashboard nav |
| `truck` | Collections nav, waste collection service |
| `invoice` / `doc` | Invoices nav, agreement nav |
| `recycle` | Logo, recycling service |
| `leaf` | Composting service |
| `trash` | Disposal service |
| `calendar` | Collection date stat card |
| `user` | Profile / auth |
| `phone` | Contact, phone input |
| `mail` | Email contact |
| `map` | Location pill |
| `check` | Success state, feature lists |
| `chevronRight` / `chevronLeft` | Navigation |
| `bell` | Reminder cards |
| `plus` | CTA buttons |
| `download` | Invoice download |
| `alert` | Missed collection, error state |
| `info` | Info callout |
| `logout` | Sign out |
| `x` | Close/dismiss |
| `settings` | Mobile menu toggle |

CDN-compatible equivalent: **Lucide Icons** (`https://unpkg.com/lucide@latest`) — same stroke style and naming conventions.

---

## File Index

```
README.md                        ← This file
SKILL.md                         ← Claude Code skill definition
colors_and_type.css              ← All CSS custom properties (tokens)
preview/
  colors-primary.html            ← Green scale swatches
  colors-semantic.html           ← Background, text, border, status colors
  type-scale.html                ← Display → body → label type scale
  type-specimens.html            ← Real-world text specimens
  spacing-tokens.html            ← Spacing scale + radii + shadows
  components-buttons.html        ← All button variants + states
  components-badges.html         ← Badge variants + input states
  components-cards.html          ← Card variants
  components-forms.html          ← Input, Select, validation states
  components-navigation.html     ← Sidebar + nav items
  brand-logo.html                ← Logo sizes + on-dark
  brand-icons.html               ← Full icon grid
ui_kits/
  web-app/
    index.html                   ← Full click-through prototype (client app)
```
