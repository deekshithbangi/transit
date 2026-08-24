import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import busIconPng from './assets/bus-icon.png'

// ─── Types ───────────────────────────────────────────────────────────────────
type Stop         = { stopId: string; stopName: string; stopLat?: number; stopLon?: number }
type Route        = { routeId: string; routeShortName: string; routeType?: number }
type ScheduleStop = { stopId: string; stopName: string; stopSequence: number; arrivalTime: string; departureTime: string }
type Journey      = {
  tripId: number; routeId: string; routeShortName: string
  fromStopId: string; fromStopName: string
  toStopId: string;   toStopName: string
  departureTime: string; arrivalTime: string; minutesUntilDeparture: number
}
type Alternative = { from: Stop; to: Stop; nextBus: Journey }
type Editing = 'from' | 'to' | null

// ─── Constants ───────────────────────────────────────────────────────────────
const API_URL          = import.meta.env.VITE_API_URL ?? '/api'
const STOP_SEARCH_LIMIT = 5
const MAX_MINUTES       = 18 * 60   // 18-hour display window
const DEMO_ROUTES: Route[] = [
  { routeId: '100B', routeShortName: '100B' },
  { routeId: '100G', routeShortName: '100G' },
  { routeId: '10',   routeShortName: '10'   },
]

// ─── API helpers ─────────────────────────────────────────────────────────────
async function fetchJson<T>(url: string): Promise<T> {
  const res     = await fetch(url)
  const payload = await res.json()
  if (!res.ok) throw new Error(payload.message ?? 'Request failed')
  return payload
}

async function searchStopsByName(name: string, size = STOP_SEARCH_LIMIT): Promise<Stop[]> {
  const payload = await fetchJson<{ data?: { content?: Stop[] } }>(
    `${API_URL}/stops/search?name=${encodeURIComponent(name)}&size=${size}`,
  )
  return (payload.data?.content ?? []).map(({ stopId, stopName, stopLat, stopLon }: Stop) => ({ stopId, stopName, stopLat, stopLon }))
}

async function fetchNearbyStops(lat: number, lon: number, radius = 2500): Promise<Stop[]> {
  try {
    const payload = await fetchJson<{ data?: Stop[] }>(
      `${API_URL}/stops/nearby?lat=${lat}&lon=${lon}&radius=${radius}`,
    )
    return payload.data ?? []
  } catch { return [] }
}

async function fetchJourneysForStops(from: Stop, to: Stop, limit = 10): Promise<Journey[]> {
  const payload = await fetchJson<{ data?: Journey[] }>(
    `${API_URL}/journeys/search?fromStopId=${encodeURIComponent(from.stopId)}&toStopId=${encodeURIComponent(to.stopId)}&limit=${limit}`,
  )
  return payload.data ?? []
}

// ─── Text utilities ───────────────────────────────────────────────────────────
function sanitize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
}
function displayName(name: string): string { return name.replace(/\s+/g, ' ').trim() }
function tokenize(value: string): string[]  { return sanitize(value).split(' ').filter(t => t.length >= 2) }

// ─── Stop ranking / deduplication ────────────────────────────────────────────
function dedupeById(stops: Stop[]): Stop[] {
  const seen = new Set<string>()
  return stops.filter(s => { if (seen.has(s.stopId)) return false; seen.add(s.stopId); return true })
}

function dedupeByName(stops: Stop[]): Stop[] {
  const seen = new Set<string>()
  return stops.filter(s => {
    const n = sanitize(displayName(s.stopName))
    if (!n || seen.has(n)) return false
    seen.add(n)
    return true
  })
}

function scoreStop(stop: Stop, query: string, tokens: string[]): number {
  const name = sanitize(stop.stopName)
  if (!name) return 0
  if (name === query) return 10_000
  if (name.startsWith(query)) return 9_000
  if (name.includes(query)) return 8_000
  return tokens.filter(t => name.includes(t)).length * 100 - name.length
}

function rankStops(stops: Stop[], query: string, dedupeName = true): Stop[] {
  const q      = sanitize(query)
  const tokens = tokenize(query)
  const ranked = [...dedupeById(stops)].sort((a, b) => {
    const diff = scoreStop(b, q, tokens) - scoreStop(a, q, tokens)
    return diff !== 0 ? diff : a.stopName.localeCompare(b.stopName)
  })
  return dedupeName ? dedupeByName(ranked) : ranked
}

