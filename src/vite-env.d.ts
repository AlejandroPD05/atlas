/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TILES_DARK_URL?: string
  readonly VITE_TILES_LIGHT_URL?: string
  readonly VITE_TILES_ATTRIBUTION?: string
  readonly VITE_GEOCODING_URL?: string
  readonly VITE_GEOCODING_PROVIDER?: 'nominatim' | 'photon'
  readonly VITE_ROUTING_URL?: string
  readonly VITE_ROUTING_URL_WALK?: string
  readonly VITE_ROUTING_URL_BIKE?: string
  readonly VITE_OVERPASS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
