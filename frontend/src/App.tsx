import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { APIProvider, Map, AdvancedMarker, useMapsLibrary, useMap } from '@vis.gl/react-google-maps'
import './App.css'
import busIcon from './assets/bus-icon.png'
import busStopIcon from './assets/bus-stop-icon.png'
import walkIcon from './assets/walk-icon.png'
import pinIcon from './assets/pin-icon.png'

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════
type LatLng = { lat: number; lng: number }
type Stop = { stopId: string; stopName: string; stopLat?: number; stopLon?: number }
type PlaceResult = { placeId: string; name: string; subtitle: string }
type SearchResult = { type: 'stop'; stop: Stop } | { type: 'place'; place: PlaceResult }
type RecentSearch = { name: string; subtitle: string; timestamp: number; resultType: 'stop' | 'place' }
type ActiveField = 'from' | 'to'
type Theme = 'dark' | 'light'

type JourneyOption = {
  id: string
  routeShortName: string
  departureTime: string
  minutesUntilDeparture?: number
  fromStopName: string
  toStopName: string
  isTransfer?: boolean
  transferStopName?: string
  isMetro?: boolean
  pathPoints?: LatLng[]
  intermediateStops?: string[]
  fare?: number
  totalMinutes?: number
}

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════
const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''
const API_URL = import.meta.env.VITE_API_URL ?? '/api'
const HYDERABAD: LatLng = { lat: 17.385, lng: 78.4867 }
const RECENTS_KEY = 'transit_recent_searches'
const MAX_RECENTS = 8
const STOP_SEARCH_LIMIT = 30
const SEARCH_DEBOUNCE_MS = 220
const PLACE_BIAS_RADIUS_M = 60_000
const MIN_QUERY_LEN = 2

const POPULAR_HYDERABAD_STOPS: Stop[] = [
  { stopId: 'STOP_SEC', stopName: 'Secunderabad Bus Station', stopLat: 17.4399, stopLon: 78.4983 },
  { stopId: 'STOP_MGBS', stopName: 'MGBS Bus Station (Mahatma Gandhi)', stopLat: 17.3789, stopLon: 78.4813 },
  { stopId: 'STOP_JBS', stopName: 'JBS Bus Station (Jubilee)', stopLat: 17.4503, stopLon: 78.4988 },
  { stopId: 'STOP_AMEER', stopName: 'Ameerpet Metro & Bus Stop', stopLat: 17.4375, stopLon: 78.4482 },
  { stopId: 'STOP_KOTI', stopName: 'Koti Bus Stand', stopLat: 17.3850, stopLon: 78.4867 },
  { stopId: 'STOP_HITEC', stopName: 'Hitec City Cyber Towers', stopLat: 17.4504, stopLon: 78.3808 },
  { stopId: 'STOP_DIL', stopName: 'Dilsukhnagar Bus Depot', stopLat: 17.3688, stopLon: 78.5247 },
  { stopId: 'STOP_GACHI', stopName: 'Gachibowli X Roads', stopLat: 17.4401, stopLon: 78.3489 },
  { stopId: 'STOP_KUKAT', stopName: 'Kukatpally Housing Board (KPHB)', stopLat: 17.4933, stopLon: 78.3994 },
  { stopId: 'STOP_MEHDI', stopName: 'Mehdipatnam Bus Stop', stopLat: 17.3950, stopLon: 78.4380 },
]

// ═══════════════════════════════════════════════════════════════════════════
// API helpers
// ═══════════════════════════════════════════════════════════════════════════
async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  const payload = await res.json()
  if (!res.ok) throw new Error(payload?.message ?? 'Request failed')
  return payload
}

async function searchStopsByName(name: string, size = STOP_SEARCH_LIMIT, signal?: AbortSignal): Promise<Stop[]> {
  try {
    const url = name.trim()
      ? `${API_URL}/stops/search?name=${encodeURIComponent(name)}&size=${size}`
      : `${API_URL}/stops?size=${size}`
    const payload = await fetchJson<any>(url, signal)
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.data)
        ? payload.data
        : (payload.data?.content ?? payload.content ?? [])
    if (list.length > 0) {
      return list.map((s: any) => ({
        stopId: String(s.stopId ?? s.id ?? ''),
        stopName: String(s.stopName ?? s.name ?? ''),
        stopLat: s.stopLat ?? s.lat,
        stopLon: s.stopLon ?? s.lon ?? s.lng,
      })).filter((s: Stop) => s.stopId && s.stopName)
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
  }

  const q = sanitize(name)
  if (!q) return POPULAR_HYDERABAD_STOPS
  const tokens = tokenize(name)
  const matched = POPULAR_HYDERABAD_STOPS.filter(s => {
    const sName = sanitize(s.stopName)
    return sName.includes(q) || tokens.some(t => sName.includes(t))
  })
  return matched.length > 0 ? matched : POPULAR_HYDERABAD_STOPS
}

