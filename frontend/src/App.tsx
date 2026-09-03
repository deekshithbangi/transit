import { useCallback, useEffect, useRef, useState } from 'react'
import { APIProvider, Map, AdvancedMarker, useMapsLibrary, useMap } from '@vis.gl/react-google-maps'
import './App.css'
import busIcon from './assets/bus-icon.png'
import busStopIcon from './assets/bus-stop-icon.png'
import walkIcon from './assets/walk-icon.png'
import pinIcon from './assets/pin-icon.png'

// ─── Types ────────────────────────────────────────────────────────────────────
type LatLng = { lat: number; lng: number }
type Stop = { stopId: string; stopName: string; stopLat?: number; stopLon?: number }
type PlaceResult = { placeId: string; name: string; subtitle: string }
type SearchResult = { type: 'stop'; stop: Stop } | { type: 'place'; place: PlaceResult }
type RecentSearch = { name: string; subtitle: string; timestamp: number; resultType: 'stop' | 'place' }

type JourneyOption = {
  id: string
  routeShortName: string
  departureTime: string
  minutesUntilDeparture?: number
  fromStopName: string
  toStopName: string
  isTransfer?: boolean
  transferStopName?: string
  leg1Route?: string
  leg2Route?: string
  isMetro?: boolean
  pathPoints?: LatLng[]
  intermediateStops?: string[]
  fare?: number
  totalMinutes?: number
}

// ─── Constants ────────────────────────────────────────────────────────────────
const GOOGLE_MAPS_KEY  = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''
const API_URL          = import.meta.env.VITE_API_URL ?? '/api'
const HYDERABAD: LatLng = { lat: 17.385, lng: 78.4867 }
const RECENTS_KEY      = 'transit_recent_searches'
const MAX_RECENTS      = 8
const STOP_SEARCH_LIMIT = 30

// ─── API helpers ──────────────────────────────────────────────────────────────
async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const payload = await res.json()
  if (!res.ok) throw new Error(payload.message ?? 'Request failed')
  return payload
}

async function searchStopsByName(name: string, size = STOP_SEARCH_LIMIT): Promise<Stop[]> {
  const payload = await fetchJson<{ data?: { content?: Stop[] } }>(
    `${API_URL}/stops/search?name=${encodeURIComponent(name)}&size=${size}`,
  )
  return (payload.data?.content ?? []).map(({ stopId, stopName, stopLat, stopLon }: Stop) => (
    { stopId, stopName, stopLat, stopLon }
  ))
}

// ─── Text & Route utilities ───────────────────────────────────────────────────
function sanitize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
}

function displayName(name: string): string {
  return name.replace(/\s+/g, ' ').trim()
}

function getRouteBadgesForStop(_stopName: string): string[] {
  // Returns real route badges from API data if available, empty array otherwise
  return []
}

function getIntermediateStops(_fromName: string, _toName: string): string[] {
  // Returns real intermediate stop names from API data if available, empty array otherwise
  return []
}

// ─── Stop dedup & ranking ─────────────────────────────────────────────────────
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

function tokenize(value: string): string[] {
  return sanitize(value).split(' ').filter(t => t.length >= 2)
}

function scoreStop(stop: Stop, query: string, tokens: string[]): number {
  const name = sanitize(stop.stopName)
  if (!name) return 0
  if (name === query) return 10_000
  if (name.startsWith(query)) return 9_000
  if (name.includes(query)) return 8_000
  return tokens.filter(t => name.includes(t)).length * 100 - name.length
}

function rankStops(stops: Stop[], query: string): Stop[] {
  const q = sanitize(query)
  const tokens = tokenize(query)
  const ranked = [...dedupeById(stops)].sort((a, b) => {
    const diff = scoreStop(b, q, tokens) - scoreStop(a, q, tokens)
    return diff !== 0 ? diff : a.stopName.localeCompare(b.stopName)
  })
  return dedupeByName(ranked)
}

// ─── LocalStorage helpers ─────────────────────────────────────────────────────
function loadRecents(): RecentSearch[] {
  try { return JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]') }
  catch { return [] }
}

function saveRecent(entry: RecentSearch) {
  const list = loadRecents().filter(r => r.name !== entry.name)
  list.unshift(entry)
  localStorage.setItem(RECENTS_KEY, JSON.stringify(list.slice(0, MAX_RECENTS)))
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-svg">
      <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
    </svg>
  )
}
function SwapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-svg">
      <path d="M7 3 3 7l4 4M3 7h13M17 21l4-4-4-4M21 17H8" />
    </svg>
  )
}
function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-svg">
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" /><circle cx="12" cy="12" r="5" />
    </svg>
  )
}
function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-svg">
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}
function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="icon-svg">
      <path d="M12 3l-10 9h3v9h6v-6h2v6h6v-9h3z" />
    </svg>
  )
}
function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="icon-svg icon-small">
      <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
    </svg>
  )
}
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-svg">
      <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M18.99 4.93l-1.41 1.41"/>
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-svg">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
    </svg>
  )
}

