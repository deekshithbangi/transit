# Feature: Destination Search Flow

**Date:** 2026-09-01  
**Sprint:** 1 — Core Search UX

---

## Journey So Far

1. ✅ **Commit 1** — Fullscreen Google Maps with dark theme, blue dot GPS location, green "Where to?" search pill at bottom.
2. 🔨 **This commit** — Destination search page with single/dual field modes.

---

## User Story

> As a commuter, I want to tap "Where to?" and enter my destination so I can find a bus route.

---

## UX Flow (from reference screenshots)

### State 1: Map View (existing)
- Fullscreen dark Google Map with blue dot
- Green "Where to?" pill at bottom

### State 2: Single Search Mode (tap "Where to?")
- Full-screen dark overlay slides up
- Green header bar with:
  - 🔍 Search icon (left)
  - Text input: "Line or destination" placeholder
  - ↕ Swap icon button (right) — tapping this switches to dual mode
- Below header: dark body with quick-action cards
- "RECENT" section with saved recent searches

### State 3: Dual Search Mode (tap swap ↕ icon)
- Green header expands to show TWO fields:
  - 📍 "Current location" (auto-filled from GPS, editable)
  - 🟢 "Destination" (text input)
  - ↕ Swap button on right to exchange from/to
- Below: same quick-action cards + recents

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Slide-up overlay, not a new route** | Keeps map mounted in background, avoids re-init on close. Feels native like Google Maps / Transit apps. |
| **Single field first, dual on demand** | Most users just need "where do I want to go?" — from is assumed to be current location. Power users tap swap to override. |
| **Dark theme for search page** | Matches the dark map tiles. Consistent visual identity. Reduces eye strain at night (transit apps are used at all hours). |
| **Recent searches in localStorage** | Same rationale as decision doc 01 — commuters repeat journeys. |
| **Green header matches brand** | Consistent with the search pill color (`#1a6b3c`). |

---

## Files Changed

- `frontend/src/App.tsx` — Added search overlay with single/dual modes
- `frontend/src/App.css` — Added search page styles
- `docs/design-decisions/02-search-destination-flow.md` — This file
