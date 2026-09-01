import { useEffect, useState } from 'react'
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps'
import './App.css'

// ─── Types ────────────────────────────────────────────────────────────────────
type LatLng = { lat: number; lng: number }

// ─── Constants ────────────────────────────────────────────────────────────────
const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''
const HYDERABAD: LatLng = { lat: 17.385, lng: 78.4867 }

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const [userPos, setUserPos] = useState<LatLng | null>(null)
  const [accuracy, setAccuracy] = useState(50)
  const [locError, setLocError] = useState<string | null>(null)

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
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocError('Location access denied. Please enable it in browser settings.')
            break
          case err.POSITION_UNAVAILABLE:
            setLocError('Location unavailable. Please try again.')
            break
          case err.TIMEOUT:
            setLocError('Location request timed out.')
            break
          default:
            setLocError('Could not get your location.')
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  const center = userPos ?? HYDERABAD

  return (
    <div className="app-shell">
      {/* Location error banner */}
      {locError && (
        <div className="loc-error-banner">
          <span className="loc-error-icon">📍</span>
          <span>{locError}</span>
        </div>
      )}

      {/* Google Map */}
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
          {/* Blue dot for user location */}
          {userPos && (
            <AdvancedMarker position={userPos}>
              <div className="blue-dot-wrapper">
                <div
                  className="blue-dot-accuracy"
                  style={{
                    width: Math.max(40, Math.min(accuracy * 2, 200)),
                    height: Math.max(40, Math.min(accuracy * 2, 200)),
                  }}
                />
                <div className="blue-dot" />
              </div>
            </AdvancedMarker>
          )}
        </Map>
      </APIProvider>

      {/* Bottom search bar */}
      <div className="bottom-bar">
        <div className="search-pill">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            type="text"
            placeholder="Where to?"
            className="search-input"
            readOnly
          />
          <button className="home-btn" aria-label="Home">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3l-10 9h3v9h6v-6h2v6h6v-9h3z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