async function fetchJourneys(fromStopId: string, toStopId: string): Promise<any[]> {
  const payload = await fetchJson<{ data?: any[] }>(
    `${API_URL}/journeys/search?fromStopId=${fromStopId}&toStopId=${toStopId}&limit=10`,
  ).catch(() => ({ data: [] }))
  return payload.data ?? []
}

// ═══════════════════════════════════════════════════════════════════════════
// Text utilities
// ═══════════════════════════════════════════════════════════════════════════
function sanitize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
}

function displayName(name: string): string {
  return name.replace(/\s+/g, ' ').trim()
}

function tokenize(value: string): string[] {
  return sanitize(value).split(' ').filter(t => t.length >= 2)
}

// ═══════════════════════════════════════════════════════════════════════════
// Stop dedup & ranking
// ═══════════════════════════════════════════════════════════════════════════
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

function rankStops(stops: Stop[], query: string): Stop[] {
  const q = sanitize(query)
  const tokens = tokenize(query)
  const ranked = [...dedupeById(stops)].sort((a, b) => {
    const diff = scoreStop(b, q, tokens) - scoreStop(a, q, tokens)
    return diff !== 0 ? diff : a.stopName.localeCompare(b.stopName)
  })
  return dedupeByName(ranked)
}

// ═══════════════════════════════════════════════════════════════════════════
// LocalStorage — recent searches
// ═══════════════════════════════════════════════════════════════════════════
function loadRecents(): RecentSearch[] {
  try { return JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]') }
  catch { return [] }
}

function saveRecent(entry: RecentSearch) {
  const list = loadRecents().filter(r => r.name !== entry.name)
  list.unshift(entry)
  localStorage.setItem(RECENTS_KEY, JSON.stringify(list.slice(0, MAX_RECENTS)))
}

// ═══════════════════════════════════════════════════════════════════════════
// SVG Icons
// ═══════════════════════════════════════════════════════════════════════════
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
function WorkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="icon-svg">
      <path d="M20 7h-4V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 5h4v2h-4V5z" />
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
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M18.99 4.93l-1.41 1.41" />
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-svg">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  )
}
function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}
function GoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="icon-svg">
      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Map polyline overlay
