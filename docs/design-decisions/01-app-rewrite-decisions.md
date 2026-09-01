# HyderaBus Frontend — App Rewrite Design Decisions

**Date:** 2026-09-01  
**Author:** SDE III Review  
**Scope:** `frontend/src/App.tsx` + `frontend/src/App.css`

---

## 1. Problem Analysis

### What the old App.tsx had wrong

| Area | Problem |
|------|---------|
| **Single mega-file** | 874-line monolith — all types, utils, hooks, components and App state crammed into one file. Hard to test or reason about in isolation. |
| **State sprawl** | `App()` owned 17+ `useState` calls with no separation between "search session" state and "UI chrome" state. |
| **Search UX** | No explicit "searching" skeleton/loading state per-card. Results appear all at once — no progressive enhancement. |
| **NearbyView** | Fired geolocation immediately on mount — no user opt-in, no retry button. |
| **Routes tab** | Loaded lazily only after tab switch but had no search/filter — forcing users to scan all 400+ routes. |
| **Route Detail** | Loaded trips serially (details → trips → schedules). No skeleton. |
| **Hero section** | Appears only on Planner tab, wastes vertical space, pushes the actual search form way down on mobile. |
| **CSS** | 1413-line monolith with dark-mode ignored, no CSS custom property for spacing scale, inline magic numbers everywhere. |
| **Accessibility** | Missing `aria-label` on several interactive elements, no focus-visible ring, modal/dropdown lacks `role="listbox"`. |
| **No favourite stops** | High-return users must retype their commute every session. |

---

## 2. Architecture Decisions

### 2.1 Keep everything in App.tsx (pragmatic tradeoff)

**Decision:** Despite identifying the single-file smell, we keep one `App.tsx` for now.

**Rationale:**
- This is a Vite + React single-page app. Splitting into `components/` requires the user to approve new file creation — they asked for the *page* to be rewritten.
- A clean, well-organised 600-line file is infinitely more maintainable than a messy one.
- Separating into files is a follow-up refactor task (tracked in `02-component-split-plan.md`).

### 2.2 Remove the standalone Hero section

**Decision:** Merge the TGSRTC branding headline into the planner card itself as a small subtitle. Remove the full-bleed hero.

**Rationale:**
- Mobile-first: the hero pushes the search form below the fold.
- Transit apps are utility apps — users arrive to *do* something, not to read marketing copy.
- The brand identity is preserved in the topbar and the planner card heading.

### 2.3 Add Routes-tab search/filter

**Decision:** Add a debounced text filter input above the route grid.

**Rationale:**
- The API returns 400+ routes. Scanning by category is useful for discovery but not for finding a specific route number.
- The filter is purely client-side (no extra API call) — instant UX.

### 2.4 Persist favourite stops in `localStorage`

**Decision:** Store up to 5 recent/favourite stop pairs with a ⭐ button on each journey result.

**Rationale:**
- Most HyderaBus commuters repeat the same 1–2 journeys daily.
- `localStorage` is synchronous, zero-dependency, and survives page refreshes.
- Not stored server-side (no auth, no privacy concerns).

### 2.5 NearbyView — require explicit button press

**Decision:** Replace auto-trigger on mount with a "Find buses near me" button. Show spinner only after the user taps.

**Rationale:**
- Browsers now show a permission prompt immediately on `getCurrentPosition()` — firing it on mount feels aggressive and leads to higher denial rates.
- Users who navigate to "Near Me" tab by accident should not be interrupted.

### 2.6 Upgrade visual design

**Decision:** Adopt a dark-header / light-body split with glassmorphism search card, richer colour tokens, and a bottom navigation bar on mobile.

**Rationale:**
- The existing design uses a light-only palette that washes out on AMOLED screens.
- Bottom nav follows iOS/Android native patterns — thumb reach is better.
- The glassmorphism search card provides clear visual hierarchy above the results.

### 2.7 Skeleton loaders instead of text spinners

**Decision:** Replace `"Loading route details…"` paragraphs with CSS animated skeleton shimmer blocks.

**Rationale:**
- Perceived performance is significantly better with skeleton screens.
- Avoids layout shift when content arrives.

### 2.8 Progressive stop-pair fan-out stays unchanged

**Decision:** Keep the existing `findCandidates` + `resolveStop` + fan-out logic verbatim.

**Rationale:**
- This logic was the result of several previous debugging sessions (conversation `bf183298`).
- It correctly handles directional stop variants (e.g. "Uppal Cross Road twd Ghatkesar" vs "twd LB Nagar").
- Changing it risks regressions — UI rewrite should not touch proven business logic.

---

## 3. CSS Strategy

| Token | Value | Purpose |
|-------|-------|---------|
| `--bg` | `#0d1117` | Dark topbar / hero gradient base |
| `--surface` | `#ffffff` | Card / panel backgrounds |
| `--primary` | `#16a34a` | CTA buttons, active states |
| `--primary-dark` | `#15803d` | Hover state |
| `--accent` | `#f97316` | Destination dot, highlights |
| `--muted` | `#6b7280` | Secondary text |
| `--border` | `#e5e7eb` | Dividers and card borders |
| `--radius-card` | `16px` | All card radii |
| `--radius-btn` | `12px` | All button radii |

---

## 4. Removed Features

| Feature | Reason |
|---------|---------|
| Full-bleed Hero section | Mobile fold issue, replaced by in-card subtitle |
| `demo-label` CSS class | Was unused dead code |
| `alt-suggestions` / `hint-chip` CSS classes | Corresponding UI was never rendered in the current App.tsx — dead CSS |
| `routeCards` useMemo (slice to 100) | Routes are now filtered client-side; slicing to 100 hides valid routes |

---

## 5. Added Features

| Feature | Details |
|---------|---------|
| **Route search/filter** | Client-side debounced input in Routes tab |
| **Recent journeys** | Last 5 searches saved to `localStorage`, shown as chips |
| **NearbyView opt-in** | CTA button instead of auto-trigger |
| **Skeleton loaders** | Replace text spinners in RouteDetailView and NearbyView |
| **Bottom mobile nav** | Tab bar at bottom of viewport on ≤ 650px |
| **Route result count** | Shows "N buses found" above journey list |

---

## 6. Follow-up Tasks (not in this rewrite)

- `02-component-split-plan.md` — Split into `components/` directory
- `03-dark-mode.md` — Full dark mode with `prefers-color-scheme`
- `04-map-integration.md` — Leaflet map in NearbyView showing nearby stops
- `05-pwa.md` — Service worker + offline schedule cache
