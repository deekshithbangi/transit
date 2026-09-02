import { useCallback, useEffect, useRef, useState } from 'react'
import { APIProvider, Map, AdvancedMarker, useMapsLibrary } from '@vis.gl/react-google-maps'
import './App.css'
import busStopIcon from './assets/bus-stop-icon.png'
import locationPinIcon from './assets/location-pin-icon.png'

// ─── Types ────────────────────────────────────────────────────────────────────
type LatLng = { lat: number; lng: number }
type Stop = { stopId: string; stopName: string; stopLat?: number; stopLon?: number }
type PlaceResult = { placeId: string; name: string; subtitle: string }
type SearchResult = { type: 'stop'; stop: Stop } | { type: 'place'; place: PlaceResult }
type RecentSearch = { name: string; subtitle: string; timestamp: number; resultType: 'stop' | 'place' }

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

// ─── Text utilities ───────────────────────────────────────────────────────────
function sanitize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
}

function displayName(name: string): string {
  return name.replace(/\s+/g, ' ').trim()
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

// ─── Google Places hook ───────────────────────────────────────────────────────
function usePlacesAutocomplete() {
  const places = useMapsLibrary('places')
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null)

  useEffect(() => {
    if (places) {
      // Use the global google.maps.places AutocompleteService constructor
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
          radius: 100_000, // 100km around Hyderabad
        } as unknown as google.maps.places.LocationBias,
      })
      return (res.predictions ?? []).slice(0, 5).map(p => ({
        placeId: // AutocompletePrediction uses snake_case in types
          // prefer place_id when available
          (p as any).place_id ?? ((p as any).placeId as string | undefined) ?? '',
        name: (p as any).structured_formatting?.main_text ?? p.description,
        subtitle: (p as any).structured_formatting?.secondary_text ?? '',
      }))
    } catch {
      return []
    }
  }, [])

  return { search, ready: !!places }
}

