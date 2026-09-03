# Design Decision 08: Mobile Flaticons, Scheduled Label, and Peek/Expanded Drag Sheet

**Date:** September 3, 2026  
**Author:** SDE III Transit Frontend Lead  

---

## 1. UI Refinements & Icon Integration

1. **Flaticon Assets Integrated:**
   - **Bus Icon**: `frontend/src/assets/bus-icon.png` (Flaticon 9610428)
   - **Bus Stop Icon**: `frontend/src/assets/bus-stop-icon.png` (Flaticon 10903014)
   - **Walk Icon**: `frontend/src/assets/walk-icon.png` (Flaticon 13151017)
   - **Pin Icon**: `frontend/src/assets/pin-icon.png` (Flaticon 18556578)

2. **Clean Fare Header:**
   - Removed back arrow button next to `₹39` inside the sheet header.

3. **Bus Badge & Schedule Label:**
   - Removed `Corridor` text badge next to the bus number (`Bus 300`).
   - Renamed `Arriving in X min` -> `Scheduled in X min` (reflecting schedule database times without live GPS tracking).

4. **Theme Toggle Removal on Route Selection:**
   - Theme toggle button is automatically hidden when a route is selected (`selectedJourney !== null`), giving users an uncluttered full-screen map experience.

5. **Mobile Drag Sheet (Peek vs Expanded Mode):**
   - Added a top touch drag handle bar (`.sheet-drag-handle-bar`).
   - Tapping/swiping toggles between `'peek'` mode (shows header & full route map with start/end markers) and `'expanded'` mode (shows full step-by-step breakdown timeline).
