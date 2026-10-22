import type { PlaceCategoryId } from '../../types/domain'

/* Normalización de datos OSM → modelo de dominio.
   Compartido por los adaptadores de geocoding y POI. */

const AMENITY: Record<string, PlaceCategoryId> = {
  cafe: 'cafeteria',
  restaurant: 'restaurante',
  fast_food: 'restaurante',
  food_court: 'restaurante',
  bar: 'bar',
  pub: 'bar',
  brewery: 'bar',
  pharmacy: 'farmacia',
  hospital: 'hospital',
  clinic: 'hospital',
  doctors: 'hospital',
  dentist: 'hospital',
  bank: 'banco',
  bureau_de_change: 'banco',
  atm: 'cajero',
  fuel: 'gasolinera',
  charging_station: 'carga_ev',
  parking: 'aparcamiento',
  parking_entrance: 'aparcamiento',
  library: 'biblioteca',
  bus_station: 'parada_bus',
  taxi: 'otros',
  toilets: 'otros',
}

const SHOP: Record<string, PlaceCategoryId> = {
  bakery: 'panaderia',
  supermarket: 'supermercado',
  convenience: 'supermercado',
  greengrocer: 'supermercado',
  marketplace: 'supermercado',
}

const TOURISM: Record<string, PlaceCategoryId> = {
  viewpoint: 'mirador',
  museum: 'museo',
  gallery: 'museo',
  attraction: 'monumento',
  artwork: 'monumento',
  hotel: 'hotel',
  guest_house: 'hotel',
  hostel: 'hotel',
  apartment: 'hotel',
  camp_site: 'hotel',
}

const LEISURE: Record<string, PlaceCategoryId> = {
  park: 'parque',
  garden: 'parque',
  nature_reserve: 'parque',
  playground: 'parque',
  sports_centre: 'deporte',
  fitness_centre: 'deporte',
  swimming_pool: 'deporte',
  pitch: 'deporte',
}

/** Deduce una categoría de lugar a partir de una clave/valor OSM. */
export function inferCategory(key?: string, value?: string): PlaceCategoryId {
  if (!key || !value) return 'otros'
  switch (key) {
    case 'amenity':
      return AMENITY[value] ?? 'otros'
    case 'shop':
      return SHOP[value] ?? 'tienda'
    case 'tourism':
      return TOURISM[value] ?? 'otros'
    case 'leisure':
      return LEISURE[value] ?? 'otros'
    case 'historic':
      return 'monumento'
    case 'railway':
      return value === 'station' || value === 'halt' ? 'estacion' : 'otros'
    case 'highway':
      return value === 'bus_stop' ? 'parada_bus' : 'otros'
    case 'place':
      return value === 'house' || value === 'house_number' ? 'direccion' : 'lugar'
    case 'boundary':
      return 'lugar'
    case 'building':
      return value === 'train_station' ? 'estacion' : 'otros'
    case 'office':
      return 'otros'
    default:
      return 'otros'
  }
}

const CATEGORY_KEYS = ['amenity', 'shop', 'tourism', 'leisure', 'historic', 'railway', 'highway', 'place']

/** Deduce la categoría a partir de un conjunto de tags OSM completos. */
export function inferCategoryFromTags(tags: Record<string, string>): PlaceCategoryId | null {
  for (const key of CATEGORY_KEYS) {
    const value = tags[key]
    if (!value) continue
    const cat = inferCategory(key, value)
    if (cat !== 'otros') return cat
  }
  return null
}

/** Dirección legible a partir de tags addr:* de OSM. */
export function buildAddressFromTags(tags: Record<string, string | undefined>): string | undefined {
  const street = tags['addr:street']
  const number = tags['addr:housenumber']
  const postcode = tags['addr:postcode']
  const city = tags['addr:city'] ?? tags['addr:town'] ?? tags['addr:village']
  const line1 = [street, number].filter(Boolean).join(' ')
  const line2 = [postcode, city].filter(Boolean).join(' ')
  const out = [line1, line2].filter(Boolean).join(', ')
  return out.length > 0 ? out : undefined
}

/** Dirección a partir del objeto `address` de Nominatim. */
export function buildAddressFromNominatim(address: Record<string, string> | undefined): string | undefined {
  if (!address) return undefined
  const street = address.road ?? address.pedestrian ?? address.footway ?? address.square
  const number = address.house_number
  const city = address.city ?? address.town ?? address.village ?? address.municipality
  const postcode = address.postcode
  const line1 = [street, number].filter(Boolean).join(' ')
  const line2 = [postcode, city].filter(Boolean).join(' ')
  const out = [line1, line2].filter(Boolean).join(', ')
  if (out.length > 0) return out
  return address.county ?? address.state ?? undefined
}

/** Normaliza una web para enlazarla con seguridad (solo http/https). */
export function normalizeWebsite(raw?: string): string | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  if (trimmed === '') return undefined
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const u = new URL(withScheme)
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString()
  } catch {
    return undefined
  }
  return undefined
}

/** Contacto disponible en tags OSM. Solo se muestra si la fuente lo publica. */
export function contactFromTags(tags: Record<string, string | undefined>): {
  website?: string
  phone?: string
  openingHours?: string
} | null {
  const website = normalizeWebsite(tags.website ?? tags['contact:website'] ?? tags.url)
  const phone = tags.phone ?? tags['contact:phone']
  const openingHours = tags.opening_hours
  if (!website && !phone && !openingHours) return null
  return {
    ...(website ? { website } : {}),
    ...(phone ? { phone } : {}),
    ...(openingHours ? { openingHours } : {}),
  }
}

/** Primer segmento de un display_name de Nominatim (nombre visible). */
export function firstSegment(displayName?: string): string | undefined {
  if (!displayName) return undefined
  const first = displayName.split(',')[0]?.trim()
  return first && first.length > 0 ? first : undefined
}
