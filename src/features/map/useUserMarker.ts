import { Marker } from 'maplibre-gl'
import { useEffect } from 'react'
import { useAppStore } from '../../store/appStore'
import { useMapInstance } from './mapInstance'
import styles from './UserMarker.module.css'

/** Punto azul de ubicación del usuario (solo cuando hay permiso y posición). */
export function useUserMarker(): void {
  const map = useMapInstance()
  const coords = useAppStore((s) => s.userLocation)

  useEffect(() => {
    if (!map || !coords) return

    const el = document.createElement('div')
    el.className = styles.marker
    el.setAttribute('aria-hidden', 'true')
    const pulse = document.createElement('span')
    pulse.className = styles.pulse
    const dot = document.createElement('span')
    dot.className = styles.dot
    el.append(pulse, dot)

    const marker = new Marker({ element: el, anchor: 'center' })
      .setLngLat([coords.lng, coords.lat])
      .addTo(map)

    return () => {
      marker.remove()
    }
  }, [map, coords])
}
