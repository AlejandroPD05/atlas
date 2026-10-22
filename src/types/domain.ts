/* ═══════════════════════════════════════════════════════════════
   ATLAS · Modelo de dominio
   Regla de oro: todo dato mostrado declara su calidad —
   real (OSM), estimado, desconocido o demo (proveedor público).
   ═══════════════════════════════════════════════════════════════ */

/** Calidad de un dato mostrado en la interfaz. Nunca se mezclan sin etiquetar. */
export type DataQuality = 'real' | 'estimated' | 'unknown' | 'demo'

export interface LngLat {
  lng: number
  lat: number
}

export interface Bounds {
  west: number
  south: number
  east: number
  north: number
}

/* ── Lugares ─────────────────────────────────────────────────── */

export type PlaceCategoryId =
  | 'lugar'
  | 'direccion'
  | 'cafeteria'
  | 'restaurante'
  | 'bar'
  | 'panaderia'
  | 'supermercado'
  | 'farmacia'
  | 'hospital'
  | 'parque'
  | 'jardin'
  | 'mirador'
  | 'museo'
  | 'monumento'
  | 'hotel'
  | 'banco'
  | 'cajero'
  | 'gasolinera'
  | 'carga_ev'
  | 'aparcamiento'
  | 'estacion'
  | 'parada_bus'
  | 'biblioteca'
  | 'deporte'
  | 'tienda'
  | 'otros'

export interface Place {
  id: string
  name: string
  category: PlaceCategoryId
  address?: string
  coords: LngLat
  /** Procedencia del dato. Hoy: OpenStreetMap (vía Nominatim u Overpass). */
  source: 'osm'
  /** Calidad declarada del registro: nombres y direcciones de OSM = real. */
  quality: DataQuality
  /** Datos de contacto solo si la fuente los publica. */
  contact?: {
    website?: string
    phone?: string
    openingHours?: string
  }
  osm?: {
    type: 'node' | 'way' | 'relation' | string
    id: number
    tags?: Record<string, string>
  }
}

export interface SearchResult {
  id: string
  place: Place
  /** Distancia desde la ubicación del usuario, solo si esta está disponible. */
  distanceM?: number
}

/* ── Categorías ────────────────────────────────────────────── */

export interface PlaceCategory {
  id: PlaceCategoryId
  label: string
  group: 'comer' | 'comprar' | 'servicios' | 'cultura' | 'naturaleza' | 'movilidad' | 'salud' | 'otros'
  /** Fragmento Overpass (nwr) para buscar la categoría alrededor del mapa. */
  overpassFilter: string
  /** Palabras que el buscador interpreta como esta categoría. */
  keywords: string[]
}

/* ── Rutas ──────────────────────────────────────────────────── */

export type TravelMode = 'driving' | 'walking' | 'cycling' | 'transit'

export type RoutePreference = 'fast' | 'cheap' | 'calm' | 'scenic' | 'accessible' | 'explore'

export interface RouteEndpoint {
  /** Identificador estable para listas reordenables. */
  id: string
  kind: 'origin' | 'destination' | 'waypoint'
  label: string
  coords?: LngLat
  placeId?: string
  /** true cuando las coordenadas vienen de la geolocalización del navegador. */
  fromUserLocation?: boolean
}

export interface RouteStep {
  instruction: string
  distanceM: number
  durationS?: number
  name?: string
  maneuver?: string
}

export interface RouteLeg {
  distanceM: number
  durationS: number
  steps: RouteStep[]
}

export interface RouteNote {
  kind: 'info' | 'warn' | 'unknown'
  text: string
}

export interface RoutePlan {
  id: string
  mode: TravelMode
  preference: RoutePreference
  distanceM: number
  durationS: number
  /** Geometría [lng, lat][] devuelta por el proveedor. */
  geometry: [number, number][]
  legs: RouteLeg[]
  /** Notas honestas que la interfaz muestra junto a la ruta (datos que faltan, etc.). */
  notes: RouteNote[]
  provider: string
  providerIsDemo: boolean
  stops: RouteEndpoint[]
}

/* ── Guardados ──────────────────────────────────────────────── */

export interface SavedPlace {
  id: string
  name: string
  category: PlaceCategoryId
  coords: LngLat
  address?: string
  addedAt: number
}

export interface SavedCollection {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  places: SavedPlace[]
}

/* ── Preferencias y vista ───────────────────────────────────── */

export interface UserPreferences {
  units: 'metric' | 'imperial'
  /** true = animaciones reducidas · false = según el sistema operativo */
  reduceMotion: boolean
  /** capa de POI sobre el mapa activada */
  showPoiLayer: boolean
}

export interface MapViewport {
  center: LngLat
  zoom: number
  bearing: number
  pitch: number
}

/* ── Proveedores ────────────────────────────────────────────── */

export type ProviderId = 'tiles' | 'geocoding' | 'routing-driving' | 'routing-walking' | 'routing-cycling' | 'pois'

export interface ProviderStatus {
  id: ProviderId
  label: string
  /** true cuando apunta al servicio público de demo (con límites, sin SLA). */
  isDemo: boolean
  url: string
}
