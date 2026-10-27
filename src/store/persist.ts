import type { PoiRadiusM, SavedCollection, SavedPlace, UserPreferences } from '../types/domain'
import { POI_RADII_M } from '../types/domain'
import { isValidLngLat } from '../utils/geo'
import { uid } from '../utils/id'

/* Saneado de datos persistidos en localStorage.
   Regla: si algo no cumple el esquema, se descarta en lugar de romper la app. */

export const defaultPreferences: UserPreferences = {
  units: 'metric',
  reduceMotion: false,
  showPoiLayer: true,
  poiRadiusM: 1500,
}

function sanitizePoiRadius(raw: unknown): PoiRadiusM {
  return POI_RADII_M.includes(raw as PoiRadiusM) ? (raw as PoiRadiusM) : defaultPreferences.poiRadiusM
}

export function sanitizePreferences(raw: unknown): UserPreferences {
  if (typeof raw !== 'object' || raw === null) return { ...defaultPreferences }
  const r = raw as Record<string, unknown>
  return {
    units: r.units === 'imperial' ? 'imperial' : 'metric',
    reduceMotion: r.reduceMotion === true,
    showPoiLayer: typeof r.showPoiLayer === 'boolean' ? r.showPoiLayer : true,
    poiRadiusM: sanitizePoiRadius(r.poiRadiusM),
  }
}

export function sanitizeStringArray(raw: unknown, max = 8): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).slice(0, max)
}

function sanitizeSavedPlace(raw: unknown): SavedPlace | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string' || typeof r.name !== 'string' || r.name.trim() === '') return null
  if (!isValidLngLat(r.coords)) return null
  const coords = r.coords as { lng: number; lat: number }
  return {
    id: r.id,
    name: r.name,
    category: typeof r.category === 'string' ? (r.category as SavedPlace['category']) : 'otros',
    coords: { lng: coords.lng, lat: coords.lat },
    ...(typeof r.address === 'string' ? { address: r.address } : {}),
    addedAt: typeof r.addedAt === 'number' && Number.isFinite(r.addedAt) ? r.addedAt : Date.now(),
  }
}

export function sanitizeCollections(raw: unknown): SavedCollection[] {
  if (!Array.isArray(raw)) return []
  const out: SavedCollection[] = []
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue
    const c = item as Record<string, unknown>
    if (typeof c.id !== 'string' || c.id.trim() === '') continue
    if (typeof c.name !== 'string' || c.name.trim() === '') continue
    const places = Array.isArray(c.places)
      ? c.places.map(sanitizeSavedPlace).filter((p): p is SavedPlace => p !== null)
      : []
    out.push({
      id: c.id,
      name: c.name,
      createdAt: typeof c.createdAt === 'number' ? c.createdAt : Date.now(),
      updatedAt: typeof c.updatedAt === 'number' ? c.updatedAt : Date.now(),
      places,
    })
  }
  return out
}

/** Colecciones propuestas en el primer arranque (el usuario puede borrarlas). */
export const DEFAULT_COLLECTIONS = ['Sitios pendientes', 'Escapadas', 'Comer', 'Viajes']

export function makeCollection(name: string): SavedCollection {
  const now = Date.now()
  return { id: uid('col'), name: name.trim(), createdAt: now, updatedAt: now, places: [] }
}
