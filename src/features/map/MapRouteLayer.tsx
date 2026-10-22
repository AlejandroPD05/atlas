import { useMapRoute } from './useMapRoute'

/** Puente sin interfaz entre la ruta planificada y las capas del mapa. */
export function MapRouteLayer() {
  useMapRoute()
  return null
}