function buildQueryVariants(query: string): string[] {
  const set      = new Set<string>([query])
  const s        = sanitize(query)
  if (s && s !== query) set.add(s)
  tokenize(query).sort((a, b) => b.length - a.length).slice(0, 2).forEach(t => set.add(t))
  return [...set]
}

async function findCandidates(text: string, current: Stop | null, max = 5): Promise<Stop[]> {
  const query = text.trim()
  if (!query) return []
  const groups = await Promise.all(buildQueryVariants(query).map(v => searchStopsByName(v)))
  const ranked = rankStops(groups.flat(), query, false)
  if (!current) return ranked.slice(0, max)
  if (sanitize(current.stopName) !== sanitize(query)) return ranked.slice(0, max)
  return [current, ...ranked.filter(s => s.stopId !== current.stopId)].slice(0, max)
}

async function resolveStop(text: string, current: Stop | null): Promise<Stop | null> {
  const query = text.trim()
  if (!query) return null
  if (current && sanitize(current.stopName) === sanitize(query)) return current
  const groups = await Promise.all(buildQueryVariants(query).map(v => searchStopsByName(v)))
  return rankStops(groups.flat(), query)[0] ?? null
}

// ─── Schedule utilities ───────────────────────────────────────────────────────
function compactStops(stops: ScheduleStop[]): ScheduleStop[] {
  return stops.reduce<ScheduleStop[]>((acc, stop) => {
    const last = acc[acc.length - 1]
    if (!last || sanitize(displayName(last.stopName)) !== sanitize(displayName(stop.stopName))) acc.push(stop)
    return acc
  }, [])
}

function sliceToSegment(stops: ScheduleStop[], journey: Journey): ScheduleStop[] {
  if (!stops.length) return stops
  const fromName = sanitize(displayName(journey.fromStopName))
  const toName   = sanitize(displayName(journey.toStopName))
  let si = stops.findIndex(s => s.stopId === journey.fromStopId)
  if (si < 0) si = stops.findIndex(s => sanitize(displayName(s.stopName)) === fromName)
  let ei = stops.findIndex((s, i) => i >= Math.max(si, 0) && s.stopId === journey.toStopId)
  if (ei < 0) ei = stops.findIndex((s, i) => i >= Math.max(si, 0) && sanitize(displayName(s.stopName)) === toName)
  if (si < 0 || ei < 0 || ei < si) return compactStops(stops)
  return compactStops(stops.slice(si, ei + 1))
}

// ─── Formatting ───────────────────────────────────────────────────────────────
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function fmtWait(minutes: number): string {
  if (minutes >= 1440) return `${Math.round(minutes / 1440)} day${minutes >= 2880 ? 's' : ''}`
  if (minutes >= 60)   return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  return `${minutes} min`
}

function fmtLabel(minutes: number, departureTime: string): string {
  const departsAt = new Date(Date.now() + minutes * 60_000)
  const time      = departureTime.slice(0, 5)
  const today     = new Date()
  const tomorrow  = new Date(today); tomorrow.setDate(today.getDate() + 1)
  if (isSameDay(departsAt, today))    return `Today ${time}`
  if (isSameDay(departsAt, tomorrow)) return `Tomorrow ${time}`
  return departsAt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + ` ${time}`
}

