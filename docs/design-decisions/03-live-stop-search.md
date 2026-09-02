# Feature: Live Stop Search Suggestions

**Date:** 2026-09-02  
**Sprint:** 1 — Core Search UX

---

## Journey So Far

1. ✅ **Commit 1** — Fullscreen Google Maps with dark theme, blue dot, green "Where to?" pill
2. ✅ **Commit 2** — Search overlay with single/dual field modes, quick actions, recents
3. 🔨 **This commit** — Live stop suggestions as user types

---

## What Was Added

When the user types ≥2 characters in either the single or dual search fields:
- The quick-action cards are replaced by a **live list of matching bus stops** from the backend API
- Stops are **ranked** by relevance (exact match > starts-with > contains > token match)
- Results are **deduplicated** by name to avoid showing "Uppal Cross Road" 6 times
- A **loading spinner** appears while the API request is in flight
- If no stops match, a friendly **empty state** message is shown

When a stop is selected:
- It fills the active text field (from or to)
- The resolved `Stop` object (with `stopId`) is stored for the next feature (journey search)
- The stop is **saved to recents** in localStorage

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **200ms debounce** | Prevents API spam on fast typing. Short enough to feel instant. |
| **Prefix cache lookup** | If user typed "Upp" and results are cached, typing "Uppa" instantly filters those while the API loads — perceived zero-latency. |
| **Green pin icons** in suggestion rows | Differentiates stop results from quick-action cards visually. Green (#4ade80) matches the app's primary color family. |
| **Reused stop ranking from old codebase** | The `scoreStop` / `rankStops` / `dedupeByName` logic was battle-tested across multiple debugging sessions. No reason to reinvent. |
| **Resolved Stop objects tracked separately** | `fromText`/`toText` are display strings; `fromStop`/`toStop` hold the actual `stopId`. Editing the text clears the resolved stop to force re-resolution. This prevents stale stopId mismatches. |

---

## Files Changed

- `frontend/src/App.tsx` — Added API helpers, stop search, suggestions UI, Stop state
- `frontend/src/App.css` — Added suggestion list, loading, empty state styles
- `docs/design-decisions/03-live-stop-search.md` — This file
