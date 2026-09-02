# Feature: Hybrid Search + Multi-Modal Routing Plan

**Date:** 2026-09-02  
**Sprint:** 1 — Core Search UX

---

## Journey So Far

1. ✅ Fullscreen Google Maps + blue dot + "Where to?" pill
2. ✅ Search overlay with single/dual field modes
3. ✅ Live stop search with API + caching
4. 🔨 **This commit** — Google Places + custom icons + "Current location" fix
5. 📋 **Planned** — Multi-modal routing (transfers, metro, walking)

---

## What Was Added (This Commit)

### Hybrid Search Results
- **Backend stops** — searched via `/stops/search` API (bus-stop icon 🚏)
- **Google Places** — searched via Places Autocomplete API (location-pin icon 📍)
- Results merged: stops first (max 6), then places (max 4)
- Each type has a **distinct icon** (downloaded from Flaticon)

### Custom Icons
| Icon | Source | Used For |
|------|--------|----------|
| `bus-stop-icon.png` | flaticon.com/9830523 | Backend bus stops |
| `location-pin-icon.png` | flaticon.com/17193420 | Google Places results |

### "Current Location" Fix
- Dual mode shows **"Current location"** as text (green), not lat/lng coordinates
- Tapping the from-field clears it for editing; blurring restores "Current location"

### TGSRTC Badge
- Stop results show a small green "TGSRTC" badge to differentiate from Google Places

### Architecture Change
- Moved main app logic into `AppInner` component inside `APIProvider`
- Required because `useMapsLibrary('places')` hook must be inside `APIProvider`

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Stops before Places** | Transit users are primarily looking for bus stops. Places are fallback for when the stop name doesn't match. |
| **6 stops + 4 places max** | Prevents overwhelming the list. Stops are more relevant so get more slots. |
| **White-filtered PNG icons** | The Flaticon icons are black by default. CSS `filter: brightness(0) invert(1)` makes them white for the dark theme. |
| **"Current location" as text** | Users don't care about coordinates. "Current location" is universally understood. The from-field acts as a smart default that auto-restores. |
| **Places API country=IN, radius=100km** | Constrains results to India near Hyderabad. Prevents irrelevant global results. |

---

## Multi-Modal Routing Architecture (PLANNED — NOT IN THIS COMMIT)

### Problem Statement
The current backend only supports **direct journeys** (A→B on a single route).
Real transit needs:
1. **Transfer routes**: A→B (bus) then B→C (bus)
2. **Metro integration**: A→B (bus) then B→C (metro)
3. **Walking segments**: User location → nearest bus stop (walking)

### Proposed Architecture

```
User Location (GPS)
       │
       ▼
┌──────────────┐
│ /stops/nearby │  ── Find nearest stop(s) within 800m
└──────┬───────┘
       │
       ▼
┌──────────────────────────────┐
│  Frontend Transfer Engine     │
│                              │
│  1. Direct search: A → C     │
│  2. If no direct:            │
│     a. Find stops near A     │
│     b. Find stops near C     │
│     c. Find common routes    │
│     d. Build A→B + B→C       │
│  3. Score & rank by:         │
│     - Total travel time      │
│     - # of transfers         │
│     - Walking distance       │
│     - Wait time at transfer  │
└──────────────────────────────┘
```

### Transfer Search Algorithm (Frontend)
```
function findTransferRoutes(from, to):
  // Step 1: Try direct
  direct = searchJourneys(from, to)
  if direct.length > 0: return direct

  // Step 2: Find transfer points
  // Get all routes passing through 'from' area stops
  fromRoutes = getRoutesForStop(from)
  toRoutes = getRoutesForStop(to)
  
  // Find routes that share a common stop (transfer point)
  for each routeA in fromRoutes:
    stopsA = getStopsForRoute(routeA)
    for each routeB in toRoutes:
      stopsB = getStopsForRoute(routeB)
      transferStops = intersection(stopsA, stopsB)
      for each transfer in transferStops:
        leg1 = searchJourneys(from, transfer)
        leg2 = searchJourneys(transfer, to)
        if both have results:
          score and add to candidates

  // Step 3: Rank by total time + transfers
  return sortByScore(candidates)
```

### Hyderabad Metro Integration
- Metro GTFS data needs to be loaded into the backend database
- Metro stops need to be tagged with `route_type = 1` (GTFS standard for metro)
- The transfer algorithm naturally handles metro if metro stops/routes are in the DB
- **Prerequisite**: Obtain Hyderabad Metro GTFS data (may need to scrape from HMRL website)

### Backend API Changes Needed
| Endpoint | Purpose | Status |
|----------|---------|--------|
| `GET /routes/stop/{stopId}` | Get routes passing through a stop | ✅ Exists |
| `GET /routes/trips?routeId=` | Get trips for a route | ✅ Exists |
| `GET /trips/{id}/schedule` | Get stop sequence for a trip | ✅ Exists |
| `GET /stops/nearby` | Find stops near coordinates | ✅ Exists |
| `GET /journeys/search` | Direct journey search | ✅ Exists |
| `POST /journeys/transfer-search` | Multi-leg journey search | ❌ Needs building |

### Walking Directions
- Use Google Directions API (Walking mode) for:
  - User location → nearest bus stop
  - Transfer stop walk (if transferring between nearby stops)
- Requires enabling **Directions API** in Google Cloud Console

---

## Files Changed

- `frontend/src/App.tsx` — Google Places integration, custom icons, Current location fix
- `frontend/src/App.css` — Icon image styles, TGSRTC badge, current-loc input
- `frontend/src/assets/bus-stop-icon.png` — New icon for bus stops
- `frontend/src/assets/location-pin-icon.png` — New icon for Google Places
- `docs/design-decisions/04-hybrid-search-routing-plan.md` — This file

---

## Prerequisites for User

> **Important:** You need to enable **Places API** in your Google Cloud Console for the Google Places search to work.
>
> 1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
> 2. **APIs & Services → Library**
> 3. Search for **"Places API"** and enable it
> 4. Also enable **"Places API (New)"** if available
