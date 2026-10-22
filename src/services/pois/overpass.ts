import type { LngLat, Place, PlaceCategory } from '../../types/domain'
import { isValidLngLat } from '../../utils/geo'
import { fetchJson } from '../http'
import {
  buildAddressFromTags,
  contactFromTags,
  inferCategoryFromTags,
} from '../osm/normalize'

/* Overpass API — búsqueda real de POI de OpenStreetMap alrededor de un punto.
   Servicio público de demo: se consulta de forma comedida y con radio limitado. */

interface OverpassElement {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

interface OverpassResponse {
  elements?: OverpassElement[]
  remark?: string
}

export interface SearchPlacesAroundOptions {
  baseUrl: string
  category: PlaceCategory
  center: LngLat
  radiusM: number
  limit?: number
  signal?: AbortSignal
}

export function buildOverpassQuery(opts: {
  category: PlaceCategory
  center: LngLat
  radiusM: number
  limit: number
}): string {
  const radius = Math.round(Math.min(Math.max(opts.radiusM, 100), 5000))
  const lat = opts.center.lat.toFixed(6)
  const lng = opts.center.lng.toFixed(6)
  return [
    '[out:json][timeout:30];',
    '(',
    `${opts.category.overpassFilter}(around:${radius},${lat},${lng});`,
    ');',
    `out center tags ${opts.limit};`,
  ].join('')
}

/** Normaliza elementos Overpass. Exportado para pruebas. */
export function normalizeOverpassElements(
  elements: OverpassElement[],
  fallbackCategory: Place['category'],
): Place[] {
  const out: Place[] = []
  const seen = new Set<string>()

  for (const el of elements) {
    const lat = el.center?.lat ?? el.lat
    const lng = el.center?.lon ?? el.lon
    if (lat === undefined || lng === undefined) continue
    if (!isValidLngLat({ lat, lng })) continue

    const id = `osm-${el.type}-${el.id}`
    if (seen.has(id)) continue
    seen.add(id)

    const tags = el.tags ?? {}
    const name = tags.name ?? tags.brand ?? tags.operator ?? 'Sin nombre'
    const address = buildAddressFromTags(tags)
    const contact = contactFromTags(tags)

    out.push({
      id,
      name,
      category: inferCategoryFromTags(tags) ?? fallbackCategory,
      ...(address ? { address } : {}),
      coords: { lng, lat },
      source: 'osm',
      quality: 'real',
      ...(contact ? { contact } : {}),
      osm: { type: el.type, id: el.id, tags },
    })
  }

  return out
}

export async function searchPlacesAround(opts: SearchPlacesAroundOptions): Promise<Place[]> {
  const limit = Math.min(Math.max(opts.limit ?? 60, 1), 100)
  const query = buildOverpassQuery({
    category: opts.category,
    center: opts.center,
    radiusM: opts.radiusM,
    limit,
  })

  const data = await fetchJson<OverpassResponse>(opts.baseUrl, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    contentType: 'application/x-www-form-urlencoded',
    signal: opts.signal,
    timeoutMs: 45000,
    headers: { Accept: 'application/json' },
  })

  if (data.remark && /error|timeout/i.test(data.remark)) {
    throw new Error(data.remark)
  }

  return normalizeOverpassElements(data.elements ?? [], opts.category.id)
}
