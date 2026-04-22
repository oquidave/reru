# RERU — Reusable Resources

A household waste collection and recycling service management platform for Nsasa Estate, Mukono District, Uganda.

## What It Does

RERU lets residents subscribe to a weekly garbage collection service and track everything in one place:

- **Register** and choose a collection day and billing plan
- **Track** upcoming and past collections
- **View invoices** and payment status
- **Access** the service agreement

Waste is sorted into color-coded bags (organic, plastic, glass, paper) and routed to composting, certified recycling facilities, or authorized disposal sites.

## Getting Started

No build step required. Open `index.html` directly in a browser.

```bash
# Clone the repo
git clone <repo-url>
cd reru

# Open in browser
open index.html        # macOS
xdg-open index.html   # Linux
```

**Demo login:** any phone number + any 4-digit PIN logs in as a sample client.

## Tech Stack

- React 18 (loaded via CDN, no bundler)
- Babel Standalone (in-browser JSX compilation)
- Custom CSS using OKLCH color space
- Mock data only — no backend yet

## Project Structure

```
reru/
├── index.html   # Entire application (React components, styles, mock data)
├── docs/
│   └── PRD.md   # Product Requirements Document
└── README.md
```

## Service Details

| Plan | Price |
|---|---|
| Monthly | UGX 25,000 / month |
| Annual | UGX 240,000 / year (saves UGX 60,000) |

**Operator:** Mukono Countryside Mixed Farm Ltd  
**Contact:** Brian Twesigye — 0778527802 / briantwesigye@gmail.com

## Roadmap

See [docs/PRD.md](docs/PRD.md) for the full product requirements, including planned features: backend API, real authentication, Mobile Money integration, SMS notifications, admin dashboard, and PDF invoice generation.