// ─── Icon component ───────────────────────────────────────────────────────────
type IconName = 'bus' | 'pin' | 'swap' | 'search' | 'location' | 'arrow' | 'clock' | 'chevron' | 'back'
const ICON_PATHS: Record<IconName, React.ReactNode> = {
  bus:      null, // rendered via BusIcon component
  pin:      <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  swap:     <><path d="M7 3 3 7l4 4M3 7h13M17 21l4-4-4-4M21 17H8" /></>,
  search:   <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  location: <><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /><circle cx="12" cy="12" r="5" /></>,
  arrow:    <path d="M5 12h14m-6-6 6 6-6 6" />,
  clock:    <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  chevron:  <path d="m7 10 5 5 5-5" />,
  back:     <path d="m15 18-6-6 6-6" />,
}
function Icon({ name }: { name: IconName }) {
  if (name === 'bus') {
    return <img src={busIconPng} className="icon bus-icon-img" alt="" aria-hidden="true" />
  }
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICON_PATHS[name]}
    </svg>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StopSuggestions({ suggestions, chooseStop, query }: {
  suggestions: Stop[]
  chooseStop: (stop: Stop) => void
  query: string
}) {
  const items = dedupeByName(suggestions).slice(0, 10)
  return (
    <div className="suggestions">
      {items.length
        ? items.map(stop => (
            <button key={stop.stopId} onMouseDown={e => e.preventDefault()} onClick={() => chooseStop(stop)}>
              <Icon name="pin" />{displayName(stop.stopName)}
            </button>
          ))
        : <p>{sanitize(query).length < 2 ? 'Type at least 2 letters to find a stop.' : 'No matching stops found.'}</p>
      }
    </div>
  )
}

function JourneyCard({ journey, expanded, schedule, onClick }: {
  journey: Journey; expanded: boolean; schedule: ScheduleStop[]; onClick: () => void
}) {
  const stops = sliceToSegment(schedule, journey)
  return (
    <article className={`journey-card ${expanded ? 'expanded' : ''}`}>
      <button className="journey-summary" onClick={onClick} aria-expanded={expanded}>
        <div className="route-badge">
          <Icon name="bus" />
          <span className="route-badge-label">
            {journey.routeShortName.split('/').flatMap((part, i) =>
              i === 0 ? [part] : ['/', <wbr key={i} />, part]
            )}
          </span>
        </div>
        <div className="journey-main">
          <p className="journey-direction">
            {journey.fromStopName}<Icon name="arrow" />{journey.toStopName}
          </p>
          <p className="journey-detail">Leaves in {fmtWait(journey.minutesUntilDeparture)} · Tap to see all stops</p>
        </div>
        <div className="arrival">
          <strong>{fmtWait(journey.minutesUntilDeparture)}</strong>
          <span><Icon name="clock" />{fmtLabel(journey.minutesUntilDeparture, journey.departureTime)}</span>
        </div>
        <Icon name="chevron" />
      </button>
      {expanded && (
        <div className="route-detail">
          <p className="route-detail-title">
            Route {journey.routeShortName} · {fmtLabel(journey.minutesUntilDeparture, journey.departureTime)} · arrives {journey.arrivalTime.slice(0, 5)}
          </p>
          <ol>
            {stops.map((stop, i) => (
              <li key={`${stop.stopId}-${stop.arrivalTime}-${i}`}>
                <span className="timeline-dot" />
                <span>{displayName(stop.stopName)}</span>
                <time>{stop.arrivalTime.slice(0, 5)}</time>
              </li>
            ))}
          </ol>
        </div>
      )}
    </article>
  )
}

