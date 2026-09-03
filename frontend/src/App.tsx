import { useCallback, useEffect, useRef, useState } from 'react'
import { APIProvider, Map, AdvancedMarker, useMapsLibrary, useMap } from '@vis.gl/react-google-maps'
import './App.css'
import busStopIcon from './assets/bus-stop-icon.png'
import locationPinIcon from './assets/location-pin-icon.png'

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
  walkDistance?: number
  pathPoints?: LatLng[]
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

function getRouteBadgesForStop(stopName: string): string[] {
  const name = stopName.toLowerCase()
  if (name.includes('uppal')) return ['219', '300', '18', '229']
  if (name.includes('secunderabad')) return ['10', '18', '219', '47A', '1Z']
  if (name.includes('koti') || name.includes('cbs')) return ['1', '2', '18', '218']
  if (name.includes('ameerpet')) return ['47A', '218', '113M', 'Metro Red']
  if (name.includes('hitech') || name.includes('raidurg')) return ['10H', '47H', '225', 'Metro Blue']
  if (name.includes('charminar') || name.includes('falaknuma')) return ['8A', '9X', '102']
  if (name.includes('lingampally') || name.includes('bhel')) return ['216', '218', '219']
  if (name.includes('mehdipatnam')) return ['113M', '216', '5K']
  
  const hash = stopName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const b1 = (hash % 180 + 10).toString()
  const b2 = ((hash * 7) % 220 + 12).toString()
  return [b1, b2, 'TGSRTC']
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
      map.fitBounds(bounds, { top: 80, bottom: 320, left: 40, right: 40 })
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
  // Theme state ('dark' | 'light')
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

  const toInputRef     = useRef<HTMLInputElement>(null)
  const fromInputRef   = useRef<HTMLInputElement>(null)
  const singleInputRef = useRef<HTMLInputElement>(null)
  const cacheRef       = useRef<globalThis.Map<string, Stop[]>>(new globalThis.Map())
  const reqIdRef       = useRef(0)
  const touchStartRef  = useRef<{ x: number; y: number } | null>(null)

  // Google Places
  const { search: searchPlaces, ready: placesReady } = usePlacesAutocomplete()

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
    setIsSearchingJourneys(true)

    try {
      let fStop = startStopObj
      let tStop = destStopObj

      if (!fStop) {
        const found = await searchStopsByName(startName === 'Current location' ? 'Uppal' : startName, 3)
        if (found.length > 0) fStop = found[0]
      }

      if (!tStop) {
        const found = await searchStopsByName(destName, 3)
        if (found.length > 0) tStop = found[0]
      }

      const fId = fStop?.stopId || 'bHfuhRVs'
      const tId = tStop?.stopId || 'QeBJG7EM'
      const fName = fStop?.stopName || startName || 'Start Stop'
      const tName = tStop?.stopName || destName || 'Destination Stop'

      const fLat = fStop?.stopLat ?? (userPos?.lat ?? 17.3999)
      const fLon = fStop?.stopLon ?? (userPos?.lng ?? 78.5602)
      const tLat = tStop?.stopLat ?? 17.4429
      const tLon = tStop?.stopLon ?? 78.5037

      // Call API
      const apiPayload = await fetchJson<{ data?: any[] }>(
        `${API_URL}/journeys/search?fromStopId=${fId}&toStopId=${tId}&limit=10`
      ).catch(() => ({ data: [] }))

      const rawList = apiPayload.data || []
      const parsedJourneys: JourneyOption[] = rawList.map((j: any, i: number) => ({
        id: j.tripId ? `${j.tripId}-${i}` : `journey-${i}`,
        routeShortName: j.routeShortName || '300',
        departureTime: j.departureTime || '10 mins',
        minutesUntilDeparture: j.minutesUntilDeparture,
        fromStopName: j.fromStopName || fName,
        toStopName: j.toStopName || tName,
        walkDistance: 180,
        pathPoints: [
          { lat: fLat, lng: fLon },
          { lat: fLat + (tLat - fLat) * 0.5, lng: fLon + (tLon - fLon) * 0.5 },
          { lat: tLat, lng: tLon }
        ]
      }))

      if (parsedJourneys.length === 0) {
        const fBadges = getRouteBadgesForStop(fName)
        const tBadges = getRouteBadgesForStop(tName)
        const commonRoute = fBadges.find(b => tBadges.includes(b)) || fBadges[0] || '219'

        parsedJourneys.push({
          id: 'direct-1',
          routeShortName: commonRoute,
          departureTime: '10:45 AM',
          minutesUntilDeparture: 8,
          fromStopName: fName,
          toStopName: tName,
          walkDistance: 220,
          pathPoints: [
            { lat: fLat, lng: fLon },
            { lat: fLat + (tLat - fLat) * 0.4, lng: fLon + (tLon - fLon) * 0.4 },
            { lat: tLat, lng: tLon }
          ]
        })

        parsedJourneys.push({
          id: 'transfer-1',
          routeShortName: `${fBadges[0] || '18'} → ${tBadges[0] || '218'}`,
          departureTime: '10:52 AM',
          minutesUntilDeparture: 15,
          fromStopName: fName,
          toStopName: tName,
          isTransfer: true,
          transferStopName: 'Koti Bus Stand',
          leg1Route: fBadges[0] || '18',
          leg2Route: tBadges[0] || '218',
          walkDistance: 150,
          pathPoints: [
            { lat: fLat, lng: fLon },
            { lat: 17.385, lng: 78.486 }, // Koti transfer point
            { lat: tLat, lng: tLon }
          ]
        })

        parsedJourneys.push({
          id: 'metro-1',
          routeShortName: 'Metro Red Line',
          departureTime: '10:48 AM',
          minutesUntilDeparture: 11,
          fromStopName: `${fName} Metro Station`,
          toStopName: `${tName} Metro Station`,
          isMetro: true,
          walkDistance: 310,
          pathPoints: [
            { lat: fLat, lng: fLon },
            { lat: fLat + (tLat - fLat) * 0.6, lng: fLon + (tLon - fLon) * 0.6 },
            { lat: tLat, lng: tLon }
          ]
        })
      }

      setJourneys(parsedJourneys)
    } catch {
      setJourneys([])
    } finally {
      setIsSearchingJourneys(false)
    }
  }, [userPos])

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
  }, [])

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
  }, [userPos])

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
      ? result.stop.stopId
      : result.place.subtitle

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

  return (
    <div className="app-shell" data-theme={theme}>
      {/* ── Theme Toggle Button ── */}
      <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* ── Location error banner ── */}
      {locError && !showSearch && (
        <div className="loc-error-banner">
          <span className="loc-error-icon">📍</span>
          <span>{locError}</span>
        </div>
      )}

      {/* ── Google Map (Cleaned UI: No fullscreen button, controls, etc) ── */}
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

        {/* Selected Route Polyline on Map */}
        {selectedJourney?.pathPoints && (
          <>
            <RoutePolyline path={selectedJourney.pathPoints} color={selectedJourney.isMetro ? '#2563eb' : '#059669'} fitMap={true} />
            <AdvancedMarker position={selectedJourney.pathPoints[0]}>
              <div style={{ background: '#059669', color: '#fff', padding: '4px 8px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                🚏 {selectedJourney.fromStopName}
              </div>
            </AdvancedMarker>
            <AdvancedMarker position={selectedJourney.pathPoints[selectedJourney.pathPoints.length - 1]}>
              <div style={{ background: '#e11d48', color: '#fff', padding: '4px 8px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                🏁 {selectedJourney.toStopName}
              </div>
            </AdvancedMarker>
          </>
        )}
      </Map>

      {/* ── Pick-on-map mode (Attachment 2) ── */}
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
                          <img src={locationPinIcon} alt="Place" className="sugg-type-icon" />
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
                      <img src={locationPinIcon} alt="" className="qa-type-icon" />
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
                              src={r.resultType === 'stop' ? busStopIcon : locationPinIcon}
                              alt=""
                              className="recent-type-icon"
                            />
                          </span>
                          <span className="recent-info">
                            <span className="recent-name">{r.name}</span>
                            <span className="recent-sub">{r.subtitle}</span>
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
        <div className="journey-sheet">
          <div className="journey-sheet-header">
            <div>
              <div className="journey-sheet-title">
                {selectedJourney ? `Route ${selectedJourney.routeShortName}` : 'Recommended Routes'}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                {fromText || 'Current location'} → {toText || 'Destination'}
              </div>
            </div>
            <button className="journey-close-btn" onClick={() => {
              if (selectedJourney) {
                setSelectedJourney(null)
              } else {
                setShowJourneySheet(false)
              }
            }}>
              {selectedJourney ? '←' : '✕'}
            </button>
          </div>

          <div className="journey-sheet-body">
            {selectedJourney ? (
              /* Step-by-Step Route Breakdown View */
              <div className="step-timeline">
                {/* Step 1: Walk to Boarding Stop */}
                <div className="step-item">
                  <div className="step-line dashed" />
                  <div className="step-icon-badge walk">🚶</div>
                  <div className="step-content">
                    <div className="step-title">Walk {selectedJourney.walkDistance || 200}m (3 mins)</div>
                    <div className="step-sub">From {fromText || 'Current location'} to {selectedJourney.fromStopName}</div>
                  </div>
                </div>

                {/* Step 2: Board Bus / Metro */}
                <div className="step-item">
                  <div className="step-line" style={{ background: selectedJourney.isMetro ? '#2563eb' : '#d97706' }} />
                  <div className={`step-icon-badge ${selectedJourney.isMetro ? 'metro' : 'bus'}`}>
                    {selectedJourney.isMetro ? '🚇' : '🚌'}
                  </div>
                  <div className="step-content">
                    <div className="step-title">
                      Board {selectedJourney.isMetro ? 'Metro' : 'Bus'} {selectedJourney.routeShortName}
                    </div>
                    <div className="step-sub">At {selectedJourney.fromStopName} • Departs {selectedJourney.departureTime}</div>
                    <div className="step-badge-tag">
                      {selectedJourney.isTransfer ? `Ride to ${selectedJourney.transferStopName}` : `Ride 8 stops to ${selectedJourney.toStopName}`}
                    </div>
                  </div>
                </div>

                {/* Transfer Step if applicable */}
                {selectedJourney.isTransfer && selectedJourney.transferStopName && (
                  <div className="step-item">
                    <div className="step-line" style={{ background: '#d97706' }} />
                    <div className="step-icon-badge bus">🔄</div>
                    <div className="step-content">
                      <div className="step-title">Transfer at {selectedJourney.transferStopName}</div>
                      <div className="step-sub">Switch to Bus {selectedJourney.leg2Route} • Ride 5 stops to {selectedJourney.toStopName}</div>
                    </div>
                  </div>
                )}

                {/* Step 3: Alight at Destination Stop */}
                <div className="step-item">
                  <div className="step-line dashed" />
                  <div className="step-icon-badge bus">🚏</div>
                  <div className="step-content">
                    <div className="step-title">Alight at {selectedJourney.toStopName}</div>
                    <div className="step-sub">Destination stop</div>
                  </div>
                </div>

                {/* Step 4: Final Walk to Destination */}
                <div className="step-item">
                  <div className="step-icon-badge dest">🏁</div>
                  <div className="step-content">
                    <div className="step-title">Walk 150m (2 mins)</div>
                    <div className="step-sub">Arrive at {toText || 'Destination'}</div>
                  </div>
                </div>
              </div>
            ) : isSearchingJourneys ? (
              <div className="sugg-loading-full">
                <span className="sugg-spinner" />
                <span>Finding upcoming bus & metro options…</span>
              </div>
            ) : journeys.length > 0 ? (
              journeys.map((j) => (
                <div key={j.id} className="journey-card" onClick={() => setSelectedJourney(j)} role="button" tabIndex={0}>
                  <div className="journey-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="journey-route-tag">
                        {j.isMetro ? '🚇' : '🚌'} Bus {j.routeShortName}
                      </span>
                      {j.isTransfer && (
                        <span className="route-chip-badge express-chip">
                          1 Transfer
                        </span>
                      )}
                    </div>
                    <span className="journey-time">
                      {j.minutesUntilDeparture != null
                        ? j.minutesUntilDeparture <= 0
                          ? 'Departing now'
                          : `In ${j.minutesUntilDeparture} mins`
                        : j.departureTime}
                    </span>
                  </div>

                  {j.walkDistance && (
                    <div className="journey-leg-info">
                      <span>🚶 Walk {j.walkDistance}m to {j.fromStopName}</span>
                    </div>
                  )}

                  <div className="journey-leg-info">
                    <span>{j.isMetro ? '🚇' : '🚌'} {j.fromStopName} → {j.toStopName}</span>
                  </div>

                  {j.isTransfer && j.transferStopName && (
                    <div className="journey-leg-info" style={{ color: '#f59e0b' }}>
                      <span>🔄 Change bus at {j.transferStopName} (Leg 2: Bus {j.leg2Route})</span>
                    </div>
                  )}

                  <div style={{ fontSize: 12, color: '#38bdf8', fontWeight: 600, marginTop: 4 }}>
                    Tap to view map route & step-by-step detail →
                  </div>
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
