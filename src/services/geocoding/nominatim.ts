import type { Place } from '../../types/domain'
import { isValidLngLat } from '../../utils/geo'
import { sleep } from '../../utils/async'
import { fetchJson } from '../http'
import {
  buildAddressFromNominatim,
  contactFromTags,
  firstSegment,
  inferCategory,
} from '../osm/normalize'
import type { Geocoder } from './types'

/* Adaptador Nominatim.
   Política de uso: https://operations.osmfoundation.org/policies/nominatim/
   - 1 petición/segundo como máximo (aplicado con un espaciador interno).
   - SIN autocompletado: el proveedor público no lo permite; se busca al enviar. */

export interface NominatimItem {
  place_id?: number
  osm_type?: string
  osm_id?: number
  lat?: string
  lon?: string
  display_name?: string
  name?: string
  class?: string
  type?: string
  address?: Record<string, string>
  extratags?: Record<string, string>
}

/** Normaliza un resultado de Nominatim. Exportado para pruebas. */
export function normalizeNominatimItem(raw: NominatimItem): Place | null {
  const lat = Number(raw.lat)
  const lng = Number(raw.lon)
  if (!isValidLngLat({ lng, lat })) return null

  const category = inferCategory(raw.class, raw.type)
  const address = buildAddressFromNominatim(raw.address) ?? raw.display_name
  const name =
    raw.name?.trim() ||
    raw.address?.amenity ||
    raw.address?.shop ||
    raw.address?.tourism ||
    firstSegment(raw.display_name) ||
    'Lugar sin nombre'

  const id =
    raw.osm_type && raw.osm_id !== undefined
      ? `osm-${raw.osm_type}-${raw.osm_id}`
      : `nominatim-${raw.place_id ?? `${lat.toFixed(5)},${lng.toFixed(5)}`}`

  const contact = raw.extratags ? contactFromTags(raw.extratags) : null

  return {
    id,
    name,
    category,
    ...(address ? { address } : {}),
    coords: { lng, lat },
    source: 'osm',
    quality: 'real',
    ...(contact ? { contact } : {}),
    ...(raw.osm_type && raw.osm_id !== undefined
      ? { osm: { type: raw.osm_type, id: raw.osm_id } }
      : {}),
  }
}

export function createNominatimGeocoder(baseUrl: string, isDemo: boolean): Geocoder {
  let lastRequestAt = 0

  return {
    id: 'nominatim',
    label: 'Nominatim · OpenStreetMap',
    isDemo,
    supportsSuggestions: false,

    async search(query, opts = {}) {
      const q = query.trim()
      if (q.length < 3) return []

      /* Espaciador: nunca más de una petición por segundo. */
      const waitMs = lastRequestAt + 1000 - Date.now()
      if (waitMs > 0) await sleep(waitMs, opts.signal)
      lastRequestAt = Date.now()

      const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
      const url = new URL('search', base)
      url.searchParams.set('format', 'jsonv2')
      url.searchParams.set('q', q)
      url.searchParams.set('limit', String(opts.limit ?? 8))
      url.searchParams.set('addressdetails', '1')
      url.searchParams.set('extratags', '1')
      url.searchParams.set('dedupe', '1')
      url.searchParams.set('accept-language', 'es')

      const data = await fetchJson<NominatimItem[]>(url.toString(), {
        signal: opts.signal,
        timeoutMs: 15000,
        headers: { Accept: 'application/json' },
      })
      if (!Array.isArray(data)) return []
      return data
        .map(normalizeNominatimItem)
        .filter((p): p is Place => p !== null)
    },
  }
}