// ─── Polyline component ───────────────────────────────────────────────────────
function RoutePolyline({
  path,
  color = '#2563eb',
  isDashed = false,
  fitMap = false
}: {
  path: LatLng[]
  color?: string
  isDashed?: boolean
  fitMap?: boolean
}) {
  const map = useMap()
  useEffect(() => {
    if (!map || path.length < 2) return

    const line = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: isDashed ? 0 : 0.9,
      strokeWeight: 6,
      icons: isDashed ? [{
        icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
        offset: '0',
        repeat: '12px'
      }] : undefined,
    })
    line.setMap(map)

    if (fitMap) {
      const bounds = new google.maps.LatLngBounds()
      path.forEach(pt => bounds.extend(pt))
      map.fitBounds(bounds, { top: 90, bottom: 200, left: 30, right: 30 })
    }

    return () => line.setMap(null)
  }, [map, path, color, isDashed, fitMap])

  return null
}

// ─── Google Places hook ───────────────────────────────────────────────────────
function usePlacesAutocomplete() {
  const places = useMapsLibrary('places')
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null)

  useEffect(() => {
    if (places) {
      serviceRef.current = new google.maps.places.AutocompleteService()
    }
  }, [places])

  const search = useCallback(async (query: string): Promise<PlaceResult[]> => {
    if (!serviceRef.current || query.trim().length < 2) return []
    try {
      const res = await serviceRef.current.getPlacePredictions({
        input: query,
        componentRestrictions: { country: 'in' },
        locationBias: {
          center: HYDERABAD,
          radius: 100_000,
        } as unknown as google.maps.places.LocationBias,
      })
      return (res.predictions ?? []).slice(0, 5).map(p => ({
        placeId: p.placeId,
        name: p.structuredFormatting?.mainText ?? p.description,
        subtitle: p.structuredFormatting?.secondaryText ?? '',
      }))
    } catch {
      return []
    }
  }, [])

  return { search, ready: !!places }
}

