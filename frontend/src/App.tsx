import { useCallback, useEffect, useRef, useState } from 'react'
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps'
import './App.css'

// ─── Types ────────────────────────────────────────────────────────────────────
type LatLng = { lat: number; lng: number }
type RecentSearch = { name: string; subtitle: string; timestamp: number }

// ─── Constants ────────────────────────────────────────────────────────────────
const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''
const HYDERABAD: LatLng = { lat: 17.385, lng: 78.4867 }
const RECENTS_KEY = 'transit_recent_searches'
const MAX_RECENTS = 8

// ─── LocalStorage helpers ─────────────────────────────────────────────────────
function loadRecents(): RecentSearch[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]')
  } catch { return [] }
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

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-svg">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="icon-svg">
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
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

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  // Location state
  const [userPos, setUserPos] = useState<LatLng | null>(null)
  const [accuracy, setAccuracy] = useState(50)
  const [locError, setLocError] = useState<string | null>(null)
  const [locationName, setLocationName] = useState('Current location')

  // Search state
  const [showSearch, setShowSearch] = useState(false)
  const [dualMode, setDualMode] = useState(false)
  const [fromText, setFromText] = useState('')
  const [toText, setToText] = useState('')
  const [activeField, setActiveField] = useState<'from' | 'to'>('to')
  const [recents, setRecents] = useState<RecentSearch[]>(loadRecents)

  const toInputRef = useRef<HTMLInputElement>(null)
  const fromInputRef = useRef<HTMLInputElement>(null)
  const singleInputRef = useRef<HTMLInputElement>(null)

  // Request high-accuracy location on mount
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
          1: 'Location access denied. Please enable it in browser settings.',
          2: 'Location unavailable. Please try again.',
          3: 'Location request timed out.',
        }
        setLocError(msgs[err.code] || 'Could not get your location.')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  // Reverse geocode user location for display name
  useEffect(() => {
    if (!userPos) return
    setLocationName(`${userPos.lat.toFixed(4)}, ${userPos.lng.toFixed(4)}`)
  }, [userPos])

  // Auto-focus input when search opens
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

  // Open search overlay
  const openSearch = useCallback(() => {
    setShowSearch(true)
    setDualMode(false)
    setToText('')
    setActiveField('to')
  }, [])

  // Close search overlay
  const closeSearch = useCallback(() => {
    setShowSearch(false)
    setDualMode(false)
    setFromText('')
    setToText('')
  }, [])

  // Toggle single ↔ dual mode
  const toggleDualMode = useCallback(() => {
    setDualMode(prev => {
      if (!prev) {
        // Switching to dual: set "from" to current location
        setFromText(locationName)
        setActiveField('to')
      }
      return !prev
    })
  }, [locationName])

  // Swap from ↔ to
  const swapFields = useCallback(() => {
    setFromText(prev => {
      const old = prev
      setToText(current => {
        setFromText(current)
        return old
      })
      return prev // will be overwritten
    })
    // Simpler approach:
    const f = fromText
    const t = toText
    setFromText(t)
    setToText(f)
  }, [fromText, toText])

  // Select a recent search
  const selectRecent = useCallback((recent: RecentSearch) => {
    if (dualMode) {
      if (activeField === 'to') setToText(recent.name)
      else setFromText(recent.name)
    } else {
      setToText(recent.name)
    }
    // Save to recents
    saveRecent(recent)
    setRecents(loadRecents())
  }, [dualMode, activeField])

  // Select "Current location" as from
  const selectCurrentLocation = useCallback(() => {
    if (dualMode) {
      setFromText(locationName)
      setActiveField('to')
      toInputRef.current?.focus()
    }
  }, [dualMode, locationName])

  const center = userPos ?? HYDERABAD

  return (
    <div className="app-shell">
      {/* ── Location error banner ── */}
      {locError && !showSearch && (
        <div className="loc-error-banner">
          <span className="loc-error-icon">📍</span>
          <span>{locError}</span>
        </div>
      )}

      {/* ── Google Map (always mounted) ── */}
      <APIProvider apiKey={GOOGLE_MAPS_KEY}>
        <Map
          defaultCenter={center}
          defaultZoom={userPos ? 16 : 13}
          center={userPos ? center : undefined}
          zoom={userPos ? 16 : undefined}
          gestureHandling="greedy"
          disableDefaultUI={true}
          mapId="transit-dark-map"
          colorScheme="DARK"
          className="map-container"
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
      </APIProvider>

      {/* ── Bottom search pill (map view) ── */}
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
        <div className="search-overlay">
          {/* Green header */}
          <div className="search-header">
            {dualMode ? (
              /* ── Dual mode: from + to fields ── */
              <div className="search-header-dual">
                <button className="search-back-btn" onClick={closeSearch} aria-label="Back">
                  <BackIcon />
                </button>
                <div className="search-fields-dual">
                  <div className={`search-field-row ${activeField === 'from' ? 'active' : ''}`}>
                    <span className="field-dot field-dot-from"><LocationIcon /></span>
                    <input
                      ref={fromInputRef}
                      type="text"
                      className="search-field-input"
                      placeholder="Current location"
                      value={fromText}
                      onChange={e => setFromText(e.target.value)}
                      onFocus={() => setActiveField('from')}
                    />
                  </div>
                  <div className={`search-field-row ${activeField === 'to' ? 'active' : ''}`}>
                    <span className="field-dot field-dot-to" />
                    <input
                      ref={toInputRef}
                      type="text"
                      className="search-field-input"
                      placeholder="Destination"
                      value={toText}
                      onChange={e => setToText(e.target.value)}
                      onFocus={() => setActiveField('to')}
                    />
                  </div>
                </div>
                <button className="swap-btn" onClick={swapFields} aria-label="Swap start and destination">
                  <SwapIcon />
                </button>
              </div>
            ) : (
              /* ── Single mode: destination only ── */
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
                  onChange={e => setToText(e.target.value)}
                />
                <button className="swap-btn" onClick={toggleDualMode} aria-label="Add starting point">
                  <SwapIcon />
                </button>
              </div>
            )}
          </div>

          {/* Search body */}
          <div className="search-body">
            {/* Quick actions */}
            <div className="quick-actions">
              <button className="quick-action-card">
                <span className="qa-icon"><PinIcon /></span>
                <span className="qa-label">Choose on map</span>
                <ChevronRightIcon />
              </button>

              {dualMode && userPos && (
                <button className="quick-action-card" onClick={selectCurrentLocation}>
                  <span className="qa-icon"><LocationIcon /></span>
                  <span className="qa-info">
                    <span className="qa-label">Current location</span>
                    <span className="qa-sub">{locationName}</span>
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

              <button className="quick-action-card">
                <span className="qa-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-svg">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
                  </svg>
                </span>
                <span className="qa-label">Show upcoming events</span>
                <ChevronRightIcon />
              </button>
            </div>

            {/* Recent searches */}
            {recents.length > 0 && (
              <div className="recents-section">
                <p className="recents-label">RECENT</p>
                <div className="recents-list">
                  {recents.map((r, i) => (
                    <button key={`${r.name}-${i}`} className="recent-item" onClick={() => selectRecent(r)}>
                      <span className="recent-icon"><PinIcon /></span>
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
          </div>
        </div>
      )}
    </div>
  )
}

export default App