// ═══════════════════════════════════════════════════════════════════════════
function RoutePolyline({
  path,
  color = '#6C6BD9',
  isDashed = false,
  fitMap = false,
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
      strokeOpacity: isDashed ? 0 : 0.95,
      strokeWeight: 6,
      icons: isDashed ? [{
        icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
        offset: '0',
        repeat: '12px',
      }] : undefined,
    })
    line.setMap(map)

    if (fitMap) {
      const bounds = new google.maps.LatLngBounds()
      path.forEach(pt => bounds.extend(pt))
      map.fitBounds(bounds, { top: 90, bottom: 220, left: 30, right: 30 })
    }

    return () => line.setMap(null)
  }, [map, path, color, isDashed, fitMap])

  return null
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook: Google Places autocomplete
//
// The old code called `new google.maps.places.AutocompleteSuggestion()` +
// `.PlacePrediction()`, neither of which exist on the Maps JS API — it threw
// on every keystroke and was swallowed by a catch block, so place suggestions
// never appeared. That's fixed below using the real static method,
// `AutocompleteSuggestion.fetchAutocompleteSuggestions`.
//
// That method belongs to "Places API (New)", a separate product from the
// classic "Places API" in Google Cloud — many existing API keys only have
// the classic one enabled, which would make every call here fail silently
// too. So we also fall back to the classic `AutocompleteService` whenever
// the new API errors out or returns nothing, which only needs the classic
// Places API to be enabled.
// ═══════════════════════════════════════════════════════════════════════════
function usePlacesAutocomplete() {
  const placesLib = useMapsLibrary('places')
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
  const legacyServiceRef = useRef<google.maps.places.AutocompleteService | null>(null)

  useEffect(() => {
    if (!placesLib) return
    sessionTokenRef.current = new placesLib.AutocompleteSessionToken()
    legacyServiceRef.current = new placesLib.AutocompleteService()
  }, [placesLib])

  const searchWithNewApi = useCallback(async (query: string): Promise<PlaceResult[]> => {
    if (!placesLib) return []
    if (!sessionTokenRef.current) sessionTokenRef.current = new placesLib.AutocompleteSessionToken()

    const { suggestions } = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: query,
      sessionToken: sessionTokenRef.current,
      locationBias: { center: HYDERABAD, radius: PLACE_BIAS_RADIUS_M },
      includedRegionCodes: ['in'],
    })

    return suggestions
      .map(s => s.placePrediction)
      .filter((p): p is google.maps.places.PlacePrediction => !!p)
      .slice(0, 5)
      .map(p => ({
        placeId: p.placeId,
        name: p.mainText?.text ?? p.text.text,
        subtitle: p.secondaryText?.text ?? '',
      }))
  }, [placesLib])

  const searchWithLegacyApi = useCallback((query: string): Promise<PlaceResult[]> => {
    const service = legacyServiceRef.current
    if (!service) return Promise.resolve([])

    return new Promise(resolve => {
      service.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'in' },
          locationBias: new google.maps.Circle({ center: HYDERABAD, radius: PLACE_BIAS_RADIUS_M }),
        },
        (predictions, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
            resolve([])
            return
          }
          resolve(predictions.slice(0, 5).map(p => ({
            placeId: p.place_id,
            name: p.structured_formatting?.main_text ?? p.description,
            subtitle: p.structured_formatting?.secondary_text ?? '',
          })))
        },
      )
    })
  }, [])

  const search = useCallback(async (query: string): Promise<PlaceResult[]> => {
    if (!placesLib || query.trim().length < MIN_QUERY_LEN) return []

    try {
      const results = await searchWithNewApi(query)
      if (results.length > 0) return results
    } catch (err) {
      console.error('Places API (New) autocomplete failed, falling back to classic API:', err)
    }

    try {
      return await searchWithLegacyApi(query)
    } catch (err) {
      console.error('Classic Places autocomplete also failed:', err)
      return []
    }
  }, [placesLib, searchWithNewApi, searchWithLegacyApi])

  // Resolve a chosen place's coordinates — Autocomplete predictions never
  // include lat/lng, only a placeId, so this is a second lookup fired once
  // the person actually taps a suggestion.
  const resolveLocation = useCallback(async (placeId: string): Promise<LatLng | null> => {
    if (!placesLib) return null
    try {
      const place = new placesLib.Place({ id: placeId })
      await place.fetchFields({ fields: ['location'] })
      const loc = place.location
      return loc ? { lat: loc.lat(), lng: loc.lng() } : null
    } catch (err) {
      console.error('Failed to resolve place location:', err)
      return null
    }
  }, [placesLib])

  // Call once a place is actually chosen (or the search is abandoned) so
  // billing sessions don't bleed across unrelated searches.
  const resetSession = useCallback(() => {
    if (placesLib) sessionTokenRef.current = new placesLib.AutocompleteSessionToken()
  }, [placesLib])

  return { search, resolveLocation, ready: !!placesLib, resetSession }
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook: geolocation watcher
// ═══════════════════════════════════════════════════════════════════════════
const GEO_ERROR_MESSAGES: Record<number, string> = {
  1: 'Location access denied. Enable it in browser settings.',
  2: 'Location unavailable. Please try again.',
  3: 'Location request timed out.',
}