// ─── Inner App ────────────────────────────────────────────────────────────────
function AppInner() {
  const [theme, setTheme]               = useState<'dark' | 'light'>('dark')

  // Location state
  const [userPos, setUserPos]           = useState<LatLng | null>(null)
  const [accuracy, setAccuracy]         = useState(50)
  const [locError, setLocError]         = useState<string | null>(null)

  // Search UI state
  const [showSearch, setShowSearch]     = useState(false)
  const [dualMode, setDualMode]        = useState(false)
  const [fromText, setFromText]        = useState('')
  const [toText, setToText]            = useState('')
  const [activeField, setActiveField]  = useState<'from' | 'to'>('to')
  const [recents, setRecents]          = useState<RecentSearch[]>(loadRecents)

  // Search results state
  const [results, setResults]          = useState<SearchResult[]>([])
  const [isLoading, setIsLoading]      = useState(false)
  const [fromStop, setFromStop]        = useState<Stop | null>(null)
  const [toStop, setToStop]            = useState<Stop | null>(null)

  // "Choose on map" state
  const [pickOnMap, setPickOnMap]       = useState(false)
  const [pickCenter, setPickCenter]    = useState<LatLng | null>(null)

  // Journey & Route state
  const [showJourneySheet, setShowJourneySheet]   = useState(false)
  const [isSearchingJourneys, setIsSearchingJourneys] = useState(false)
  const [journeys, setJourneys]           = useState<JourneyOption[]>([])
  const [selectedJourney, setSelectedJourney]   = useState<JourneyOption | null>(null)
  const [showStopsAccordion, setShowStopsAccordion] = useState(true)
  const [sheetMode, setSheetMode]         = useState<'expanded' | 'peek'>('expanded')

  const toInputRef     = useRef<HTMLInputElement>(null)
  const fromInputRef   = useRef<HTMLInputElement>(null)
  const singleInputRef = useRef<HTMLInputElement>(null)
  const cacheRef       = useRef<globalThis.Map<string, Stop[]>>(new globalThis.Map())
  const reqIdRef       = useRef(0)

  // Google Places
  const { search: searchPlaces, ready: placesReady } = usePlacesAutocomplete()

  // Helper for pushing browser history state
  const pushNavState = useCallback((name: string) => {
    try { window.history.pushState({ page: name }, '') } catch {}
  }, [])

  // ── Browser back swipe & hardware back button handling ──
  useEffect(() => {
    const handlePopState = () => {
      if (selectedJourney) {
        setSelectedJourney(null)
      } else if (showJourneySheet) {
        setShowJourneySheet(false)
      } else if (showSearch) {
        setShowSearch(false)
      } else if (pickOnMap) {
        setPickOnMap(false)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [selectedJourney, showJourneySheet, showSearch, pickOnMap])

  // ── GPS watch ──
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser')
      return
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setAccuracy(pos.coords.accuracy)
        setLocError(null)
      },
      (err) => {
        const msgs: Record<number, string> = {
          1: 'Location access denied. Enable it in browser settings.',
          2: 'Location unavailable. Please try again.',
          3: 'Location request timed out.',
        }
        setLocError(msgs[err.code] || 'Could not get your location.')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  // ── Auto-focus input ──
  useEffect(() => {
    if (!showSearch) return
    const timer = setTimeout(() => {
      if (dualMode) {
        (activeField === 'from' ? fromInputRef : toInputRef).current?.focus()
      } else {
        singleInputRef.current?.focus()
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [showSearch, dualMode, activeField])

  // ── Combined search: backend stops + Google Places ──
  const activeText = dualMode
    ? (activeField === 'from' ? fromText : toText)
    : toText

  useEffect(() => {
    if (!showSearch) { setResults([]); return }
    const q = sanitize(activeText.trim())
    if (q.length < 2) { setResults([]); return }

    const cache = cacheRef.current
    const cached = cache.get(q)

    if (cached) {
      setResults(cached.slice(0, 5).map(s => ({ type: 'stop' as const, stop: s })))
    }

    const id = ++reqIdRef.current
    setIsLoading(true)

    const timer = window.setTimeout(async () => {
      try {
        const [stops, places] = await Promise.all([
          searchStopsByName(activeText.trim(), STOP_SEARCH_LIMIT),
          placesReady ? searchPlaces(activeText.trim()) : Promise.resolve([]),
        ])

        if (reqIdRef.current !== id) return

        const ranked = rankStops(stops, activeText.trim())
        cache.set(q, ranked)

        const merged: SearchResult[] = [
          ...ranked.slice(0, 6).map(s => ({ type: 'stop' as const, stop: s })),
          ...places.slice(0, 4).map(p => ({ type: 'place' as const, place: p })),
        ]
        setResults(merged)
      } catch {
        if (reqIdRef.current !== id) return
        if (!cached) setResults([])
      } finally {
        if (reqIdRef.current === id) setIsLoading(false)
      }
    }, 200)

    return () => { window.clearTimeout(timer); setIsLoading(false) }
  }, [activeText, showSearch, dualMode, activeField, placesReady, searchPlaces])

  // ── Journey planning runner ──
  const triggerJourneySearch = useCallback(async (startName: string, destName: string, startStopObj?: Stop | null, destStopObj?: Stop | null) => {
    setShowSearch(false)
    setShowJourneySheet(true)
    setSelectedJourney(null)
    setSheetMode('expanded')
    setIsSearchingJourneys(true)
    pushNavState('journey-results')

    try {
      let fStop = startStopObj
      let tStop = destStopObj

      if (!fStop) {
        const found = await searchStopsByName(startName === 'Current location' ? '' : startName, 3)
        if (found.length > 0) fStop = found[0]
      }

      if (!tStop) {
        const found = await searchStopsByName(destName, 3)
        if (found.length > 0) tStop = found[0]
      }

      const fId = fStop?.stopId ?? ''
      const tId = tStop?.stopId ?? ''
      const fName = fStop?.stopName || startName || 'Start Stop'
      const tName = tStop?.stopName || destName || 'Destination Stop'

      const fLat = fStop?.stopLat ?? userPos?.lat
      const fLon = fStop?.stopLon ?? userPos?.lng
      const tLat = tStop?.stopLat
      const tLon = tStop?.stopLon

      if (!fId || !tId) {
        setJourneys([])
        return
      }

      const apiPayload = await fetchJson<{ data?: any[] }>(
        `${API_URL}/journeys/search?fromStopId=${fId}&toStopId=${tId}&limit=10`
      ).catch(() => ({ data: [] }))

      const rawList = apiPayload.data || []
      const parsedJourneys: JourneyOption[] = rawList.map((j: any, i: number) => ({
        id: j.tripId ? `${j.tripId}-${i}` : `journey-${i}`,
        routeShortName: j.routeShortName || '',
        departureTime: j.departureTime || '',
        minutesUntilDeparture: j.minutesUntilDeparture ?? undefined,
        fromStopName: j.fromStopName || fName,
        toStopName: j.toStopName || tName,
        fare: j.fare ?? undefined,
        totalMinutes: j.totalMinutes ?? undefined,
        intermediateStops: j.intermediateStops || [],
        pathPoints: (fLat && fLon && tLat && tLon) ? [
          { lat: fLat, lng: fLon },
          { lat: tLat, lng: tLon }
        ] : undefined
      }))

      setJourneys(parsedJourneys)
    } catch {
      setJourneys([])
    } finally {
      setIsSearchingJourneys(false)
    }
  }, [userPos, pushNavState])

  // ── Actions ──
  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const openSearch = useCallback(() => {
    setShowSearch(true)
    setDualMode(false)
    setToText('')
    setActiveField('to')
    setResults([])
    setPickOnMap(false)
    setShowJourneySheet(false)
    setSelectedJourney(null)
    pushNavState('search')
  }, [pushNavState])

  const closeSearch = useCallback(() => {
    setShowSearch(false)
    setDualMode(false)
    setFromText('')
    setToText('')
    setResults([])
    setPickOnMap(false)
  }, [])

  const startPickOnMap = useCallback(() => {
    setPickOnMap(true)
    setShowSearch(false)
    setPickCenter(userPos ?? HYDERABAD)
    pushNavState('pick-on-map')
  }, [userPos, pushNavState])

  const confirmPickOnMap = useCallback(() => {
    if (!pickCenter) return
    const label = `${pickCenter.lat.toFixed(4)}, ${pickCenter.lng.toFixed(4)}`
    let sName = fromText || 'Current location'
    let dName = toText

    if (dualMode) {
      if (activeField === 'to') {
        setToText(label)
        dName = label
      } else {
        setFromText(label)
        sName = label
      }
    } else {
      setToText(label)
      dName = label
    }

    setPickOnMap(false)
    
    if (dName) {
      triggerJourneySearch(sName, dName, fromStop, toStop)
    } else {
      setShowSearch(true)
    }
  }, [pickCenter, dualMode, activeField, fromText, toText, fromStop, toStop, triggerJourneySearch])

  const cancelPickOnMap = useCallback(() => {
    setPickOnMap(false)
    setShowSearch(true)
  }, [])

  const toggleDualMode = useCallback(() => {
    setDualMode(prev => {
      if (!prev) {
        setFromText('Current location')
        setActiveField('to')
      }
      return !prev
    })
    setResults([])
  }, [])

  const swapFields = useCallback(() => {
    const f = fromText
    const t = toText
    setFromText(t)
    setToText(f)
    const fs = fromStop
    const ts = toStop
    setFromStop(ts)
    setToStop(fs)
    setResults([])
  }, [fromText, toText, fromStop, toStop])

  const chooseResult = useCallback((result: SearchResult) => {
    const name = result.type === 'stop'
      ? displayName(result.stop.stopName)
      : result.place.name
    const subtitle = result.type === 'stop'
      ? 'Bus Station'
      : (result.place.subtitle || 'Google Place')

    let sName = fromText || 'Current location'
    let dName = toText
    let newFStop = fromStop
    let newTStop = toStop

    if (dualMode) {
      if (activeField === 'to') {
        setToText(name)
        dName = name
        if (result.type === 'stop') { setToStop(result.stop); newTStop = result.stop }
      } else {
        setFromText(name)
        sName = name
        if (result.type === 'stop') { setFromStop(result.stop); newFStop = result.stop }
      }
    } else {
      setToText(name)
      dName = name
      if (result.type === 'stop') { setToStop(result.stop); newTStop = result.stop }
    }
    setResults([])

    const entry: RecentSearch = {
      name, subtitle, timestamp: Date.now(),
      resultType: result.type,
    }
    saveRecent(entry)
    setRecents(loadRecents())

    if (dName) {
      triggerJourneySearch(sName, dName, newFStop, newTStop)
    }
  }, [dualMode, activeField, fromText, toText, fromStop, toStop, triggerJourneySearch])

  const selectRecent = useCallback((recent: RecentSearch) => {
    let sName = fromText || 'Current location'
    let dName = toText

    if (dualMode) {
      if (activeField === 'to') { setToText(recent.name); dName = recent.name }
      else { setFromText(recent.name); sName = recent.name }
    } else {
      setToText(recent.name)
      dName = recent.name
    }
    saveRecent(recent)
    setRecents(loadRecents())
    setResults([])

    if (dName) {
      triggerJourneySearch(sName, dName, fromStop, toStop)
    }
  }, [dualMode, activeField, fromText, toText, fromStop, toStop, triggerJourneySearch])

  const selectCurrentLocation = useCallback(() => {
    if (dualMode) {
      setFromText('Current location')
      setActiveField('to')
      toInputRef.current?.focus()
    }
  }, [dualMode])

  const center = userPos ?? HYDERABAD
  const hasActiveQuery = sanitize(activeText.trim()).length >= 2
  const showResults = showSearch && hasActiveQuery && results.length > 0

  const stopResults = results.filter(r => r.type === 'stop') as Extract<SearchResult, { type: 'stop' }>[]
  const placeResults = results.filter(r => r.type === 'place') as Extract<SearchResult, { type: 'place' }>[]

  // Points calculation for map polyline rendering
  const originPt = userPos ?? (selectedJourney?.pathPoints?.[0] ?? HYDERABAD)
  const boardPt = selectedJourney?.pathPoints?.[0] ?? originPt
  const alightPt = selectedJourney?.pathPoints?.[selectedJourney.pathPoints.length - 1] ?? originPt
  const destPt = selectedJourney?.pathPoints?.[selectedJourney.pathPoints.length - 1] ?? alightPt

  const walkLeg1Path: LatLng[] = [originPt, boardPt]
  const transitPath: LatLng[] = selectedJourney?.pathPoints ?? [boardPt, alightPt]
  const walkLeg2Path: LatLng[] = [alightPt, destPt]

  // Check if both origin and destination are bus stops (don't show walk/auto leg cards if both are bus stops)
  const isDirectBusStopPair = Boolean(
    fromText !== 'Current location' &&
    (fromStop || fromText.toLowerCase().includes('stop') || fromText.toLowerCase().includes('stand')) &&
    (toStop || toText.toLowerCase().includes('stop') || toText.toLowerCase().includes('stand'))
  )

  return (
    <div className="app-shell" data-theme={theme}>
      {/* ── Floating Top Left Sleek Back Button Pill when Route Selected ── */}
      {selectedJourney && (
        <button
          className="back-btn-pill"
          onClick={() => setSelectedJourney(null)}
          aria-label="Back to all routes"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {/* ── Theme Toggle Button (Hidden when route is selected to keep map UI ultra clean) ── */}
      {!selectedJourney && (
        <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      )}

      {/* ── Location error banner ── */}
      {locError && !showSearch && (
        <div className="loc-error-banner">
          <span className="loc-error-icon">📍</span>
          <span>{locError}</span>
        </div>
      )}

      {/* ── Clean Google Map (No overlays, full screen map) ── */}
      <Map
        defaultCenter={center}
        defaultZoom={userPos ? 16 : 13}
        center={userPos ? center : undefined}
        zoom={userPos ? 16 : undefined}
        gestureHandling="greedy"
        disableDefaultUI={true}
        mapId="transit-dark-map"
        colorScheme={theme === 'dark' ? 'DARK' : 'LIGHT'}
        className="map-container"
        onCameraChanged={pickOnMap ? (ev) => setPickCenter({ lat: ev.detail.center.lat, lng: ev.detail.center.lng }) : undefined}
      >
        {userPos && (
          <AdvancedMarker position={userPos}>
            <div className="blue-dot-wrapper">
              <div className="blue-dot-accuracy" style={{
                width: Math.max(40, Math.min(accuracy * 2, 200)),
                height: Math.max(40, Math.min(accuracy * 2, 200)),
              }} />
              <div className="blue-dot" />
            </div>
          </AdvancedMarker>
        )}

        {/* Selected Route Visualization */}
        {selectedJourney && (
          <>
            {!isDirectBusStopPair && (
              <RoutePolyline path={walkLeg1Path} color="#64748b" isDashed={true} />
            )}

            {/* Transit Leg Solid Line */}
            <RoutePolyline path={transitPath} color={selectedJourney.isMetro ? '#2563eb' : '#4f46e5'} fitMap={true} />

            {!isDirectBusStopPair && (
              <RoutePolyline path={walkLeg2Path} color="#64748b" isDashed={true} />
            )}

            {/* Start Node Badge at Boarding Stop */}
            <AdvancedMarker position={boardPt}>
              <div style={{ background: '#4f46e5', color: '#fff', padding: '5px 12px', borderRadius: 10, fontSize: 11, fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                Start: {selectedJourney.fromStopName}
              </div>
            </AdvancedMarker>

            {/* Intermediate Stop Circles on Map */}
            {selectedJourney.intermediateStops && selectedJourney.intermediateStops.length > 0 && selectedJourney.intermediateStops.map((sName, idx) => {
              const count = selectedJourney.intermediateStops!.length + 1
              const fraction = (idx + 1) / count
              const lat = boardPt.lat + (alightPt.lat - boardPt.lat) * fraction
              const lng = boardPt.lng + (alightPt.lng - boardPt.lng) * fraction
              return (
                <AdvancedMarker key={idx} position={{ lat, lng }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffffff', border: '2px solid #4f46e5', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} title={sName} />
                </AdvancedMarker>
              )
            })}

            {/* End Node Badge at Destination Stop */}
            <AdvancedMarker position={alightPt}>
              <div style={{ background: '#10b981', color: '#fff', padding: '5px 12px', borderRadius: 10, fontSize: 11, fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                End: {selectedJourney.toStopName}
              </div>
            </AdvancedMarker>
          </>
        )}
      </Map>

      {/* ── Pick-on-map mode ── */}
      {pickOnMap && (
        <>
          <div className="map-pink-dot" />
          <div className="map-pick-bar">
            <button className="map-pick-back" onClick={cancelPickOnMap} aria-label="Back">
              <LocationIcon />
            </button>
            <div className="map-pick-info">
              <span className="map-pick-label">Options near</span>
              <span className="map-pick-coords">
                {pickCenter ? `${pickCenter.lat.toFixed(4)}, ${pickCenter.lng.toFixed(4)}` : '17.4012, 78.5600'}
              </span>
            </div>
            <button className="map-pick-go" onClick={confirmPickOnMap} aria-label="Go">
              <svg viewBox="0 0 24 24" fill="currentColor" className="icon-svg">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
              </svg>
            </button>
          </div>
        </>
      )}

      {/* ── Bottom search pill ── */}
      {!showSearch && !pickOnMap && !showJourneySheet && (
        <div className="bottom-bar">
          <div className="search-pill" onClick={openSearch} role="button" tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && openSearch()}>
            <SearchIcon />
            <span className="search-pill-text">Where to?</span>
            <button className="home-btn" aria-label="Home" onClick={e => e.stopPropagation()}>
              <HomeIcon />
            </button>
          </div>
        </div>
      )}

      {/* ── Search overlay ── */}
      {showSearch && (
        <div className="search-overlay">
          <div className="search-header">
            {dualMode ? (
              <div className="search-header-dual">
                <div className="search-fields-dual">
                  <div className="search-field-wrapper">
                    <span className="field-dot field-dot-from"><LocationIcon /></span>
                    <div className={`search-field-row ${activeField === 'from' ? 'active' : ''}`}>
                      <input
                        ref={fromInputRef}
                        type="text"
                        className={`search-field-input ${fromText === 'Current location' ? 'current-loc-input' : ''}`}
                        placeholder="Starting point"
                        value={fromText}
                        onChange={e => { setFromText(e.target.value); setFromStop(null) }}
                        onFocus={() => {
                          setActiveField('from')
                          if (fromText === 'Current location') setFromText('')
                        }}
                        onBlur={() => {
                          if (fromText.trim() === '') setFromText('Current location')
                        }}
                      />
                    </div>
                  </div>

                  <div className="search-field-wrapper">
                    <span className="field-dot field-dot-to" />
                    <div className={`search-field-row ${activeField === 'to' ? 'active' : ''}`}>
                      <input
                        ref={toInputRef}
                        type="text"
                        className="search-field-input"
                        placeholder="Destination"
                        value={toText}
                        onChange={e => { setToText(e.target.value); setToStop(null) }}
                        onFocus={() => setActiveField('to')}
                      />
                    </div>
                  </div>
                </div>
                <button className="swap-btn" onClick={swapFields} aria-label="Swap">
                  <SwapIcon />
                </button>
              </div>
            ) : (
              <div className="search-header-single">
                <button className="search-back-btn" onClick={closeSearch} aria-label="Back">
                  <SearchIcon />
                </button>
                <input
                  ref={singleInputRef}
                  type="text"
                  className="search-field-input"
                  placeholder="Line or destination"
                  value={toText}
                  onChange={e => { setToText(e.target.value); setToStop(null) }}
                />
                <button className="swap-btn" onClick={toggleDualMode} aria-label="Add starting point">
                  <SwapIcon />
                </button>
              </div>
            )}
          </div>

          <div className="search-body">
            {showResults ? (
              <div className="suggestions-list">
                {isLoading && (
                  <div className="sugg-loading">
                    <span className="sugg-spinner" />
                    <span>Searching stops & places…</span>
                  </div>
                )}

                {/* STOPS AND STATIONS */}
                {stopResults.length > 0 && (
                  <>
                    <div className="search-section-header">STOPS AND STATIONS</div>
                    {stopResults.map((r) => {
                      const badges = getRouteBadgesForStop(r.stop.stopName)
                      return (
                        <button
                          key={r.stop.stopId}
                          className="suggestion-item"
                          onClick={() => chooseResult(r)}
                        >
                          <span className="sugg-icon">
                            <img src={busStopIcon} alt="Bus stop" className="sugg-type-icon" />
                          </span>
                          <span className="sugg-info">
                            <span className="sugg-name">{displayName(r.stop.stopName)}</span>
                            {badges.length > 0 && (
                              <div className="sugg-route-badges">
                                {badges.map((b, idx) => (
                                  <span
                                    key={idx}
                                    className={`route-chip-badge ${b.toLowerCase().includes('metro') ? 'metro-chip' : ''}`}
                                  >
                                    {b}
                                  </span>
                                ))}
                              </div>
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </>
                )}

                {/* SEARCH RESULTS (Google Places) */}
                {placeResults.length > 0 && (
                  <>
                    <div className="search-section-header">SEARCH RESULTS</div>
                    {placeResults.map((r, i) => (
                      <button
                        key={r.place.placeId + i}
                        className="suggestion-item"
                        onClick={() => chooseResult(r)}
                      >
                        <span className="sugg-icon">
                          <img src={pinIcon} alt="Place" className="sugg-type-icon" />
                        </span>
                        <span className="sugg-info">
                          <span className="sugg-name">{r.place.name}</span>
                          <span className="sugg-sub">{r.place.subtitle}</span>
                        </span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="quick-actions">
                  <button className="quick-action-card" onClick={startPickOnMap}>
                    <span className="qa-icon">
                      <img src={pinIcon} alt="" className="qa-type-icon" />
                    </span>
                    <span className="qa-label">Choose on map</span>
                    <ChevronRightIcon />
                  </button>

                  {dualMode && userPos && (
                    <button className="quick-action-card" onClick={selectCurrentLocation}>
                      <span className="qa-icon"><LocationIcon /></span>
                      <span className="qa-info">
                        <span className="qa-label">Current location</span>
                        <span className="qa-sub">Use GPS location</span>
                      </span>
                      <ChevronRightIcon />
                    </button>
                  )}

                  {!dualMode && (
                    <>
                      <button className="quick-action-card">
                        <span className="qa-icon"><HomeIcon /></span>
                        <span className="qa-label">Set home</span>
                        <ChevronRightIcon />
                      </button>
                      <button className="quick-action-card">
                        <span className="qa-icon qa-icon-work">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="icon-svg">
                            <path d="M20 7h-4V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 5h4v2h-4V5z" />
                          </svg>
                        </span>
                        <span className="qa-label">Set work</span>
                        <ChevronRightIcon />
                      </button>
                    </>
                  )}
                </div>

                {recents.length > 0 && (
                  <div className="recents-section">
                    <div className="search-section-header">RECENT</div>
                    <div className="recents-list">
                      {recents.map((r, i) => (
                        <button key={`${r.name}-${i}`} className="recent-item" onClick={() => selectRecent(r)}>
                          <span className="recent-icon">
                            <img
                              src={r.resultType === 'stop' ? busStopIcon : pinIcon}
                              alt=""
                              className="recent-type-icon"
                            />
                          </span>
                          <span className="recent-info">
                            <span className="recent-name">{r.name}</span>
                            <span className="recent-sub">{r.subtitle || (r.resultType === 'stop' ? 'Bus Station' : 'Google Place')}</span>
                          </span>
                          <span className="recent-more"><MoreIcon /></span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Journey Results Sheet & Selected Route Detail Sheet ── */}
      {showJourneySheet && (
        <div className={`journey-sheet mode-${sheetMode}`}>
          {/* Drag Handle Bar for smooth drag / toggle between Peek and Expanded view */}
          <div className="sheet-drag-handle-bar" onClick={() => setSheetMode(prev => prev === 'peek' ? 'expanded' : 'peek')}>
            <div className="sheet-drag-handle" />
          </div>

          <div className="journey-sheet-header">
            <div>
              <div className="journey-sheet-title" style={{ fontSize: 22, fontWeight: 800 }}>
                {selectedJourney ? (selectedJourney.totalMinutes ? `${selectedJourney.totalMinutes} min` : 'Route Path') : 'Recommended Routes'}
              </div>
            </div>
            {selectedJourney && selectedJourney.fare != null && (
              <div style={{ fontSize: 20, fontWeight: 800 }}>
                ₹{selectedJourney.fare}
              </div>
            )}
          </div>

          <div className="journey-sheet-body">
            {selectedJourney ? (
              /* Step-by-Step Route Breakdown View */
              <div className="timeline-container">
                <div className="timeline-line" />

                {/* Step 1: Walk to Boarding Station (Only if start is GPS / non-bus stop) */}
                {!isDirectBusStopPair && (
                  <div className="timeline-step">
                    <div className="timeline-node-icon">
                      <img src={walkIcon} alt="Walk" style={{ width: 22, height: 22 }} />
                    </div>
                    <div className="timeline-step-label">Walk</div>
                    <div className="detail-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                        <span>To</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, fontWeight: 700, fontSize: 14 }}>
                        <img src={busStopIcon} alt="" style={{ width: 22, height: 22 }} />
                        <span>{selectedJourney.fromStopName}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Board at Bus Station */}
                <div className="timeline-step">
                  <div className="timeline-node-icon">
                    <img src={busIcon} alt="Bus" style={{ width: 22, height: 22 }} />
                  </div>
                  <div className="timeline-step-label">Board at {selectedJourney.fromStopName}</div>
                  <div className="detail-card">
                    {selectedJourney.routeShortName && (
                      <div className="card-badge-pill">
                        <img src={busIcon} alt="" style={{ width: 18, height: 18 }} />
                        <span>{selectedJourney.routeShortName}</span>
                      </div>
                    )}

                    {selectedJourney.minutesUntilDeparture != null && (
                      <div style={{ fontSize: 13, color: '#0284c7', fontWeight: 700, marginTop: 4 }}>
                        Scheduled in {selectedJourney.minutesUntilDeparture} min
                      </div>
                    )}

                    <div style={{ fontWeight: 700, fontSize: 14, marginTop: 6 }}>
                      From {selectedJourney.fromStopName}
                    </div>

                    {/* Accordion for Intermediate Stop Names */}
                    {selectedJourney.intermediateStops && selectedJourney.intermediateStops.length > 0 && (
                      <>
                        <button
                          className="accordion-btn"
                          onClick={() => setShowStopsAccordion(prev => !prev)}
                        >
                          <span style={{ color: '#d97706' }}>
                            {selectedJourney.intermediateStops.length + 2} Stops {showStopsAccordion ? '▲' : '▼'}
                          </span>
                          {selectedJourney.fare != null && (
                            <span style={{ color: '#64748b', fontWeight: 600, fontSize: 12 }}>
                              ₹{selectedJourney.fare}
                            </span>
                          )}
                        </button>

                        {showStopsAccordion && (
                          <div className="stop-tree-list">
                            <div className="stop-tree-item" style={{ fontWeight: 700 }}>
                              <span className="stop-circle-dot" />
                              <span>{selectedJourney.fromStopName}</span>
                            </div>
                            {selectedJourney.intermediateStops.map((stopName, idx) => (
                              <div key={idx} className="stop-tree-item">
                                <span className="stop-circle-dot" />
                                <span>{stopName}</span>
                              </div>
                            ))}
                            <div className="stop-tree-item" style={{ fontWeight: 700 }}>
                              <span className="stop-circle-dot" style={{ background: '#4f46e5' }} />
                              <span>{selectedJourney.toStopName}</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div style={{ fontWeight: 700, fontSize: 14, marginTop: 4 }}>
                      To {selectedJourney.toStopName}
                    </div>
                  </div>
                </div>

                {/* Step 3: Destination Arrival (Only if destination is Google Place / non-bus stop) */}
                {!isDirectBusStopPair && (
                  <div className="timeline-step">
                    <div className="timeline-node-icon">
                      <img src={pinIcon} alt="Pin" style={{ width: 22, height: 22 }} />
                    </div>
                    <div className="timeline-step-label">Destination</div>
                    <div className="detail-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, fontWeight: 700, fontSize: 14 }}>
                        <img src={pinIcon} alt="" style={{ width: 22, height: 22 }} />
                        <span>{toText || selectedJourney.toStopName}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 500 }}>
                        Your destination
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : isSearchingJourneys ? (
              <div className="sugg-loading-full">
                <span className="sugg-spinner" />
                <span>Finding upcoming bus options…</span>
              </div>
            ) : journeys.length > 0 ? (
              journeys.map((j) => (
                <div key={j.id} className="journey-card" onClick={() => setSelectedJourney(j)} role="button" tabIndex={0}>
                  <div className="journey-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="journey-route-tag">
                        <img src={busIcon} alt="Bus" style={{ width: 18, height: 18, filter: 'brightness(0) invert(1)' }} />
                        <span>{j.routeShortName ? `Route ${j.routeShortName}` : 'Transit Route'}</span>
                      </span>
                      {j.isTransfer && (
                        <span className="route-chip-badge express-chip">
                          1 Transfer
                        </span>
                      )}
                    </div>
                    {j.minutesUntilDeparture != null && (
                      <span className="journey-time">
                        {j.minutesUntilDeparture <= 0 ? 'Departing now' : `In ${j.minutesUntilDeparture} mins`}
                      </span>
                    )}
                  </div>

                  <div className="journey-leg-info">
                    <img src={busStopIcon} alt="" style={{ width: 16, height: 16 }} />
                    <span>{j.fromStopName} → {j.toStopName}</span>
                  </div>

                  {j.isTransfer && j.transferStopName && (
                    <div className="journey-leg-info" style={{ color: '#f59e0b' }}>
                      <span>🔄 Change bus at {j.transferStopName}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="sugg-empty">
                <p>No direct bus routes found right now</p>
                <p className="sugg-empty-hint">Try searching from a nearby major bus stand</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────────
function App() {
  return (
    <div className="app-shell">
      <APIProvider apiKey={GOOGLE_MAPS_KEY} libraries={['places']}>
        <AppInner />
      </APIProvider>
    </div>
  )
}

export default App
