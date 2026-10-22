import type { LngLat, ProviderStatus } from '../types/domain'

/* ═══════════════════════════════════════════════════════════════
   ATLAS · Configuración de proveedores
   Todo es configurable por .env. Los valores por defecto apuntan a
   servicios públicos de DEMO (con límites de uso y sin SLA).
   ═══════════════════════════════════════════════════════════════ */

export interface BasemapDef {
  id: 'dark' | 'light'
  label: string
  tiles: string[]
  attribution: string
}

export interface ProviderDef {
  url: string
  isDemo: boolean
}

const env = import.meta.env

const CARTO_SUBDOMAINS = ['a', 'b', 'c', 'd']

function cartoTiles(style: string): string[] {
  return CARTO_SUBDOMAINS.map(
    (sub) => `https://${sub}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}.png`,
  )
}

const tileAttribution = env.VITE_TILES_ATTRIBUTION ?? '© OpenStreetMap contributors © CARTO'

const darkTiles = env.VITE_TILES_DARK_URL ? [env.VITE_TILES_DARK_URL] : cartoTiles('dark_all')
const lightTiles = env.VITE_TILES_LIGHT_URL ? [env.VITE_TILES_LIGHT_URL] : cartoTiles('light_all')

export const appConfig = {
  name: 'ATLAS',
  tagline: 'Rutas según cómo quieres vivirlas',

  basemaps: [
    { id: 'dark', label: 'Oscuro', tiles: darkTiles, attribution: tileAttribution },
    { id: 'light', label: 'Claro', tiles: lightTiles, attribution: tileAttribution },
  ] satisfies BasemapDef[],

  defaultViewport: {
    center: { lng: -3.7038, lat: 40.4168 } satisfies LngLat,
    zoom: 12,
    bearing: 0,
    pitch: 0,
  },

  geocoding: {
    url: env.VITE_GEOCODING_URL ?? 'https://nominatim.openstreetmap.org',
    isDemo: env.VITE_GEOCODING_URL === undefined,
  } satisfies ProviderDef,

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
  const out: ProviderStatus[] = [
    { id: 'tiles', label: 'Mapa base', isDemo: true, url: appConfig.basemaps[0].tiles[0] ?? '' },
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
