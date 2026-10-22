import type { LngLat, ProviderStatus } from '../types/domain'

/* ═══════════════════════════════════════════════════════════════
   ATLAS · Configuración de proveedores
   Todo es configurable por .env. Los valores por defecto apuntan a
   servicios públicos de DEMO (con límites de uso y sin SLA).
   ═══════════════════════════════════════════════════════════════ */

export interface BasemapDef {
  id: 'dark' | 'light'
  label: string
  /** URL de un estilo vectorial completo (por defecto, OpenFreeMap). */
  styleUrl?: string
  /** Teselas raster propias; si existen, sustituyen al estilo vectorial. */
  tiles?: string[]
  attribution?: string
}

export interface ProviderDef {
  url: string
  isDemo: boolean
}

const env = import.meta.env

/* Mapa base: OpenFreeMap (vectorial, gratuito, sin clave) por defecto.
   Atribución obligatoria incluida en su TileJSON. Si se configuran teselas
   raster propias (VITE_TILES_*), se usan en su lugar. */
const vectorDarkUrl = env.VITE_STYLE_DARK_URL ?? 'https://tiles.openfreemap.org/styles/dark'
const vectorLightUrl = env.VITE_STYLE_LIGHT_URL ?? 'https://tiles.openfreemap.org/styles/positron'
const rasterAttribution = env.VITE_TILES_ATTRIBUTION ?? '© OpenStreetMap contributors'

const customDarkTiles = env.VITE_TILES_DARK_URL ? [env.VITE_TILES_DARK_URL] : null
const customLightTiles = env.VITE_TILES_LIGHT_URL ? [env.VITE_TILES_LIGHT_URL] : null

const basemaps: BasemapDef[] = [
  customDarkTiles
    ? { id: 'dark', label: 'Oscuro', tiles: customDarkTiles, attribution: rasterAttribution }
    : { id: 'dark', label: 'Oscuro', styleUrl: vectorDarkUrl },
  customLightTiles
    ? { id: 'light', label: 'Claro', tiles: customLightTiles, attribution: rasterAttribution }
    : { id: 'light', label: 'Claro', styleUrl: vectorLightUrl },
]

/* Geocoding: Nominatim no permite autocompletado en su política de uso.
   Photon (opcional) sí ofrece sugerencias; se activa por env. */
const geocodingProvider: 'nominatim' | 'photon' =
  env.VITE_GEOCODING_PROVIDER === 'photon' || (env.VITE_GEOCODING_URL ?? '').includes('photon')
    ? 'photon'
    : 'nominatim'

const geocodingUrl =
  env.VITE_GEOCODING_URL ??
  (geocodingProvider === 'photon' ? 'https://photon.komoot.io' : 'https://nominatim.openstreetmap.org')

export const appConfig = {
  name: 'ATLAS',
  tagline: 'Rutas según cómo quieres vivirlas',

  basemaps,

  defaultViewport: {
    center: { lng: -3.7038, lat: 40.4168 } satisfies LngLat,
    zoom: 12,
    bearing: 0,
    pitch: 0,
  },

  geocoding: {
    provider: geocodingProvider,
    url: geocodingUrl,
    isDemo: env.VITE_GEOCODING_URL === undefined,
    supportsSuggestions: geocodingProvider === 'photon',
  } satisfies ProviderDef & {
    provider: 'nominatim' | 'photon'
    supportsSuggestions: boolean
  },

  routing: {
    driving: {
      url: env.VITE_ROUTING_URL ?? 'https://router.project-osrm.org',
      isDemo: env.VITE_ROUTING_URL === undefined,
    } satisfies ProviderDef,
    walking: env.VITE_ROUTING_URL_WALK
      ? ({ url: env.VITE_ROUTING_URL_WALK, isDemo: false } satisfies ProviderDef)
      : null,
    cycling: env.VITE_ROUTING_URL_BIKE
      ? ({ url: env.VITE_ROUTING_URL_BIKE, isDemo: false } satisfies ProviderDef)
      : null,
    transit: null,
  },

  pois: {
    url: env.VITE_OVERPASS_URL ?? 'https://overpass-api.de/api/interpreter',
    isDemo: env.VITE_OVERPASS_URL === undefined,
  } satisfies ProviderDef,
} as const

/** Estado de proveedores para mostrar en la interfaz con honestidad. */
export function providerStatuses(): ProviderStatus[] {
  const basemap = appConfig.basemaps[0]
  const out: ProviderStatus[] = [
    {
      id: 'tiles',
      label: 'Mapa base',
      isDemo: true,
      url: basemap.styleUrl ?? basemap.tiles?.[0] ?? '',
    },
    { id: 'geocoding', label: 'Búsqueda', isDemo: appConfig.geocoding.isDemo, url: appConfig.geocoding.url },
    {
      id: 'routing-driving',
      label: 'Rutas en coche',
      isDemo: appConfig.routing.driving.isDemo,
      url: appConfig.routing.driving.url,
    },
    { id: 'pois', label: 'Lugares (POI)', isDemo: appConfig.pois.isDemo, url: appConfig.pois.url },
  ]
  return out
}

/** Modos de transporte disponibles según los proveedores configurados. */
export function availableModes(): {
  mode: 'driving' | 'walking' | 'cycling' | 'transit'
  available: boolean
  reason?: string
}[] {
  return [
    { mode: 'driving', available: true },
    {
      mode: 'walking',
      available: appConfig.routing.walking !== null,
      reason: 'Requiere un servidor de rutas a pie (VITE_ROUTING_URL_WALK).',
    },
    {
      mode: 'cycling',
      available: appConfig.routing.cycling !== null,
      reason: 'Requiere un servidor de rutas en bici (VITE_ROUTING_URL_BIKE).',
    },
    {
      mode: 'transit',
      available: false,
      reason: 'Sin proveedor de transporte público configurado.',
    },
  ]
}
