# Design Decision 06: Map Route Polylines, Step Breakdown Sheet, & Theme Control

**Date:** September 3, 2026  
**Author:** SDE III Transit Frontend Lead  

---

## 1. Features Added

1. **Map Route Polylines & Markers (`RoutePolyline`):**
   - When a recommended route is clicked, native `google.maps.Polyline` renders the route line directly on the Google Map (bus/metro transit leg in solid line, walking legs in dashed line).
   - Custom markers for Boarding Stop (`🚏 Stop Name`) and Destination Stop (`🏁 Destination Name`) rendered using `AdvancedMarker`.
   - `map.fitBounds()` automatically zooms & centers the map view to display the entire journey path.

2. **Draggable / Step-by-Step Breakdown Sheet:**
   - Selecting a route opens a detailed step timeline displaying:
     - 🚶 Initial walking leg distance & time to boarding stop.
     - 🚌 Boarding stop, route line, departure time, and number of stops.
     - 🔄 Transfer stop instructions if applicable (e.g. transfer at Koti).
     - 🚏 Alighting stop & final walking distance to destination.

3. **Google Places Everywhere (No Stop Restriction):**
   - Users can search and select ANY Google Place (malls, landmarks, colleges, residential areas, airports).
   - The app automatically maps coordinates to nearest GTFS transit stop for routing.

4. **Dark / Light Theme Toggle (`theme-toggle-btn`):**
   - Floating sun ☀️ / moon 🌙 button at top right to toggle between dark mode and light mode.
   - Syncs Google Maps `colorScheme` (`DARK` vs `LIGHT`) and CSS variables.

5. **Clean Map UI:**
   - Configured `disableDefaultUI={true}` on `<Map>` to remove fullscreen buttons, zoom controls, map type controls, and Google keyboard shortcut overlays.

---

## 2. Answers to User Question

> **Question:** Is it possible to change the color of the map to light brown?
> **Answer:** **Yes!** Google Maps JavaScript API allows custom styling via JSON map styles (`styles` array) or Google Cloud Vector Map Styling. By setting feature colors (such as `landscape` to `#f4efea` or `#e6d7c3`, `road` to `#ffffff`, and `water` to `#c4d5e7`), you can customize the entire map palette to a light brown warm aesthetic.
