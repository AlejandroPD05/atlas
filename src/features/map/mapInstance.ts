import type { Map } from 'maplibre-gl'
import { useSyncExternalStore } from 'react'

/* Instancia única del mapa, accesible desde cualquier feature
   sin acoplar los componentes de interfaz a MapLibre. */

let instance: Map | null = null
const listeners = new Set<() => void>()

export function setMapInstance(map: Map | null): void {
  instance = map
  listeners.forEach((l) => l())
}

export function getMapInstance(): Map | null {
  return instance
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Hook: devuelve el mapa cuando está listo (estilo cargado) o null. */
export function useMapInstance(): Map | null {
  return useSyncExternalStore(subscribe, getMapInstance, getMapInstance)
}
