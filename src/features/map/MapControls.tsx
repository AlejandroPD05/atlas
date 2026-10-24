import { useEffect, useRef, useState } from 'react'
import {
  Check,
  Compass,
  Fullscreen,
  Layers,
  LocateFixed,
  Minus,
  Plus,
  X,
} from 'lucide-react'
import { appConfig } from '../../app/config'
import { useAppStore } from '../../store/appStore'
import { useGeolocation } from '../../hooks/useGeolocation'
import { Spinner } from '../../components/ui'
import { useMapInstance } from './mapInstance'
import { useUserMarker } from './useUserMarker'
import styles from './MapControls.module.css'

/** Controles propios sobre el mapa: zoom, ubicación, orientación, capas y pantalla completa. */
export function MapControls() {
  const map = useMapInstance()
  const sideCollapsed = useAppStore((s) => s.sideCollapsed)
  const basemapId = useAppStore((s) => s.basemapId)
  const setBasemapId = useAppStore((s) => s.setBasemapId)
  const showPoiLayer = useAppStore((s) => s.prefs.showPoiLayer)
  const updatePrefs = useAppStore((s) => s.updatePrefs)
  const geo = useGeolocation()
  useUserMarker()

  const [rotated, setRotated] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [layersOpen, setLayersOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const flewToRef = useRef<string | null>(null)

  /* Orientación: mostrar botón de brújula solo si hay rotación o inclinación */
  useEffect(() => {
    if (!map) return
    const onRotate = () => setRotated(map.getBearing() !== 0 || map.getPitch() !== 0)
    map.on('rotate', onRotate)
    map.on('pitch', onRotate)
    onRotate()
    return () => {
      map.off('rotate', onRotate)
      map.off('pitch', onRotate)
    }
  }, [map])

  /* Pantalla completa del conjunto (mapa + interfaz) */
  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  /* Al obtener la ubicación por primera vez, volar hasta ella */
  useEffect(() => {
    if (!map || !geo.coords) return
    const key = `${geo.coords.lng},${geo.coords.lat}`
    if (flewToRef.current === key) return
    flewToRef.current = key
    map.flyTo({ center: [geo.coords.lng, geo.coords.lat], zoom: Math.max(map.getZoom(), 15), duration: 1100 })
  }, [map, geo.coords])

  /* Cerrar el panel de capas con clic fuera o Escape */
  useEffect(() => {
    if (!layersOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLayersOpen(false)
    }
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setLayersOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [layersOpen])

  const locate = () => {
    const loc = useAppStore.getState().userLocation
    if (loc && map) {
      map.flyTo({ center: [loc.lng, loc.lat], zoom: Math.max(map.getZoom(), 15), duration: 1100 })
      return
    }
    geo.request()
  }

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void document.getElementById('atlas-root')?.requestFullscreen()
    }
  }

  const disabled = map === null

  return (
    <div
      ref={wrapRef}
      className={`${styles.controls} ${sideCollapsed ? styles.shiftedCollapsed : styles.shifted}`}
    >
      <div className={styles.group}>
        <button
          type="button"
          className={styles.btn}
          aria-label="Acercar"
          title="Acercar"
          disabled={disabled}
          onClick={() => map?.zoomIn({ duration: 220 })}
        >
          <Plus size={17} />
        </button>
        <button
          type="button"
          className={styles.btn}
          aria-label="Alejar"
          title="Alejar"
          disabled={disabled}
          onClick={() => map?.zoomOut({ duration: 220 })}
        >
          <Minus size={17} />
        </button>
        {rotated && (
          <button
            type="button"
            className={styles.btn}
            aria-label="Restablecer orientación"
            title="Restablecer orientación"
            disabled={disabled}
            onClick={() => map?.easeTo({ bearing: 0, pitch: 0, duration: 500 })}
          >
            <Compass size={17} />
          </button>
        )}
      </div>

      <div className={styles.group}>
        <button
          type="button"
          className={styles.btn}
          aria-label="Mi ubicación"
          title="Mi ubicación"
          disabled={geo.status === 'requesting'}
          onClick={locate}
        >
          {geo.status === 'requesting' ? <Spinner size={16} label="Obteniendo ubicación" /> : <LocateFixed size={17} />}
        </button>
        <button
          type="button"
          className={styles.btn}
          aria-label={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          onClick={toggleFullscreen}
        >
          {fullscreen ? <X size={17} /> : <Fullscreen size={17} />}
        </button>
        <button
          type="button"
          className={styles.btn}
          aria-label="Capas del mapa"
          title="Capas del mapa"
          aria-expanded={layersOpen}
          onClick={() => setLayersOpen((v) => !v)}
        >
          <Layers size={17} />
        </button>
      </div>

      {layersOpen && (
        <div className={styles.pop} role="group" aria-label="Capas del mapa">
          <p className={styles.popLabel}>Mapa base</p>
          {appConfig.basemaps.map((b) => (
            <button
              key={b.id}
              type="button"
              role="menuitemradio"
              aria-checked={basemapId === b.id}
              className={styles.layerItem}
              onClick={() => setBasemapId(b.id)}
            >
              <span className={styles.layerText}>
                <span>{b.label}</span>
                {b.hint && <span className={styles.layerHint}>{b.hint}</span>}
              </span>
              {basemapId === b.id && <Check size={14} />}
            </button>
          ))}
          <div className={styles.popDivider} />
          <label className={styles.popToggle}>
            <input
              type="checkbox"
              checked={showPoiLayer}
              onChange={(e) => updatePrefs({ showPoiLayer: e.target.checked })}
            />
            <span>Puntos de interés</span>
          </label>
          <p className={styles.popHint}>Atribución de datos e imágenes visible en el mapa</p>
        </div>
      )}
    </div>
  )
}
