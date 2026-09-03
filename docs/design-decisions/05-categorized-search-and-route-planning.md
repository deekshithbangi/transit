# Design Decision 05: Categorized Search UI, Map Location Picker, & Multi-Modal Journey Recommendations

**Date:** September 3, 2026  
**Author:** SDE III Transit Frontend Lead  

---

## 1. Context & User Need

The HyderaBus mobile transit experience required three critical enhancements based on design benchmarks and user requirements:

1. **Categorized & Badge-Rich Search Suggestions (Matching Attachment 1):**
   - Distinct sections: `RECENT`, `STOPS AND STATIONS` (from GTFS Database), and `SEARCH RESULTS` (from Google Places).
   - Display route numbers (chips/badges like `219`, `300`, `18`, `Metro Red`) alongside GTFS bus stops to give immediate visibility into routes servicing each stop.

2. **Interactive "Choose on Map" Picker (Matching Attachment 2):**
   - Precise central **pink circle dot** with pulse animation centered over the map viewport.
   - Floating bottom magenta/purple pill bar displaying `"Options near"` with dynamic latitude/longitude coordinates (`17.4012, 78.5600`), and a circular pink action button (`→`) to confirm selection.

3. **Journey Search & Multi-Modal Recommendations:**
   - Seamless transition from selecting origin/destination to showing journey options.
   - Includes walking distance legs, direct bus routes, 1-transfer routes (e.g. Bus 18 → Transfer at Koti → Bus 218), and Hyderabad Metro alternatives when direct buses are unavailable or during off-peak hours.

---

## 2. Technical Implementation Details

### A. Categorized Search Rendering (`App.tsx` & `App.css`)
- **Stop Results (`STOPS AND STATIONS`):** Rendered with `busStopIcon`, formatted stop names, and dynamically generated route chips (`getRouteBadgesForStop()`).
- **Places Results (`SEARCH RESULTS`):** Rendered with `locationPinIcon`, place title, and secondary address text.
- **Recents (`RECENT`):** Stored in `localStorage` (`transit_recent_searches`) and displayed at the top of the search view when query string is short.

### B. Map Location Picker UI (`map-pink-dot` & `map-pick-bar`)
- Map event `onCameraChanged` tracks center coordinates (`pickCenter`).
- `.map-pink-dot` fixed at 50% viewport width/height.
- `.map-pick-bar` gradient pill (`#9c0058` → `#c20072`) with coordinates and action button.

### C. Journey Engine (`triggerJourneySearch`)
- Calls `${API_URL}/journeys/search?fromStopId=...&toStopId=...`.
- Resolves nearby stops via `/api/stops/nearby` or name matching if origin is current location or custom point.
- Renders `JourneySheet` bottom sheet with journey cards displaying:
  - Route short names (e.g. `Bus 300`, `Metro Red Line`).
  - Estimated departure times (`In 8 mins`).
  - Walking leg distance (`Walk 220m to Uppal Cross Road`).
  - Transfer steps (`🔄 Change bus at Koti Bus Stand`).

---

## 3. Verification & Safety

- Verified API integration with `/api/stops/search`, `/api/stops/nearby`, and `/api/journeys/search`.
- Built and committed modular code cleanly separating map state, search state, and journey state.
