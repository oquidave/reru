---
name: reru-design
description: Use this skill to generate well-branded interfaces and assets for RERU (Reusable Resources), a waste collection and management startup serving Nsasa Estate, Mukono District, Kampala, Uganda. Contains essential design guidelines, colors, type, fonts, and UI kit components for prototyping and production.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick Reference

**Brand:** Reusable Resources (RERU) · Part of Mukono Countryside Mixed Farm Ltd
**Service area:** Nsasa Estate, Mukono District, Kampala, Uganda
**Contact:** 0778527802 / 0704132691 · btwesigye25@gmail.com

**Primary font:** Outfit (Google Fonts) — weights 400/500/600/700/800
```html
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
```

**Core colors (OKLCH, hue 145):**
- `green-900: oklch(28% 0.10 145)` — sidebar, hero, footer
- `green-700: oklch(38% 0.13 145)` — primary buttons, active state
- `green-600: oklch(46% 0.15 145)` — hover, icon color
- `green-500: oklch(54% 0.16 145)` — focus border
- `green-100: oklch(92% 0.06 145)` — icon wells, badge bg
- `green-50:  oklch(96% 0.03 145)` — alt section bg, tint
- `bg:        oklch(97% 0.01 145)` — page background
- `border:    oklch(90% 0.03 145)` — default border
- `accent:    oklch(68% 0.16 160)` — "Best Value" only
- `danger:    oklch(52% 0.18 25)` — errors, missed status

**Key design rules:**
- Border width: always 1.5px (outer), 1px (dividers)
- Card radius: 16px default, 20px for hero/large cards
- Button/input radius: 10px
- Transitions: `all 0.15s ease` — no springs or bounces
- Icons: Lucide-style inline SVG, stroke-only, 1.8 strokeWidth
- No background images, textures, or patterns
- Decorative circles on dark sections only (rgba white, 0.04 opacity)
- Currency: always `UGX X,XXX` format
- Dates: `22 Apr 2026` format (Ugandan style, day first)