function RoutesView({ routes, onPlanRoute }: { routes: Route[]; onPlanRoute: (r: Route) => void }) {
  return (
    <section className="routes-view">
      <p className="eyebrow">All services</p>
      <h1>Find your bus route.</h1>
      <p className="routes-copy">Browse the available TGSRTC routes, then plan a journey between the stops you need.</p>
      <div className="route-grid">
        {routes.map(route => (
          <button className="route-card" key={route.routeId} onClick={() => onPlanRoute(route)}>
            <span className="route-number"><Icon name="bus" />{route.routeShortName}</span>
            <span>Plan a trip on this route <Icon name="arrow" /></span>
          </button>
        ))}
      </div>
    </section>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const [view,             setView]            = useState<'planner' | 'routes'>('planner')
  const [menuOpen,         setMenuOpen]        = useState(false)
  const [from,             setFrom]            = useState<Stop | null>(null)
  const [to,               setTo]              = useState<Stop | null>(null)
  const [fromText,         setFromText]        = useState('')
  const [toText,           setToText]          = useState('')
  const [editing,          setEditing]         = useState<Editing>(null)
  const [suggestions,      setSuggestions]     = useState<Stop[]>([])
  const [journeys,         setJourneys]        = useState<Journey[]>([])
  const [isSearching,      setIsSearching]     = useState(false)
  const [searchError,      setSearchError]     = useState<string | null>(null)
  const [hasSearched,      setHasSearched]     = useState(false)
  const [locationMessage,  setLocationMessage] = useState('Choose a stop or use your current location')
  const [selectedJourney,  setSelectedJourney] = useState<Journey | null>(null)
  const [schedule,         setSchedule]        = useState<ScheduleStop[]>([])
  const [routes,           setRoutes]          = useState<Route[]>(DEMO_ROUTES)
  const [alternatives,     setAlternatives]    = useState<Alternative[]>([])
  const [stopHints,        setStopHints]       = useState<{ from: Stop[]; to: Stop[] } | null>(null)

  const cacheRef     = useRef<Map<string, Stop[]>>(new Map())
  const reqIdRef     = useRef(0)
  const activeText   = editing === 'from' ? fromText : toText

  // Suggestion fetch with debounce + cache
  useEffect(() => {
    if (!editing) { setSuggestions([]); return }
    const q = sanitize(activeText.trim())
    if (q.length < 2) { setSuggestions([]); return }

    const cache  = cacheRef.current
    const cached = cache.get(q)
    if (cached) { setSuggestions(cached.slice(0, 10)); return }

    const prefixEntry = [...cache.entries()]
      .filter(([k]) => q.startsWith(k))
      .sort((a, b) => b[0].length - a[0].length)[0]
    if (prefixEntry) setSuggestions(rankStops(prefixEntry[1], activeText).slice(0, 10))

    const id    = ++reqIdRef.current
    const timer = window.setTimeout(async () => {
      try {
        const remote   = await searchStopsByName(activeText.trim(), STOP_SEARCH_LIMIT)
        const merged   = prefixEntry ? [...prefixEntry[1], ...remote] : remote
        const ranked   = rankStops(merged, activeText.trim())
        cache.set(q, ranked)
        if (reqIdRef.current !== id) return
        setSuggestions(ranked.slice(0, 10))
      } catch {
        if (reqIdRef.current !== id) return
        if (!prefixEntry) setSuggestions([])
      }
    }, 180)
    return () => window.clearTimeout(timer)
  }, [activeText, editing])

  // Load routes on tab switch
  useEffect(() => {
    if (view !== 'routes') return
    fetch(`${API_URL}/routes`)
      .then(r => r.json())
      .then(p => setRoutes(p.data ?? DEMO_ROUTES))
      .catch(() => setRoutes(DEMO_ROUTES))
  }, [view])

  const chooseStop = useCallback((stop: Stop) => {
    if (editing === 'from') { setFrom(stop); setFromText(stop.stopName) }
    if (editing === 'to')   { setTo(stop);   setToText(stop.stopName)   }
    setEditing(null); setSuggestions([])
  }, [editing])

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocationMessage('Location is not supported in this browser'); return }
    setLocationMessage('Finding your nearest stop…')
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const res     = await fetch(`${API_URL}/stops/nearby?lat=${coords.latitude}&lon=${coords.longitude}&radius=600`)
        const payload = await res.json()
        const nearest = payload.data?.[0]
        if (nearest) { setFrom(nearest); setFromText(nearest.stopName); setLocationMessage(`Nearest stop: ${nearest.stopName}`); return }
        setLocationMessage('No stop found within 600 metres')
      } catch { setLocationMessage('Could not reach the local transit server') }
    }, () => setLocationMessage('Location access was not granted'))
  }, [])

  const swapStops = useCallback(() => {
    setFrom(to); setTo(from)
    setFromText(to?.stopName ?? ''); setToText(from?.stopName ?? '')
    setEditing(null); setSuggestions([])
  }, [from, to])

  const searchJourneys = useCallback(async () => {
    setIsSearching(true); setSelectedJourney(null); setSearchError(null)
    setHasSearched(true); setAlternatives([]); setStopHints(null)
    try {
      if (!fromText.trim() || !toText.trim()) {
        setSearchError('Enter both starting point and destination stops.')
        setJourneys([]); return
      }

      // Resolve + fetch candidates in parallel
      const [[resolvedFrom, resolvedTo], fromCands, toCands] = await Promise.all([
        Promise.all([resolveStop(fromText, from), resolveStop(toText, to)]),
        findCandidates(fromText, from),
        findCandidates(toText, to),
      ])

      // If either stop couldn't be resolved, show the nearest matching stops as hints
      if (!resolvedFrom || !resolvedTo) {
        setStopHints({ from: fromCands.slice(0, 4), to: toCands.slice(0, 4) })
        setSearchError('Could not match one or both stop names — did you mean one of these?')
        setJourneys([]); return
      }
      if (resolvedFrom.stopId === resolvedTo.stopId) {
        setSearchError('Starting point and destination must be different stops.')
        setJourneys([]); return
      }

      // Fan out over all candidate stop pairs; pick earliest departure.
      // The 18-hour rule is display-only and applied at the end.
      const seen  = new Set<string>()
      const pairs = [
        { f: resolvedFrom, t: resolvedTo },
        ...fromCands.flatMap(f => toCands.filter(t => t.stopId !== f.stopId).map(t => ({ f, t }))),
      ].filter(({ f, t }) => {
        const k = `${f.stopId}|${t.stopId}`
        if (seen.has(k)) return false
        seen.add(k); return true
      })

      const results = await Promise.all(
        pairs.map(async ({ f, t }) => ({ f, t, journeys: await fetchJourneysForStops(f, t, 6) }))
      )
      const withJourneys = results.filter(r => r.journeys.length > 0)
      const best = [...withJourneys].sort((a, b) =>
        a.journeys[0].minutesUntilDeparture - b.journeys[0].minutesUntilDeparture,
      )[0]

      const bestFrom     = best?.f ?? resolvedFrom
      const bestTo       = best?.t ?? resolvedTo
      const bestJourneys = best?.journeys ?? []
      const visible      = bestJourneys.filter(j => j.minutesUntilDeparture <= MAX_MINUTES).slice(0, 10)

      setFrom(bestFrom); setTo(bestTo)
      setFromText(bestFrom.stopName); setToText(bestTo.stopName)
      setJourneys(visible)

      // If nothing to show within 18 h, look for buses to stops NEAR the destination
      if (visible.length === 0) {
        // First: use any candidate pairs that already have buses
        const pairAlts: Alternative[] = withJourneys
          .filter(r => !(r.f.stopId === bestFrom.stopId && r.t.stopId === bestTo.stopId))
          .sort((a, b) => a.journeys[0].minutesUntilDeparture - b.journeys[0].minutesUntilDeparture)
          .slice(0, 3)
          .map(r => ({ from: r.f, to: r.t, nextBus: r.journeys[0] }))

        // Second: find stops physically near the destination and check for buses
        let nearbyAlts: Alternative[] = []
        const { stopLat, stopLon } = bestTo
        if (stopLat != null && stopLon != null) {
          const nearbyToStops = await fetchNearbyStops(stopLat, stopLon, 2500)
          // Exclude stops already tried
          const triedToIds = new Set(pairs.map(p => p.t.stopId))
          const freshToStops = dedupeByName(nearbyToStops)
            .filter(s => !triedToIds.has(s.stopId) && s.stopId !== bestFrom.stopId)
            .slice(0, 8)
          if (freshToStops.length > 0) {
            const nearbyResults = await Promise.all(
              fromCands.flatMap(fc =>
                freshToStops.map(async ts => ({
                  f: fc, t: ts,
                  journeys: await fetchJourneysForStops(fc, ts, 3),
                }))
              )
            )
            nearbyAlts = nearbyResults
              .filter(r => r.journeys.some(j => j.minutesUntilDeparture <= MAX_MINUTES))
              .sort((a, b) => a.journeys[0].minutesUntilDeparture - b.journeys[0].minutesUntilDeparture)
              .slice(0, 5)
              .map(r => ({ from: r.f, to: r.t, nextBus: r.journeys[0] }))
          }
        }

        // Merge: nearby-stop alternatives first (they have buses NOW), then pair alternatives
        const seen = new Set<string>()
        const merged = [...nearbyAlts, ...pairAlts].filter(a => {
          const k = `${a.from.stopId}|${a.to.stopId}`
          if (seen.has(k)) return false; seen.add(k); return true
        }).slice(0, 6)
        setAlternatives(merged)
      }
    } catch (err) {
      setJourneys([])
      setSearchError(err instanceof Error ? err.message : 'Could not search for buses. Is the backend running?')
    } finally {
      setIsSearching(false)
    }
  }, [from, to, fromText, toText])

  const openJourney = useCallback(async (journey: Journey) => {
    if (selectedJourney?.tripId === journey.tripId && selectedJourney?.minutesUntilDeparture === journey.minutesUntilDeparture) {
      setSelectedJourney(null); return
    }
    setSelectedJourney(journey); setSchedule([])
    try {
      const res     = await fetch(`${API_URL}/trips/${journey.tripId}/schedule`)
      const payload = await res.json()
      setSchedule(payload.data ?? [])
    } catch { setSchedule([]) }
  }, [selectedJourney])

  const routeCards = useMemo(() => routes.slice(0, 100), [routes])

  const inputProps = (field: Editing) => ({
    value:    field === 'from' ? fromText : toText,
    onFocus:  () => setEditing(field),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value
      if (field === 'from') {
        setFromText(v)
        if (from && sanitize(from.stopName) !== sanitize(v)) setFrom(null)
      } else {
        setToText(v)
        if (to && sanitize(to.stopName) !== sanitize(v)) setTo(null)
      }
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter') return
      e.preventDefault(); setEditing(null); void searchJourneys()
    },
  })

  const isJourneyExpanded = (j: Journey) =>
    selectedJourney?.tripId === j.tripId && selectedJourney?.minutesUntilDeparture === j.minutesUntilDeparture

  return (
    <main className="app-shell">
      {/* ── Top bar ── */}
      <header className="topbar">
        <a className="brand" href="#top" onClick={() => { setView('planner'); setMenuOpen(false) }}>
          <span className="brand-mark"><Icon name="bus" /></span>Transit
        </a>
        <nav aria-label="Main navigation">
          <button className={`nav-link ${view === 'planner' ? 'active' : ''}`} onClick={() => setView('planner')}>Plan a trip</button>
          <button className={`nav-link ${view === 'routes'  ? 'active' : ''}`} onClick={() => setView('routes')}>Routes</button>
        </nav>
        <button className={`menu-button ${menuOpen ? 'open' : ''}`} aria-label="Open menu" onClick={() => setMenuOpen(o => !o)}>
          <span /><span /><span />
        </button>
      </header>
      {menuOpen && (
        <div className="mobile-nav" role="menu">
          <button className={`mobile-nav-link ${view === 'planner' ? 'active' : ''}`}
            onClick={() => { setView('planner'); setMenuOpen(false) }}>Plan a trip</button>
          <button className={`mobile-nav-link ${view === 'routes' ? 'active' : ''}`}
            onClick={() => { setView('routes'); setMenuOpen(false) }}>Routes</button>
        </div>
      )}

      {view === 'planner' ? (
        <>
          {/* ── Hero ── */}
          <section className="hero" id="top">
            <p className="eyebrow">TGSRTC • Hyderabad</p>
            <h1>Get where you're going,<br /><em>without the guesswork.</em></h1>
            <p className="hero-copy">Find the next scheduled bus from the stop nearest you.</p>
          </section>

          {/* ── Planner ── */}
          <section className="planner" aria-label="Trip planner">
            <div className="planner-heading">
              <div>
                <p className="eyebrow">Journey planner</p>
                <h2>Where do you want to go?</h2>
              </div>
              <button className="current-location" onClick={useCurrentLocation}>
                <Icon name="location" />Use my location
              </button>
            </div>
            <p className="location-message">{locationMessage}</p>

            <div className="stop-fields">
              <div className="stop-field editable-field">
                <span className="stop-dot origin" />
                <label>
                  <span className="field-label">Starting point</span>
                  <input {...inputProps('from')} placeholder="Search for a stop" />
                </label>
                {editing === 'from' && <StopSuggestions suggestions={suggestions} chooseStop={chooseStop} query={fromText} />}
              </div>

              <button className="swap-button" onClick={swapStops} aria-label="Swap starting point and destination">
                <Icon name="swap" />
              </button>

              <div className="stop-field destination-field editable-field">
                <span className="stop-dot destination" />
                <label>
                  <span className="field-label">Destination</span>
                  <input {...inputProps('to')} placeholder="Search for a stop" />
                </label>
                {editing === 'to' && <StopSuggestions suggestions={suggestions} chooseStop={chooseStop} query={toText} />}
              </div>
            </div>

            <button className="search-button" onClick={searchJourneys} disabled={isSearching}>
              <Icon name="search" />{isSearching ? 'Finding buses…' : 'Search upcoming buses'}
            </button>
            {searchError && <p className="search-error">{searchError}</p>}
          </section>

          {/* ── Results ── */}
          <section className="results" aria-live="polite">
            <div className="results-heading">
              <div>
                <p className="eyebrow">Your trip</p>
                <h2>Upcoming buses</h2>
              </div>
            </div>
            {journeys.length > 0 ? (
              <div className="journey-list">
                {journeys.map((j, i) => (
                  <JourneyCard
                    key={`${j.tripId}-${j.minutesUntilDeparture}-${i}`}
                    journey={j}
                    expanded={isJourneyExpanded(j)}
                    schedule={schedule}
                    onClick={() => openJourney(j)}
                  />
                ))}
              </div>
            ) : hasSearched && !searchError ? (
              <>
                <div className="empty-state">
                  <Icon name="bus" />
                  <h3>No buses found in the next 18 hours</h3>
                  <p>No direct service between these stops shortly. Try a stop below.</p>
                </div>
                {alternatives.length > 0 && (
                  <div className="alt-suggestions">
                    <p className="alt-suggestions-label"><Icon name="pin" />Buses to stops near your destination</p>
                    {alternatives.map((alt, i) => (
                      <button key={i} className="alt-card"
                        onClick={() => {
                          setFrom(alt.from); setFromText(alt.from.stopName)
                          setTo(alt.to);     setToText(alt.to.stopName)
                          void searchJourneys()
                        }}>
                        <div className="alt-card-route">
                          <Icon name="bus" />
                          <span>{alt.nextBus.routeShortName}</span>
                        </div>
                        <div className="alt-card-info">
                          <p>{displayName(alt.from.stopName)} <Icon name="arrow" /> {displayName(alt.to.stopName)}</p>
                          <span><Icon name="clock" /> Departs in {fmtWait(alt.nextBus.minutesUntilDeparture)} · {fmtLabel(alt.nextBus.minutesUntilDeparture, alt.nextBus.departureTime)}</span>
                        </div>
                        <Icon name="chevron" />
                      </button>
                    ))}
                  </div>
                )}
                {stopHints && (
                  <div className="alt-suggestions">
                    <p className="alt-suggestions-label"><Icon name="pin" />Did you mean?</p>
                    {stopHints.from.length > 0 && <div className="hint-group">
                      <p className="hint-group-label">From:</p>
                      {stopHints.from.map(s => (
                        <button key={s.stopId} className="hint-chip"
                          onClick={() => { setFrom(s); setFromText(s.stopName) }}>
                          <Icon name="pin" /> {displayName(s.stopName)}
                        </button>
                      ))}
                    </div>}
                    {stopHints.to.length > 0 && <div className="hint-group">
                      <p className="hint-group-label">To:</p>
                      {stopHints.to.map(s => (
                        <button key={s.stopId} className="hint-chip"
                          onClick={() => { setTo(s); setToText(s.stopName) }}>
                          <Icon name="pin" /> {displayName(s.stopName)}
                        </button>
                      ))}
                    </div>}
                  </div>
                )}
              </>
            ) : !hasSearched ? (
              <div className="empty-state">
                <Icon name="bus" />
                <h3>Search to see upcoming buses</h3>
                <p>Choose your stops above, then search for the next scheduled services.</p>
              </div>
            ) : null}
          </section>
        </>
      ) : (
        <RoutesView
          routes={routeCards}
          onPlanRoute={route => {
            setView('planner')
            setLocationMessage(`Route ${route.routeShortName} selected — choose your stops to plan a trip`)
          }}
        />
      )}

      <footer>Schedule information is based on published GTFS data. Times may vary.</footer>
    </main>
  )
}

export default App
