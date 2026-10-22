import type { Place } from '../../types/domain'
import { isValidLngLat } from '../../utils/geo'
import { fetchJson } from '../http'
import { inferCategory } from '../osm/normalize'
import type { Geocoder } from './types'

/* Adaptador Photon (Komoot) — opcional.
   Permite sugerencias mientras se escribe, a diferencia de Nominatim.
   El servidor público es un servicio de demo: límites y sin SLA. */

export interface PhotonFeature {
  type?: string
  geometry?: { type?: string; coordinates?: [number, number] }
  properties?: {
    osm_id?: number
    osm_type?: string
    osm_key?: string
    osm_value?: string
    name?: string
    housenumber?: string
    street?: string
    postcode?: string
    city?: string
    state?: string
    country?: string
    [key: string]: unknown
  }
}

interface PhotonResponse {
  features?: PhotonFeature[]
}

/** Photon devuelve N/W/R; lo normalizamos a la nomenclatura de OSM. */
function osmTypeOf(raw: unknown): 'node' | 'way' | 'relation' | undefined {
  if (raw === 'N' || raw === 'node') return 'node'
  if (raw === 'W' || raw === 'way') return 'way'
  if (raw === 'R' || raw === 'relation') return 'relation'
  return undefined
}

/** Normaliza un feature GeoJSON de Photon. Exportado para pruebas. */
export function normalizePhotonFeature(feature: PhotonFeature): Place | null {
  const coords = feature.geometry?.coordinates
  if (!coords || coords.length < 2) return null
  const lng = Number(coords[0])
  const lat = Number(coords[1])
  if (!isValidLngLat({ lng, lat })) return null

  const p = feature.properties ?? {}
  const category = inferCategory(asString(p.osm_key), asString(p.osm_value))

  const street = [asString(p.street), asString(p.housenumber)].filter(Boolean).join(' ')
  const city = [asString(p.postcode), asString(p.city)].filter(Boolean).join(' ')
  const address = [street, city].filter(Boolean).join(', ')

  const name = asString(p.name) ?? (street || city || 'Lugar sin nombre')

  const osmType = osmTypeOf(p.osm_type)
  const hasOsmId = typeof p.osm_id === 'number' && Number.isFinite(p.osm_id)
  const id =
    osmType && hasOsmId
      ? `osm-${osmType}-${p.osm_id}`
      : `photon-${lat.toFixed(5)},${lng.toFixed(5)}`

  return {
    id,
    name,
    category,
    ...(address ? { address } : {}),
    coords: { lng, lat },
    source: 'osm',
    quality: 'real',
    ...(osmType && hasOsmId ? { osm: { type: osmType, id: Number(p.osm_id) } } : {}),
  }
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v : undefined
}

export function createPhotonGeocoder(baseUrl: string, isDemo: boolean): Geocoder {
  return {
    id: 'photon',
    label: 'Photon · OpenStreetMap',
    isDemo,
    supportsSuggestions: true,

    async search(query, opts = {}) {
      const q = query.trim()
      if (q.length < 3) return []

      const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
      const url = new URL('api/', base)
      url.searchParams.set('q', q)
      url.searchParams.set('limit', String(opts.limit ?? 8))
      url.searchParams.set('lang', 'es')

      if (opts.near) {
        url.searchParams.set('lat', String(opts.near.lat))
        url.searchParams.set('lon', String(opts.near.lng))
        url.searchParams.set('zoom', '12')
      }

      const data = await fetchJson<PhotonResponse>(url.toString(), {
        signal: opts.signal,
        timeoutMs: 12000,
        headers: { Accept: 'application/json' },
      })
      const features = Array.isArray(data.features) ? data.features : []
      return features
        .map(normalizePhotonFeature)
        .filter((p): p is Place => p !== null)
    },
  }
}
