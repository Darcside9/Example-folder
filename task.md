# Chris Shopper — Mobile-First Revamp Task Tracker

> **Status:** IN PROGRESS
> **Started:** 2026-09-21
> **Rule:** Each phase must be fully verified before progressing to the next.

---

## Phase 0 — Pre-Flight Audit
- [ ] **0.1** Map current `src/styles.css` (sections, redundancy, specificity)
- [ ] **0.2** List every component needing a dedicated CSS file
- [ ] **0.3** Identify inline styles, magic numbers, `!important` usage
- [ ] **0.4** Audit JSX for simultaneous desktop/mobile DOM elements
- [ ] **0.5** Baseline breakpoint snapshot checklist (manual QA step)
- [ ] **0.6** Confirm git clean state (commit/stash `M src/styles.css`)

## Phase 1 — New Folder & File Architecture
- [ ] **1.1** Create `src/styles/` directory
- [ ] **1.2** Create `src/styles/components/` directory
- [ ] **1.3** Create foundation CSS files (`index.css`, `reset.css`, `variables.css`, `base.css`, `layout.css`, `animations.css`)
- [ ] **1.4** Create 16 component CSS files in `src/styles/components/`
- [ ] **1.5** Update `src/main.jsx` import path
- [ ] **1.6** Verify dev server boots (`npm run dev`)
- [ ] **1.7** Delete old `src/styles.css`

## Phase 2 — Foundation: Reset, Variables, Base, Layout
- [ ] **2A** Write `reset.css` (box-sizing, max-width, margins, images, text-size-adjust, smooth scroll)
- [ ] **2B** Write `variables.css` (colors, spacing scale, fluid typography, radii, z-index, breakpoints, shadows)
- [ ] **2C** Write `base.css` (body, headings, links, focus-visible, visually-hidden)
- [ ] **2D** Write `layout.css` (app-root, page-shell, containers, flex/grid utilities)
- [ ] **2E** Write `index.css` (master @import cascade)
- [ ] **Verify Phase 2** — Dev server runs, no visual regression yet

## Phase 3 — Component-by-Component Mobile-First Migration
- [ ] **3.1** Navbar → `navbar.css` + `useMediaQuery` refactor
- [ ] **3.2** Hero → `hero.css`
- [ ] **3.3** HowItWorks → `how-it-works.css`
- [ ] **3.4** ServicesSection → `services-section.css`
- [ ] **3.5** PricingCatalog → `pricing-catalog.css`
- [ ] **3.6** ApiShowcaseSection → `api-showcase.css`
- [ ] **3.7** LiveTerminalDemo → `terminal-demo.css`
- [ ] **3.8** TrustMetrics → `trust-metrics.css`
- [ ] **3.9** FaqSection → `faq-section.css`
- [ ] **3.10** SupportSection → `support-section.css`
- [ ] **3.11** Footer → `footer.css`
- [ ] **3.12** QuickOrderModal → `quick-order-modal.css`
- [ ] **3.13** AuthView → `auth-view.css`
- [ ] **3.14** UserDashboard → `user-dashboard.css`
- [ ] **3.15** AdminDashboard → `admin-dashboard.css`
- [ ] **3.16** Toast → `toast.css`
- [ ] **Verify Phase 3** — All components render correctly at 320px, 375px, 768px, 1024px

## Phase 4 — Animations & Motion
- [ ] **4.1** Audit keyframes/transitions (only transform + opacity)
- [ ] **4.2** Wrap decorative animations in `prefers-reduced-motion`
- [ ] **4.3** Add/remove `will-change` appropriately
- [ ] **4.4** GPU acceleration hints where needed
- [ ] **4.5** IntersectionObserver entrance animations hook
- [ ] **4.6** Fix mobile drawer animation (translateX)
- [ ] **Verify Phase 4** — No jank on mobile, animations disabled when reduced motion is set

## Phase 5 — Accessibility & Cross-Device QA
- [ ] **5.1** Verify 44x44px min tap targets
- [ ] **5.2** Verify form labels
- [ ] **5.3** Verify modal focus trap + Escape close
- [ ] **5.4** iOS Safari testing (100dvh fix)
- [ ] **5.5** Android Chrome testing
- [ ] **5.6** Dark/glassmorphism aesthetic preserved
- [ ] **5.7** Lighthouse mobile audit (90+ perf, 95+ a11y)
- [ ] **5.8** DevTools breakpoint check (320–1440)
- [ ] **5.9** Confirm `cs_user` localStorage fallback works
- [ ] **5.10** Full mobile user journey test
- [ ] **Verify Phase 5** — All checks pass

## Phase 6 — Cleanup, Documentation & Deploy
- [ ] **6.1** Confirm old `src/styles.css` deleted
- [ ] **6.2** Remove remaining inline styles
- [ ] **6.3** Update `.continue/rules/CONTINUE.md`
- [ ] **6.4** Update `README.md`
- [ ] **6.5** Commit in logical chunks
- [ ] **6.6** Vercel preview deploy + verify build
- [ ] **6.7** Mark `phase.md` and `task.md` as DONE

---

## Verification Log
| Phase | Verified By | Date | Notes |
|-------|-------------|------|-------|
| 0     |             |      |       |
| 1     |             |      |       |
| 2     |             |      |       |
| 3     |             |      |       |
| 4     |             |      |       |
| 5     |             |      |       |
| 6     |             |      |       |