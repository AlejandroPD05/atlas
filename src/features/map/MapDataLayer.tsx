import { useMapData } from './useMapData'

/** Puente sin interfaz entre el estado global y las capas del mapa. */
export function MapDataLayer() {
  useMapData()
  return null
}
