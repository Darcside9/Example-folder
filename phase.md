# Chris Shopper — Mobile-First Revamp Plan

> **Objective:** Tear down the monolithic `src/styles.css` (33,000+ tokens), restructure the codebase for modularity, and enforce true mobile-first responsiveness across every page.
>
> **How to use this file:** Tick each task (`[x]`) as it's completed. Each phase is broken into atomic, verifiable steps so nothing gets skipped.

---

## Phase 0 — Pre-Flight Audit
> **Goal:** Understand exactly what we're dealing with before touching anything.

- [ ] **0.1** Map the current CSS file (`src/styles.css`) — identify section boundaries, redundant rules, and specificity conflicts.
- [ ] **0.2** List every component that needs a dedicated CSS file.
- [ ] **0.3** Identify all inline styles, magic numbers, and `!important` usages in the current CSS.
- [ ] **0.4** Audit `src/components/*.jsx` for desktop/mobile elements rendered simultaneously in the DOM.
- [ ] **0.5** Snapshot the current site on a real mobile device (iOS Safari + Android Chrome) at 320px, 375px, 414px, 768px, and 1024px to record baseline breakage.
- [ ] **0.6** Confirm git is in a clean state (commit or stash the `M src/styles.css` change before refactoring).

---

## Phase 1 — New Folder & File Architecture
> **Goal:** Set up the modular structure. Nothing visual changes in this phase.

- [ ] **1.1** Create the directory `src/styles/`.
- [ ] **1.2** Create the directory `src/styles/components/`.
- [ ] **1.3** Create the empty CSS files inside `src/styles/`:
  - [ ] `index.css` (entry — imports everything else)
  - [ ] `reset.css` (modern CSS reset)
  - [ ] `variables.css` (custom properties)
  - [ ] `base.css` (global typography, body, html)
  - [ ] `layout.css` (`.app-root`, `.page-shell`, utility classes)
  - [ ] `animations.css` (keyframes, transitions, motion-safe utilities)
- [ ] **1.4** Create the empty component CSS files inside `src/styles/components/`:
  - [ ] `navbar.css`
  - [ ] `hero.css`
  - [ ] `how-it-works.css`
  - [ ] `services-section.css`
  - [ ] `pricing-catalog.css`
  - [ ] `api-showcase.css`
  - [ ] `terminal-demo.css`
  - [ ] `trust-metrics.css`
  - [ ] `faq-section.css`
  - [ ] `support-section.css`
  - [ ] `footer.css`
  - [ ] `quick-order-modal.css`
  - [ ] `auth-view.css`
  - [ ] `user-dashboard.css`
  - [ ] `admin-dashboard.css`
  - [ ] `toast.css`
- [ ] **1.5** Update `src/main.jsx` to import `./styles/index.css` instead of `./styles.css`.
- [ ] **1.6** Verify the dev server still boots without errors (`npm run dev`).
- [ ] **1.7** Delete the old `src/styles.css` once all imports are verified.

---

## Phase 2 — Foundation: Reset, Variables, Base, Layout
> **Goal:** Establish the mobile-first design tokens and global rules that everything else builds on.

### 2A — `reset.css`
- [ ] **2A.1** Set `box-sizing: border-box` globally for `*, *::before, *::after`.
- [ ] **2A.2** Add `max-width: 100%` to all elements to prevent horizontal overflow on mobile.
- [ ] **2A.3** Reset margins, paddings, and font inheritance on `body`.
- [ ] **2A.4** Make `img, svg, video` `display: block; max-width: 100%; height: auto;`.
- [ ] **2A.5** Set `html { -webkit-text-size-adjust: 100%; }` for iOS Safari.
- [ ] **2A.6** Smooth scrolling: `html { scroll-behavior: smooth; }` (respecting `prefers-reduced-motion`).

### 2B — `variables.css`
- [ ] **2B.1** Define the **color palette** (preserve glassmorphism/cyber-tech theme):
  - [ ] `--bg-primary`, `--bg-secondary`, `--bg-elevated`
  - [ ] `--glass-bg`, `--glass-border`
  - [ ] `--accent-cyan`, `--accent-magenta`, `--accent-green` (semantic success/error)
  - [ ] `--text-primary`, `--text-muted`, `--text-inverse`
- [ ] **2B.2** Define the **spacing scale** (4px base):
  - [ ] `--space-xs` (4px) → `--space-2xl` (48px) → `--space-3xl` (64px)
- [ ] **2B.3** Define **fluid typography** using `clamp()`:
  - [ ] `--text-xs` through `--text-4xl`