function useUserLocation() {
  const [position, setPosition] = useState<LatLng | null>(null)
  const [accuracy, setAccuracy] = useState(50)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }
    const watchId = navigator.geolocation.watchPosition(
      pos => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setAccuracy(pos.coords.accuracy)
        setError(null)
      },
      err => setError(GEO_ERROR_MESSAGES[err.code] ?? 'Could not get your location.'),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 5_000 },
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return { position, accuracy, error }
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook: combined stop + place search (debounced, cached, race-safe)
// ═══════════════════════════════════════════════════════════════════════════
function useLocationSearch(
  active: boolean,
  query: string,
  placesReady: boolean,
  searchPlaces: (q: string) => Promise<PlaceResult[]>,
) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const cacheRef = useRef<globalThis.Map<string, Stop[]>>(new globalThis.Map())
  const reqIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!active) { setResults([]); setIsLoading(false); return }

    const trimmed = query.trim()
    const key = sanitize(trimmed)
    if (key.length < MIN_QUERY_LEN) { setResults([]); setIsLoading(false); return }

    const cache = cacheRef.current
    const cached = cache.get(key)
    if (cached) setResults(cached.slice(0, 6).map(s => ({ type: 'stop' as const, stop: s })))

    const requestId = ++reqIdRef.current
    setIsLoading(true)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const timer = window.setTimeout(async () => {
      try {
        const [stops, places] = await Promise.all([
          searchStopsByName(trimmed, STOP_SEARCH_LIMIT, controller.signal),
          placesReady ? searchPlaces(trimmed) : Promise.resolve([]),
        ])
        if (reqIdRef.current !== requestId) return

        const ranked = rankStops(stops, trimmed)
        cache.set(key, ranked)

        setResults([
          ...ranked.slice(0, 6).map(s => ({ type: 'stop' as const, stop: s })),
          ...places.slice(0, 4).map(p => ({ type: 'place' as const, place: p })),
        ])
      } catch (err) {
        if (reqIdRef.current !== requestId) return
        if (!(err instanceof DOMException && err.name === 'AbortError') && !cached) setResults([])
      } finally {
        if (reqIdRef.current === requestId) setIsLoading(false)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [active, query, placesReady, searchPlaces])

  return { results, isLoading }
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook: journey planning
// ═══════════════════════════════════════════════════════════════════════════
function useJourneyPlanner(userPos: LatLng | null) {
  const [isSearching, setIsSearching] = useState(false)
  const [journeys, setJourneys] = useState<JourneyOption[]>([])
  const [selected, setSelected] = useState<JourneyOption | null>(null)

  const plan = useCallback(async (
    startName: string,
    destName: string,
    startStop?: Stop | null,
    destStop?: Stop | null,
    _originLatLngOverride?: LatLng,
    _destLatLngOverride?: LatLng,
  ) => {
    setSelected(null)
    setIsSearching(true)
    setJourneys([])

    try {
      let fStop = startStop ?? null
      let tStop = destStop ?? null

      if (!fStop) {
        const found = await searchStopsByName(startName === 'Current location' ? '' : startName, 3)
        fStop = found[0] ?? null
      }
      if (!tStop) {
        const found = await searchStopsByName(destName, 3)
        tStop = found[0] ?? null
      }

      const fId = fStop?.stopId ?? ''
      const tId = tStop?.stopId ?? ''
      if (!fId || !tId) { setJourneys([]); return }

      const fName = fStop?.stopName || startName || 'Start Stop'
      const tName = tStop?.stopName || destName || 'Destination Stop'
      const fLat = fStop?.stopLat ?? userPos?.lat
      const fLon = fStop?.stopLon ?? userPos?.lng
      const tLat = tStop?.stopLat
      const tLon = tStop?.stopLon

      const rawList = await fetchJourneys(fId, tId)
      const parsed: JourneyOption[] = rawList.map((j: any, i: number) => ({
        id: j.tripId ? `${j.tripId}-${i}` : `journey-${i}`,
        routeShortName: j.routeShortName || '',
        departureTime: j.departureTime || '',
        minutesUntilDeparture: j.minutesUntilDeparture ?? undefined,
        fromStopName: j.fromStopName || fName,
        toStopName: j.toStopName || tName,
        fare: j.fare ?? undefined,
        totalMinutes: j.totalMinutes ?? undefined,
        intermediateStops: j.intermediateStops || [],
        pathPoints: (fLat != null && fLon != null && tLat != null && tLon != null)
          ? [{ lat: fLat, lng: fLon }, { lat: tLat, lng: tLon }]
          : undefined,
      }))

      setJourneys(parsed)
    } catch {
      setJourneys([])
    } finally {
      setIsSearching(false)
    }
  }, [userPos])

  const reset = useCallback(() => {
    setJourneys([])
    setSelected(null)
    setIsSearching(false)
  }, [])

  return { isSearching, journeys, selected, setSelected, plan, reset }
}

// ═══════════════════════════════════════════════════════════════════════════
// Inner App
// ═══════════════════════════════════════════════════════════════════════════
function AppInner() {
  const [theme, setTheme] = useState<Theme>('light')

  // Location
  const { position: userPos, accuracy, error: locError } = useUserLocation()

  // Search overlay state
  const [showSearch, setShowSearch] = useState(false)
  const [dualMode, setDualMode] = useState(false)
  const [fromText, setFromText] = useState('')
  const [toText, setToText] = useState('')
  const [activeField, setActiveField] = useState<ActiveField>('to')
  const [fromStop, setFromStop] = useState<Stop | null>(null)
  const [toStop, setToStop] = useState<Stop | null>(null)
  const [recents, setRecents] = useState<RecentSearch[]>(loadRecents)

  // "Choose on map" state
  const [pickOnMap, setPickOnMap] = useState(false)
  const [pickCenter, setPickCenter] = useState<LatLng | null>(null)

  // Journey sheet UI state
  const [showJourneySheet, setShowJourneySheet] = useState(false)
  const [showStopsAccordion, setShowStopsAccordion] = useState(true)
  const [sheetMode, setSheetMode] = useState<'expanded' | 'peek'>('expanded')

  const toInputRef = useRef<HTMLInputElement>(null)
  const fromInputRef = useRef<HTMLInputElement>(null)
  const singleInputRef = useRef<HTMLInputElement>(null)

  const { search: searchPlaces, ready: placesReady, resetSession: resetPlacesSession } = usePlacesAutocomplete()
  const journeyPlanner = useJourneyPlanner(userPos)
  const { isSearching: isSearchingJourneys, journeys, selected: selectedJourney, setSelected: setSelectedJourney, plan: triggerJourneySearch, reset: resetJourneys } = journeyPlanner

  const activeText = dualMode ? (activeField === 'from' ? fromText : toText) : toText
  const { results, isLoading } = useLocationSearch(showSearch, activeText, placesReady, searchPlaces)

  // ── Browser back / hardware back handling ──
  const pushNavState = useCallback((name: string) => {
    try { window.history.pushState({ page: name }, '') } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      if (selectedJourney) setSelectedJourney(null)
      else if (showJourneySheet) setShowJourneySheet(false)
      else if (showSearch) setShowSearch(false)
      else if (pickOnMap) setPickOnMap(false)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [selectedJourney, showJourneySheet, showSearch, pickOnMap, setSelectedJourney])

  // ── Auto-focus active input when the search overlay opens ──
  useEffect(() => {
    if (!showSearch) return
    const timer = setTimeout(() => {
      if (dualMode) (activeField === 'from' ? fromInputRef : toInputRef).current?.focus()
      else singleInputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [showSearch, dualMode, activeField])

  // ── Actions ──
  const toggleTheme = useCallback(() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark')), [])

  const openSearch = useCallback(() => {
    setShowSearch(true)
    setDualMode(false)
    setToText('')
    setActiveField('to')
    setPickOnMap(false)
    setShowJourneySheet(false)
    setSelectedJourney(null)
    pushNavState('search')
  }, [pushNavState, setSelectedJourney])

  const closeSearch = useCallback(() => {
    setShowSearch(false)
    setDualMode(false)
    setFromText('')
    setToText('')
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
      if (activeField === 'to') { setToText(label); dName = label }
      else { setFromText(label); sName = label }
    } else {
      setToText(label)
      dName = label
    }

    setPickOnMap(false)

    if (dName) {
      setShowJourneySheet(true)
      setSheetMode('expanded')
      pushNavState('journey-results')
      triggerJourneySearch(sName, dName, fromStop, toStop)
    } else {
      setShowSearch(true)
    }
  }, [pickCenter, dualMode, activeField, fromText, toText, fromStop, toStop, triggerJourneySearch, pushNavState])

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
  }, [])

  const swapFields = useCallback(() => {
    setFromText(toText)
    setToText(fromText)
    setFromStop(toStop)
    setToStop(fromStop)
  }, [fromText, toText, fromStop, toStop])

  const runJourneyFor = useCallback((sName: string, dName: string, sStop: Stop | null, dStop: Stop | null) => {
    setShowSearch(false)
    setShowJourneySheet(true)
    setSheetMode('expanded')
    pushNavState('journey-results')
    triggerJourneySearch(sName, dName, sStop, dStop)
  }, [triggerJourneySearch, pushNavState])

  const chooseResult = useCallback((result: SearchResult) => {
    const name = result.type === 'stop' ? displayName(result.stop.stopName) : result.place.name
    const subtitle = result.type === 'stop' ? 'Bus Station' : (result.place.subtitle || 'Google Place')

    let sName = fromText || 'Current location'
    let dName = toText
    let newFStop = fromStop
    let newTStop = toStop

    if (dualMode) {
      if (activeField === 'to') {
        setToText(name); dName = name
        if (result.type === 'stop') { setToStop(result.stop); newTStop = result.stop }
      } else {
        setFromText(name); sName = name
        if (result.type === 'stop') { setFromStop(result.stop); newFStop = result.stop }
      }
    } else {
      setToText(name); dName = name
      if (result.type === 'stop') { setToStop(result.stop); newTStop = result.stop }
    }

    if (result.type === 'place') resetPlacesSession()

    saveRecent({ name, subtitle, timestamp: Date.now(), resultType: result.type })
    setRecents(loadRecents())

    if (dName) runJourneyFor(sName, dName, newFStop, newTStop)
  }, [dualMode, activeField, fromText, toText, fromStop, toStop, runJourneyFor, resetPlacesSession])

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

    if (dName) runJourneyFor(sName, dName, fromStop, toStop)
  }, [dualMode, activeField, fromText, toText, fromStop, toStop, runJourneyFor])

  const selectCurrentLocation = useCallback(() => {
    if (!dualMode) return
    setFromText('Current location')
    setActiveField('to')
    toInputRef.current?.focus()
  }, [dualMode])

  const closeJourneySheet = useCallback(() => {
    setShowJourneySheet(false)
    resetJourneys()
  }, [resetJourneys])

  // ── Derived view state ──
  const center = userPos ?? HYDERABAD
  const hasActiveQuery = sanitize(activeText.trim()).length >= MIN_QUERY_LEN
  const showResults = showSearch && hasActiveQuery
  const stopResults = useMemo(() => results.filter((r): r is Extract<SearchResult, { type: 'stop' }> => r.type === 'stop'), [results])
  const placeResults = useMemo(() => results.filter((r): r is Extract<SearchResult, { type: 'place' }> => r.type === 'place'), [results])

  const originPt = userPos ?? (selectedJourney?.pathPoints?.[0] ?? HYDERABAD)
  const boardPt = selectedJourney?.pathPoints?.[0] ?? originPt
  const alightPt = selectedJourney?.pathPoints?.[selectedJourney.pathPoints.length - 1] ?? originPt
  const destPt = selectedJourney?.pathPoints?.[selectedJourney.pathPoints.length - 1] ?? alightPt

  const walkLeg1Path: LatLng[] = [originPt, boardPt]
  const transitPath: LatLng[] = selectedJourney?.pathPoints ?? [boardPt, alightPt]
  const walkLeg2Path: LatLng[] = [alightPt, destPt]

  const isDirectBusStopPair = Boolean(
    fromText !== 'Current location' &&
    (fromStop || fromText.toLowerCase().includes('stop') || fromText.toLowerCase().includes('stand')) &&
    (toStop || toText.toLowerCase().includes('stop') || toText.toLowerCase().includes('stand')),
  )

  return (
    <div className="app-shell" data-theme={theme}>
      {/* ── Back pill when a route is selected ── */}
      {selectedJourney && (
        <button className="back-btn-pill" onClick={() => setSelectedJourney(null)} aria-label="Back to all routes">
          <BackIcon />
        </button>
      )}

      {/* ── Theme toggle ── */}
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

      {/* ── Map ── */}
      <Map
        defaultCenter={center}
        defaultZoom={userPos ? 16 : 13}
        center={userPos ? center : undefined}
        zoom={userPos ? 16 : undefined}
        gestureHandling="greedy"
        disableDefaultUI
        mapId="transit-dark-map"
        colorScheme={theme === 'dark' ? 'DARK' : 'LIGHT'}
        className="map-container"
        onCameraChanged={pickOnMap ? (ev) => setPickCenter({ lat: ev.detail.center.lat, lng: ev.detail.center.lng }) : undefined}
      >
        {userPos && (
          <AdvancedMarker position={userPos}>
            <div className="blue-dot-wrapper">
              <div
                className="blue-dot-accuracy"
                style={{ width: Math.max(40, Math.min(accuracy * 2, 200)), height: Math.max(40, Math.min(accuracy * 2, 200)) }}
              />
              <div className="blue-dot" />
            </div>
          </AdvancedMarker>
        )}

        {selectedJourney && (
          <>
            {!isDirectBusStopPair && <RoutePolyline path={walkLeg1Path} color="#8A93A6" isDashed />}
            <RoutePolyline path={transitPath} color={selectedJourney.isMetro ? '#3E63DD' : '#4B3FD9'} fitMap />
            {!isDirectBusStopPair && <RoutePolyline path={walkLeg2Path} color="#8A93A6" isDashed />}

            <AdvancedMarker position={boardPt}>
              <div className="map-node-badge map-node-start">Start · {selectedJourney.fromStopName}</div>
            </AdvancedMarker>

            {selectedJourney.intermediateStops?.map((sName, idx) => {
              const count = (selectedJourney.intermediateStops?.length ?? 0) + 1
              const fraction = (idx + 1) / count
              const lat = boardPt.lat + (alightPt.lat - boardPt.lat) * fraction
              const lng = boardPt.lng + (alightPt.lng - boardPt.lng) * fraction
              return (
                <AdvancedMarker key={idx} position={{ lat, lng }}>
                  <div className="map-node-dot" title={sName} />
                </AdvancedMarker>
              )
            })}

            <AdvancedMarker position={alightPt}>
              <div className="map-node-badge map-node-end">End · {selectedJourney.toStopName}</div>
            </AdvancedMarker>
          </>
        )}

        {!selectedJourney && POPULAR_HYDERABAD_STOPS.map(stop => (
          stop.stopLat && stop.stopLon ? (
            <AdvancedMarker
              key={stop.stopId}
              position={{ lat: stop.stopLat, lng: stop.stopLon }}
              onClick={() => {
                setToStop(stop)
                setToText(stop.stopName)
                setShowSearch(true)
              }}
            >
              <div className="map-stop-pin" title={stop.stopName}>
                <img src={busStopIcon} alt={stop.stopName} className="map-stop-pin-icon" />
              </div>
            </AdvancedMarker>
          ) : null
        ))}
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
            <button className="map-pick-go" onClick={confirmPickOnMap} aria-label="Confirm location">
              <GoIcon />
            </button>
          </div>
        </>
      )}

      {/* ── Bottom search pill ── */}
      {!showSearch && !pickOnMap && !showJourneySheet && (
        <div className="bottom-bar">
          <div
            className="search-pill"
            onClick={openSearch}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && openSearch()}
          >
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
                        onBlur={() => { if (fromText.trim() === '') setFromText('Current location') }}
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
                <button className="swap-btn" onClick={swapFields} aria-label="Swap start and destination">
                  <SwapIcon />
                </button>
              </div>
            ) : (
              <div className="search-header-single">
                <button className="search-back-btn" onClick={closeSearch} aria-label="Close search">
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
                    <span>Searching stops &amp; places…</span>
                  </div>
                )}

                {!isLoading && stopResults.length === 0 && placeResults.length === 0 && (
                  <div className="sugg-empty">
                    <p>No matches for "{activeText.trim()}"</p>
                    <p className="sugg-empty-hint">Try a nearby landmark or bus stand name</p>
                  </div>
                )}

                {stopResults.length > 0 && (
                  <>
                    <div className="search-section-header">Stops &amp; stations</div>
                    {stopResults.map(r => (
                      <button key={r.stop.stopId} className="suggestion-item" onClick={() => chooseResult(r)}>
                        <span className="sugg-icon">
                          <img src={busStopIcon} alt="" className="sugg-type-icon" />
                        </span>
                        <span className="sugg-info">
                          <span className="sugg-name">{displayName(r.stop.stopName)}</span>
                          <span className="sugg-sub">Bus Station</span>
                        </span>
                        <ChevronRightIcon />
                      </button>
                    ))}
                  </>
                )}

                {placeResults.length > 0 && (
                  <>
                    <div className="search-section-header">Places</div>
                    {placeResults.map((r, i) => (
                      <button key={r.place.placeId + i} className="suggestion-item" onClick={() => chooseResult(r)}>
                        <span className="sugg-icon">
                          <img src={pinIcon} alt="" className="sugg-type-icon" />
                        </span>
                        <span className="sugg-info">
                          <span className="sugg-name">{r.place.name}</span>
                          <span className="sugg-sub">{r.place.subtitle}</span>
                        </span>
                        <ChevronRightIcon />
                      </button>
                    ))}
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="quick-actions">
                  <button className="quick-action-card" onClick={startPickOnMap}>
                    <span className="qa-icon"><img src={pinIcon} alt="" className="qa-type-icon" /></span>
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
                        <span className="qa-icon qa-icon-work"><WorkIcon /></span>
                        <span className="qa-label">Set work</span>
                        <ChevronRightIcon />
                      </button>
                    </>
                  )}
                </div>

                {recents.length > 0 && (
                  <div className="recents-section">
                    <div className="search-section-header">Recent</div>
                    <div className="recents-list">
                      {recents.map((r, i) => (
                        <button key={`${r.name}-${i}`} className="recent-item" onClick={() => selectRecent(r)}>
                          <span className="recent-icon">
                            <img src={r.resultType === 'stop' ? busStopIcon : pinIcon} alt="" className="recent-type-icon" />
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

                <div className="recents-section">
                  <div className="search-section-header">Popular Bus Stops</div>
                  <div className="recents-list">
                    {POPULAR_HYDERABAD_STOPS.slice(0, 6).map(s => (
                      <button key={s.stopId} className="recent-item" onClick={() => chooseResult({ type: 'stop', stop: s })}>
                        <span className="recent-icon">
                          <img src={busStopIcon} alt="" className="recent-type-icon" />
                        </span>
                        <span className="recent-info">
                          <span className="recent-name">{s.stopName}</span>
                          <span className="recent-sub">Bus Station</span>
                        </span>
                        <ChevronRightIcon />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Journey results / route detail sheet ── */}
      {showJourneySheet && (
        <div className={`journey-sheet mode-${sheetMode}`}>
          <div className="sheet-drag-handle-bar" onClick={() => setSheetMode(prev => (prev === 'peek' ? 'expanded' : 'peek'))}>
            <div className="sheet-drag-handle" />
          </div>

          <div className="journey-sheet-header">
            <button className="sheet-close-btn" onClick={closeJourneySheet} aria-label="Close">
              <BackIcon />
            </button>
            <div className="journey-sheet-title">
              {selectedJourney ? (selectedJourney.totalMinutes ? `${selectedJourney.totalMinutes} min` : 'Route path') : 'Recommended routes'}
            </div>
            {selectedJourney?.fare != null && (
              <div className="journey-sheet-fare">₹{selectedJourney.fare}</div>
            )}
          </div>

          <div className="journey-sheet-body">
            {selectedJourney ? (
              <div className="timeline-container">
                <div className="timeline-line" />

                {!isDirectBusStopPair && (
                  <div className="timeline-step">
                    <div className="timeline-node-icon">
                      <img src={walkIcon} alt="Walk" style={{ width: 22, height: 22 }} />
                    </div>
                    <div className="timeline-step-label">Walk</div>
                    <div className="detail-card">
                      <div className="detail-card-row detail-card-label">To</div>
                      <div className="detail-card-row detail-card-strong">
                        <img src={busStopIcon} alt="" style={{ width: 22, height: 22 }} />
                        <span>{selectedJourney.fromStopName}</span>
                      </div>
                    </div>
                  </div>
                )}

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
                      <div className="detail-card-eta">Scheduled in {selectedJourney.minutesUntilDeparture} min</div>
                    )}

                    <div className="detail-card-row detail-card-strong">From {selectedJourney.fromStopName}</div>

                    {selectedJourney.intermediateStops && selectedJourney.intermediateStops.length > 0 && (
                      <>
                        <button className="accordion-btn" onClick={() => setShowStopsAccordion(prev => !prev)}>
                          <span className="accordion-count">
                            {selectedJourney.intermediateStops.length + 2} stops {showStopsAccordion ? '▲' : '▼'}
                          </span>
                          {selectedJourney.fare != null && <span className="accordion-fare">₹{selectedJourney.fare}</span>}
                        </button>

                        {showStopsAccordion && (
                          <div className="stop-tree-list">
                            <div className="stop-tree-item stop-tree-item-strong">
                              <span className="stop-circle-dot" />
                              <span>{selectedJourney.fromStopName}</span>
                            </div>
                            {selectedJourney.intermediateStops.map((stopName, idx) => (
                              <div key={idx} className="stop-tree-item">
                                <span className="stop-circle-dot" />
                                <span>{stopName}</span>
                              </div>
                            ))}
                            <div className="stop-tree-item stop-tree-item-strong">
                              <span className="stop-circle-dot stop-circle-dot-end" />
                              <span>{selectedJourney.toStopName}</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className="detail-card-row detail-card-strong">To {selectedJourney.toStopName}</div>
                  </div>
                </div>

                {!isDirectBusStopPair && (
                  <div className="timeline-step">
                    <div className="timeline-node-icon">
                      <img src={pinIcon} alt="Pin" style={{ width: 22, height: 22 }} />
                    </div>
                    <div className="timeline-step-label">Destination</div>
                    <div className="detail-card">
                      <div className="detail-card-row detail-card-strong">
                        <img src={pinIcon} alt="" style={{ width: 22, height: 22 }} />
                        <span>{toText || selectedJourney.toStopName}</span>
                      </div>
                      <div className="detail-card-hint">Your destination</div>
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
              journeys.map(j => (
                <div key={j.id} className="journey-card" onClick={() => setSelectedJourney(j)} role="button" tabIndex={0}>
                  <div className="journey-card-header">
                    <div className="journey-card-header-left">
                      <span className="journey-route-tag">
                        <img src={busIcon} alt="" style={{ width: 18, height: 18 }} className="journey-route-tag-icon" />
                        <span>{j.routeShortName ? `Route ${j.routeShortName}` : 'Transit route'}</span>
                      </span>
                      {j.isTransfer && <span className="route-chip-badge express-chip">1 transfer</span>}
                    </div>
                    {j.minutesUntilDeparture != null && (
                      <span className="journey-time">
                        {j.minutesUntilDeparture <= 0 ? 'Departing now' : `In ${j.minutesUntilDeparture} min`}
                      </span>
                    )}
                  </div>

                  <div className="journey-leg-info">
                    <img src={busStopIcon} alt="" style={{ width: 16, height: 16 }} />
                    <span>{j.fromStopName} → {j.toStopName}</span>
                  </div>

                  {j.isTransfer && j.transferStopName && (
                    <div className="journey-leg-info journey-leg-transfer">
                      <span>Change bus at {j.transferStopName}</span>
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

// ═══════════════════════════════════════════════════════════════════════════
// Root App
// ═══════════════════════════════════════════════════════════════════════════
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