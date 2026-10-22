import type { LngLat, Place } from '../../types/domain'

/** Interfaz de geocoding: cambiar de proveedor no toca la interfaz. */
export interface GeocoderSearchOptions {
  signal?: AbortSignal
  limit?: number
  /** Punto de referencia (no filtra; puede usarse para ordenar o contextualizar). */
  near?: LngLat
}

export interface Geocoder {
  readonly id: 'nominatim' | 'photon'
  readonly label: string
  readonly isDemo: boolean
  /** true solo cuando el proveedor permite autocompletado en su política de uso. */
  readonly supportsSuggestions: boolean
  search(query: string, opts?: GeocoderSearchOptions): Promise<Place[]>
}