// ─── Inner App (needs to be inside APIProvider) ───────────────────────────────
function AppInner() {
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

  const toInputRef     = useRef<HTMLInputElement>(null)
  const fromInputRef   = useRef<HTMLInputElement>(null)
  const singleInputRef = useRef<HTMLInputElement>(null)
  const cacheRef       = useRef<globalThis.Map<string, Stop[]>>(new globalThis.Map())
  const reqIdRef       = useRef(0)
  const touchStartRef  = useRef<{ x: number; y: number } | null>(null)

  // "Choose on map" state
  const [pickOnMap, setPickOnMap]       = useState(false)
  const [pickCenter, setPickCenter]    = useState<LatLng | null>(null)

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

    // Show cached stop results immediately
    if (cached) {
      setResults(cached.slice(0, 5).map(s => ({ type: 'stop' as const, stop: s })))
    }

    const id = ++reqIdRef.current
    setIsLoading(true)

    const timer = window.setTimeout(async () => {
      try {
        // Fire both searches in parallel
        const [stops, places] = await Promise.all([
          searchStopsByName(activeText.trim(), STOP_SEARCH_LIMIT),
          placesReady ? searchPlaces(activeText.trim()) : Promise.resolve([]),
        ])

        if (reqIdRef.current !== id) return

        const ranked = rankStops(stops, activeText.trim())
        cache.set(q, ranked)

        // Merge: stops first (max 6), then places (max 4)
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

  // ── Actions ──
  const openSearch = useCallback(() => {
    setShowSearch(true)
    setDualMode(false)
    setToText('')
    setActiveField('to')
    setResults([])
    setPickOnMap(false)
  }, [])

  const closeSearch = useCallback(() => {
    setShowSearch(false)
    setDualMode(false)
    setFromText('')
    setToText('')
    setResults([])
    setPickOnMap(false)
  }, [])

  // ── Choose on map ──
  const startPickOnMap = useCallback(() => {
    setPickOnMap(true)
    setShowSearch(false)
    setPickCenter(userPos ?? HYDERABAD)
  }, [userPos])

  const confirmPickOnMap = useCallback(() => {
    if (!pickCenter) return
    const label = `${pickCenter.lat.toFixed(5)}, ${pickCenter.lng.toFixed(5)}`
    if (dualMode) {
      if (activeField === 'to') setToText(label)
      else setFromText(label)
    } else {
      setToText(label)
    }
    setPickOnMap(false)
    setShowSearch(true)
  }, [pickCenter, dualMode, activeField])

  const cancelPickOnMap = useCallback(() => {
    setPickOnMap(false)
    setShowSearch(true)
  }, [])

  // Touch handlers: simple swipe-right-to-go-back (close search)
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    if (t) touchStartRef.current = { x: t.clientX, y: t.clientY }
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const start = touchStartRef.current
    touchStartRef.current = null
    if (!start) return
    const t = e.changedTouches[0]
    if (!t) return
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    // consider a horizontal right swipe with limited vertical movement
    if (dx > 50 && Math.abs(dy) < 50) {
      closeSearch()
    }
  }, [closeSearch])

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

    if (dualMode) {
      if (activeField === 'to') {
        setToText(name)
        if (result.type === 'stop') setToStop(result.stop)
      } else {
        setFromText(name)
        if (result.type === 'stop') setFromStop(result.stop)
      }
    } else {
      setToText(name)
      if (result.type === 'stop') setToStop(result.stop)
    }
    setResults([])

    const entry: RecentSearch = {
      name, subtitle, timestamp: Date.now(),
      resultType: result.type,
    }
    saveRecent(entry)
    setRecents(loadRecents())
  }, [dualMode, activeField])

  const selectRecent = useCallback((recent: RecentSearch) => {
    if (dualMode) {
      if (activeField === 'to') setToText(recent.name)
      else setFromText(recent.name)
    } else {
      setToText(recent.name)
    }
    saveRecent(recent)
    setRecents(loadRecents())
    setResults([])
  }, [dualMode, activeField])

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

  return (
    <>
      {/* ── Location error banner ── */}
      {locError && !showSearch && (
        <div className="loc-error-banner">
          <span className="loc-error-icon">📍</span>
          <span>{locError}</span>
        </div>
      )}

      {/* ── Google Map ── */}
      <Map
        defaultCenter={center}
        defaultZoom={userPos ? 16 : 13}
        center={userPos ? center : undefined}
        zoom={userPos ? 16 : undefined}
        gestureHandling="greedy"
        disableDefaultUI={false}
        zoomControl={true}
        scrollwheel={true}
        streetViewControl={false}
        mapTypeControl={false}
        mapId="transit-dark-map"
        colorScheme="DARK"
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
      </Map>

      {/* ── Pick-on-map mode: center pin + confirm/cancel ── */}
      {pickOnMap && (
        <>
          <div className="map-pin-center">
            <svg viewBox="0 0 24 36" width="36" height="54">
              <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#e91e63" />
              <circle cx="12" cy="12" r="5" fill="#fff" />
            </svg>
          </div>
          <div className="map-pick-actions">
            <button className="map-pick-cancel" onClick={cancelPickOnMap}>Cancel</button>
            <button className="map-pick-confirm" onClick={confirmPickOnMap}>Choose this location</button>
          </div>
        </>
      )}

      {/* ── Bottom search pill ── */}
      {!showSearch && (
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
        <div className="search-overlay" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {/* Green header */}
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

          {/* Search body */}
          <div className="search-body">
            {showResults ? (
              /* ── Search results (stops + places) ── */
              <div className="suggestions-list">
                {isLoading && (
                  <div className="sugg-loading">
                    <span className="sugg-spinner" />
                    <span>Searching…</span>
                  </div>
                )}
                {results.map((r, i) => (
                  <button
                    key={r.type === 'stop' ? r.stop.stopId : r.place.placeId + i}
                    className="suggestion-item"
                    onClick={() => chooseResult(r)}
                  >
                    <span className="sugg-icon">
                      <img
                        src={r.type === 'stop' ? busStopIcon : locationPinIcon}
                        alt={r.type === 'stop' ? 'Bus stop' : 'Place'}
                        className="sugg-type-icon"
                      />
                    </span>
                    <span className="sugg-info">
                      <span className="sugg-name">
                        {r.type === 'stop' ? displayName(r.stop.stopName) : r.place.name}
                      </span>
                      <span className="sugg-sub">
                        {r.type === 'stop' ? 'Bus Stop' : r.place.subtitle}
                      </span>
                    </span>
                    {r.type === 'stop' && (
                      <span className="sugg-badge">TGSRTC</span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <>
                {/* ── Quick actions ── */}
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

                {/* ── Recent searches ── */}
                {recents.length > 0 && (
                  <div className="recents-section">
                    <p className="recents-label">RECENT</p>
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

            {/* Loading with no cached results */}
            {hasActiveQuery && results.length === 0 && isLoading && (
              <div className="sugg-loading-full">
                <span className="sugg-spinner" />
                <span>Searching stops & places…</span>
              </div>
            )}

            {/* No results */}
            {hasActiveQuery && results.length === 0 && !isLoading && (
              <div className="sugg-empty">
                <SearchIcon />
                <p>No stops or places found for "{activeText.trim()}"</p>
                <p className="sugg-empty-hint">Try a different spelling or shorter name</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ─── Root App (wraps APIProvider) ─────────────────────────────────────────────
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
