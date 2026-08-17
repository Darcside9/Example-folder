# Chris Shopper — Instant SMS Verification & Virtual Phone Numbers

A modern, high-performance React + Vite web application for **Chris Shopper** — an enterprise-grade SMS verification and non-VoIP temporary phone number platform.

## Features

- **Interactive Live Terminal Simulator**: Real-time interactive demo simulating carrier line allocation, incoming SMS OTP packets, and one-click code copying.
- **Searchable Pricing Catalog**: Live instant search across 120+ platforms with category filter pills (*AI & Dev, Messaging, Social, Dating, Entertainment, Finance*) and multi-country support (🇺🇸 USA, 🇬🇧 UK, 🇨🇦 Canada, 🇩🇪 Germany, 🇫🇷 France, 🇳🇱 Netherlands).
- **Interactive Quick-Order Modal**: Direct quantity selection, real-time price calculation, and simulated carrier SIM provisioning.
- **Developer REST API Showcase**: Multi-language code explorer (cURL, Node.js/JavaScript, Python) with endpoint specifications and copyable snippets.
- **3-Step "How It Works" Flow**: Clear visual onboarding guide for non-VoIP verification.
- **24/7 Support Portal**: Live chat agent status, email support, and interactive ticket submission.
- **Accessible Smooth FAQ Accordion**: Expandable answers with full keyboard navigation and ARIA attributes.
- **Glassmorphism Cyber-Tech Aesthetic**: Dark theme, glowing gradient accents, responsive mobile navigation drawer, and micro-interactions.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the local development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

- `index.html` — Vite HTML entrypoint with custom SEO metadata and fonts
- `src/main.jsx` — React bootstrap
- `src/App.jsx` — Main application layout & global state
- `src/components/`
  - `Navbar.jsx` — Sticky header, mobile navigation drawer & language picker
  - `Hero.jsx` — Value proposition & hero section
  - `LiveTerminalDemo.jsx` — Interactive console SMS simulator
  - `HowItWorks.jsx` — 3-step visual workflow
  - `ServicesSection.jsx` — Core offerings (One-time SMS, Dedicated SIMs, Wholesale)
  - `PricingCatalog.jsx` — Searchable catalog with country & category filters
  - `ApiShowcaseSection.jsx` — Developer REST API showcase
  - `TrustMetrics.jsx` — Platform performance & security pillars
  - `FaqSection.jsx` — Animated FAQ accordion
  - `SupportSection.jsx` — 24/7 channels & contact form
  - `QuickOrderModal.jsx` — Interactive checkout / number allocator
  - `Footer.jsx` — Unified branding, status pill, and payment badges
- `src/data/` — Modular datasets (pricing, services, code snippets, FAQs, stats)
- `src/styles.css` — Modern design system and responsive styles
