import { useEffect, useRef, useState } from 'react'
import { Map } from 'maplibre-gl'
import './maplibreSetup'
import { appConfig } from '../../app/config'
import { useAppStore } from '../../store/appStore'
import { Button } from '../../components/ui'
import { addAtlasOverlays, baseStyleForBasemap } from './basemap'
import { setMapInstance } from './mapInstance'
import styles from './MapView.module.css'

const SESSION_KEY = 'atlas.viewport'

interface SessionViewport {
  lng: number
  lat: number
  zoom: number
  bearing: number
  pitch: number
}

function readSessionViewport(): SessionViewport | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Partial<SessionViewport>
    if (typeof p.lng !== 'number' || typeof p.lat !== 'number') return null
    return {
      lng: p.lng,
      lat: p.lat,
      zoom: typeof p.zoom === 'number' ? p.zoom : appConfig.defaultViewport.zoom,
      bearing: typeof p.bearing === 'number' ? p.bearing : 0,
      pitch: typeof p.pitch === 'number' ? p.pitch : 0,
    }
  } catch {
    return null
  }
}

/** Mapa real con MapLibre. El resto de features hablan con el mapa
    a través de mapInstance y de sus propias capas GeoJSON. */
export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const basemapId = useAppStore((s) => s.basemapId)
  const [failed, setFailed] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const def = appConfig.basemaps.find((b) => b.id === basemapId) ?? appConfig.basemaps[0]!
    const initial = readSessionViewport()
    const store = useAppStore.getState()

    let loaded = false
    let disposed = false
    let saveTimer: number | undefined

    const map = new Map({
      container: el,
      style: baseStyleForBasemap(def),
      center: initial ? [initial.lng, initial.lat] : [store.viewport.center.lng, store.viewport.center.lat],
      zoom: initial ? initial.zoom : store.viewport.zoom,
      bearing: initial ? initial.bearing : 0,
      pitch: initial ? initial.pitch : 0,
      maxPitch: 60,
      fadeDuration: 120,
      attributionControl: {
        compact: false,
        customAttribution: 'ATLAS',
      },
    })

    map.on('load', () => {
      /* Las capas propias se añaden después del estilo vectorial. */
      addAtlasOverlays(map)
      loaded = true
      setFailed(null)
      setMapInstance(map)
    })

    map.on('error', (e) => {
      /* Errores sueltos de tiles no bloquean: solo avisamos si el estilo nunca cargó. */
      if (disposed) return
      if (!loaded) {
        console.warn('[atlas] Error al cargar el mapa:', e.error?.message ?? e)
        setFailed(e.error?.message ?? 'Error desconocido del proveedor de mapa.')
      }
    })

    const onMoveEnd = () => {
      const c = map.getCenter()
      const v = {
        center: { lng: c.lng, lat: c.lat },
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      }
      useAppStore.getState().setViewport(v)
      if (saveTimer !== undefined) window.clearTimeout(saveTimer)
      saveTimer = window.setTimeout(() => {
        try {
          sessionStorage.setItem(
            SESSION_KEY,
            JSON.stringify({ lng: v.center.lng, lat: v.center.lat, zoom: v.zoom, bearing: v.bearing, pitch: v.pitch }),
          )
        } catch {
          /* modo privado sin sessionStorage: se ignora */
        }
      }, 400)
    }
    map.on('moveend', onMoveEnd)

    return () => {
      disposed = true
      if (saveTimer !== undefined) window.clearTimeout(saveTimer)
      setMapInstance(null)
      map.remove()
    }
  }, [basemapId, reloadKey])

  return (
    <div className={styles.wrap} id="atlas-map" aria-label="Mapa interactivo">
      <div ref={containerRef} className={styles.map} />
      {failed && (
        <div className={styles.fail} role="alert">
          <p className={styles.failTitle}>No se pudieron cargar los datos del mapa</p>
          <p className={styles.failHint}>
            Comprueba tu conexión. Si usas un proveedor de tiles propio, revisa su configuración.
          </p>
          <p className={styles.failDetail}>{failed}</p>
          <Button
            variant="outline"
            small
            onClick={() => {
              setFailed(null)
              setReloadKey((k) => k + 1)
            }}
          >
            Reintentar
          </Button>
        </div>
      )}
    </div>
  )
}
