# Design Decision 07: Journey Detail Accordion & Clean Map Visualization

**Date:** September 3, 2026  
**Author:** SDE III Transit Frontend Lead  

---

## 1. Design & Functional Alignments (Matching Attachments 1, 2, 3)

### A. Intermediate Stop Accordion (`16 Stops ∨ / ∧`)
- Added an interactive accordion trigger (`[N] Stops ▲ / ▼`) inside the Boarding Bus step card.
- Displays all intermediate stop names in order between `From [Boarding Stop]` and `To [Alighting Stop]`.
- Each stop name is listed vertically with a hollow/filled white circle node dot alongside a left guide line matching Attachment 1 & 2 layout.

### B. Map Route Visualization (Attachment 3)
- **Walking Legs:** Rendered as dotted lines (`isDashed={true}`) connecting origin to boarding stop and alighting stop to destination.
- **Bus Transit Leg:** Rendered as a solid line with white circular node markers along the route.
- **Badges:** `Start: [Stop Name]` and `End: [Stop Name]` rendered at transit end points.
- **Map Controls Clean-up:** Added CSS rules targeting `.gm-style-cc`, `.gmnoprint`, and Google link anchors (`a[target="_blank"][href*="google"]`) to remove all bottom map overlays, watermarks, terms of use, and keyboard shortcut links.

### C. Exclusion Rules Applied
- ❌ **Removed:** The string `"Tap to view map route & step-by-step detail"`.
- ❌ **Excluded:** `"Direct"` tag from the top duration header (`58 min`).
- ❌ **Excluded:** `"Standing available"` / `"Available"` icons & text.
- ❌ **Excluded:** `"Track Bus"` and `"Pay for ticket"` action buttons.
