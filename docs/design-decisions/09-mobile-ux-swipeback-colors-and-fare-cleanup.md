# Design Decision 09: Mobile UX Optimization, Swipe-Back History, and Modern Aesthetic

**Date:** September 3, 2026  
**Author:** SDE III Transit Frontend Lead  

---

## 1. Summary of Changes Made

1. **Removed Prefilled / Hardcoded Fares:**
   - Fare displays (`₹...`) are now strictly dynamic. If no fare API data exists, no fare text or symbol is rendered.
   - Removed hardcoded fallback walk/auto fares.

2. **Recommended Route Card Enhancements:**
   - Removed literal `"Bus"` text in route chips (e.g. `"Route 300"` instead of `"Bus Bus 300"`).
   - Integrated `bus-icon.png` directly inside the route tag headers.

3. **Sleek Floating Back Button Pill (`back-btn-pill`):**
   - Replaced plain arrow string with a modern glassmorphic circular back button featuring a crisp SVG chevron left icon (`width: 44px, height: 44px`).

4. **Pixel-Perfect Vertical Timeline Alignment:**
   - Aligned `.timeline-line` (`left: 17px; width: 2px`) through the exact geometric center of all step icons (`.timeline-node-icon` with `left: -36px; width: 36px`).

5. **Context-Aware Walk/Destination Cards:**
   - If both origin and destination are GTFS bus stops (e.g. `Uppal Bus Stand` → `Secunderabad Station`), walk/auto leg cards are hidden, rendering only the direct bus transit leg.

6. **Browser / Mobile Swipe-Back Navigation (`popstate`):**
   - Integrated `window.addEventListener('popstate')` and `history.pushState()`. Swiping back on phone or pressing browser back smoothly closes route details / search overlays / map pickers step-by-step.

7. **Cleaned Recent Searches Subtitle:**
   - Removed raw `stopId` strings (e.g. `bHfuhRVs`). Displaying clean descriptive labels like `"Bus Station"` or `"Google Place"`.

8. **Midnight Sapphire Color Scheme:**
   - Upgraded dark mode to `#0b0f19` midnight slate background, `#111827` cards with `#4f46e5` electric indigo and `#10b981` emerald accents.

---

## 2. USB Mobile Testing Instructions

To test the application on your physical mobile phone via USB cable:

```bash
# Option A: Vite Local Network Sharing
npm run dev -- --host

# Then connect phone to same Wi-Fi network and open http://<your-computer-ip>:5173

# Option B: Android USB Cable Port Forwarding (via ADB)
adb forward tcp:5173 tcp:5173

# Then open Chrome on your phone and navigate to: http://localhost:5173
```