- [ ] **2B.4** Define **border radii**: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`.
- [ ] **2B.5** Define **z-index scale**: `--z-dropdown`, `--z-sticky`, `--z-modal`, `--z-toast`.
- [ ] **2B.6** Define **breakpoints as SCSS-like comments** (we use raw CSS, but document them):
  - [ ] Mobile: 320–639px (default, no media query)
  - [ ] Tablet: 640px+
  - [ ] Desktop: 1024px+
  - [ ] Wide: 1440px+
- [ ] **2B.7** Define **shadow & glow tokens** for the cyber-tech aesthetic.

### 2C — `base.css`
- [ ] **2C.1** Set body font, line-height, and background using variables.
- [ ] **2C.2** Style headings (`h1`–`h6`) with fluid `clamp()` sizes.
- [ ] **2C.3** Style links with default + hover states.
- [ ] **2C.4** Set focus-visible outlines for accessibility (`:focus-visible { outline: 2px solid var(--accent-cyan); }`).
- [ ] **2C.5** Add a `.visually-hidden` utility for screen-reader-only text.

### 2D — `layout.css`
- [ ] **2D.1** Style `.app-root` as a flex column (min-height: 100vh).
- [ ] **2D.2** Style `.page-shell` to ensure main content stretches.
- [ ] **2D.3** Create container utilities: `.container`, `.container-narrow` with `width: 100%; margin-inline: auto; padding-inline: var(--space-md);`.
- [ ] **2D.4** Create simple flex/grid utility classes (`.flex`, `.grid`, `.gap-md`, etc.) for layout composition.
- [ ] **2D.5** Add `main { min-height: 60vh; }` so pages don't collapse on mobile.

### 2E — `index.css`
- [ ] **2E.1** Write the master `@import` list in the correct cascade order:
  ```css
  @import './reset.css';
  @import './variables.css';
  @import './base.css';
  @import './layout.css';
  @import './animations.css';
  @import './components/navbar.css';
  /* ... other component imports ... */
  ```

---

## Phase 3 — Component-by-Component Mobile-First Migration
> **Goal:** For each component, extract its CSS, rewrite the base styles for **mobile first**, and add `min-width` media queries for tablet/desktop enhancements only.
> **Rule:** No component CSS file may have a base style that assumes a viewport wider than 375px.

- [ ] **3.1** Migrate `Navbar.jsx` → `src/styles/components/navbar.css`
  - [ ] Mobile (default): sticky header, full-width flex, hamburger visible, drawer hidden by default.
  - [ ] Tablet (768px+): hide hamburger, show desktop nav inline.
  - [ ] **Refactor:** Conditionally render mobile drawer vs. desktop nav in JSX using a `useMediaQuery` hook to remove desktop-only DOM nodes on mobile.

- [ ] **3.2** Migrate `Hero.jsx` → `src/styles/components/hero.css`
  - [ ] Mobile: stacked column, full-width CTAs, smaller hero typography.
  - [ ] Desktop: side-by-side layout, larger hero typography.

- [ ] **3.3** Migrate `HowItWorks.jsx` → `src/styles/components/how-it-works.css`
  - [ ] Mobile: single column stack, full-width cards.
  - [ ] Tablet+: 3-column grid.

- [ ] **3.4** Migrate `ServicesSection.jsx` → `src/styles/components/services-section.css`
  - [ ] Mobile: single column, scrollable card list if needed.
  - [ ] Desktop: 3-tier pricing grid.

- [ ] **3.5** Migrate `PricingCatalog.jsx` → `src/styles/components/pricing-catalog.css`
  - [ ] Mobile: full-width search input, vertically stacked filter pills (horizontally scrollable).
  - [ ] Tablet+: 2-column grid.
  - [ ] Desktop: 3–4 column grid.

- [ ] **3.6** Migrate `ApiShowcaseSection.jsx` → `src/styles/components/api-showcase.css`
  - [ ] Mobile: tab buttons wrap, code blocks horizontally scroll with `overflow-x: auto`.

- [ ] **3.7** Migrate `LiveTerminalDemo.jsx` → `src/styles/components/terminal-demo.css`
  - [ ] Mobile: smaller font, monospace overflow scrolls horizontally.
  - [ ] Ensure the terminal does not break out of its container.

- [ ] **3.8** Migrate `TrustMetrics.jsx` → `src/styles/components/trust-metrics.css`
  - [ ] Mobile: 2x2 grid of stat cards.
  - [ ] Desktop: 4-column row.

- [ ] **3.9** Migrate `FaqSection.jsx` → `src/styles/components/faq-section.css`
  - [ ] Mobile: full-width accordion items, generous tap targets (min 44px height).
  - [ ] Desktop: max-width container.

- [ ] **3.10** Migrate `SupportSection.jsx` → `src/styles/components/support-section.css`
  - [ ] Mobile: stacked contact form, full-width inputs.

- [ ] **3.11** Migrate `Footer.jsx` → `src/styles/components/footer.css`
  - [ ] Mobile: stacked sections, centered text, payment badges wrap.
  - [ ] Desktop: multi-column footer.

- [ ] **3.12** Migrate `QuickOrderModal.jsx` → `src/styles/components/quick-order-modal.css`
  - [ ] Mobile: full-screen modal (no centering on small screens).
  - [ ] Use safe-area-insets: `padding-bottom: env(safe-area-inset-bottom);`.

- [ ] **3.13** Migrate `AuthView.jsx` → `src/styles/components/auth-view.css`
  - [ ] Mobile: full-screen card, large touch-friendly inputs.

- [ ] **3.14** Migrate `UserDashboard.jsx` → `src/styles/components/user-dashboard.css`
  - [ ] Mobile: stacked order cards, vertical balance display.
  - [ ] Desktop: sidebar + main content layout.

- [ ] **3.15** Migrate `AdminDashboard.jsx` → `src/styles/components/admin-dashboard.css`
  - [ ] Mobile: collapsible tables (or card-based layout) so horizontal scrolling never breaks the page.
  - [ ] Desktop: data tables with full columns.

- [ ] **3.16** Migrate toast notification → `src/styles/components/toast.css`
  - [ ] Mobile: bottom-anchored toast above the safe-area-inset.

---

## Phase 4 — Animations & Motion
> **Goal:** Fix janky/overdone animations and respect user motion preferences.

- [ ] **4.1** Audit every `@keyframes` and `transition` in the new CSS — ensure only `transform` and `opacity` are animated.
- [ ] **4.2** Wrap all decorative animations in `@media (prefers-reduced-motion: no-preference)`.
- [ ] **4.3** Add `will-change: transform` only to actively-animating elements (not permanently — it hurts performance).
- [ ] **4.4** Add GPU acceleration hints where needed (`backface-visibility: hidden; transform: translateZ(0);`).
- [ ] **4.5** Add subtle entrance animations (fade-in-up) to homepage sections using IntersectionObserver in a small custom hook.
- [ ] **4.6** Fix the mobile drawer animation: use `transform: translateX(...)` instead of `left`/`right`.

---

## Phase 5 — Accessibility & Cross-Device QA
> **Goal:** Verify the revamp works on every real device scenario.

- [ ] **5.1** All interactive elements have a minimum tap target of **44x44px** (WCAG 2.1).
- [ ] **5.2** All form inputs have associated `<label>` elements.
- [ ] **5.3** Modals trap focus and close on `Escape` key.
- [ ] **5.4** Test in **iOS Safari** (iPhone SE, 13, 15) — verify no `100vh` issues, fix with `100dvh` fallback.
- [ ] **5.5** Test in **Android Chrome** (Pixel, Samsung).
- [ ] **5.6** Verify dark/glassmorphism aesthetic is preserved.
- [ ] **5.7** Run a Lighthouse mobile audit and target a **90+ Performance score** and **95+ Accessibility score**.
- [ ] **5.8** Check all breakpoints in DevTools: 320, 375, 414, 640, 768, 1024, 1280, 1440.
- [ ] **5.9** Confirm the `cs_user` localStorage key still works for fallback auth.
- [ ] **5.10** Test the full user journey on mobile: Sign up → Buy number → View dashboard → Sign out.

---

## Phase 6 — Cleanup, Documentation & Deploy
> **Goal:** Final polish, update docs, and ship.

- [ ] **6.1** Delete the old `src/styles.css` if not already done.
- [ ] **6.2** Search the codebase for any remaining inline styles or `style={{}}` props and migrate them to CSS classes.
- [ ] **6.3** Update `.continue/rules/CONTINUE.md` to reflect the new `src/styles/` structure.
- [ ] **6.4** Update `README.md` with the new project structure tree.
- [ ] **6.5** Commit the refactor in **logical chunks** (one commit per phase or per component) so the diff is reviewable.
- [ ] **6.6** Deploy to Vercel preview and verify production build (`npm run build && npm run preview`).
- [ ] **6.7** Mark this `phase.md` file as **DONE** and archive it once all phases are complete.

---

## Notes / Decisions Log
> Use this section to record any deviations from the plan, blockers, or design decisions made during execution.

- **Date:** _____ — _Decision/Note:_
- **Date:** _____ — _Decision/Note:_
- **Date:** _____ — _Decision/Note:_
