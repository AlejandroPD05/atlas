import type { PlaceCategory, PlaceCategoryId } from '../../types/domain'

/* ═══════════════════════════════════════════════════════════════
   Categorías de lugares — datos reales de OpenStreetMap.
   `overpassFilter` es el fragmento nwr que se consulta en Overpass.
   `keywords` alimenta la detección de categorías en el buscador.
   ═══════════════════════════════════════════════════════════════ */

export const PLACE_CATEGORIES: PlaceCategory[] = [
  {
    id: 'cafeteria',
    label: 'Cafeterías',
    group: 'comer',
    overpassFilter: 'nwr["amenity"="cafe"]',
    keywords: ['cafetería', 'cafeterias', 'cafetería', 'cafe', 'cafes', 'café', 'cafés', 'cafeteria'],
  },
  {
    id: 'restaurante',
    label: 'Restaurantes',
    group: 'comer',
    overpassFilter: 'nwr["amenity"="restaurant"]',
    keywords: ['restaurante', 'restaurantes', 'comer', 'restaurant'],
  },
  {
    id: 'bar',
    label: 'Bares',
    group: 'comer',
    overpassFilter: 'nwr["amenity"~"bar|pub"]',
    keywords: ['bar', 'bares', 'pub', 'cervecería', 'cerveceria'],
  },
  {
    id: 'panaderia',
    label: 'Panaderías',
    group: 'comer',
    overpassFilter: 'nwr["shop"="bakery"]',
    keywords: ['panadería', 'panaderia', 'pan', 'bakery'],
  },
  {
    id: 'supermercado',
    label: 'Supermercados',
    group: 'comprar',
    overpassFilter: 'nwr["shop"~"supermarket|convenience"]',
    keywords: ['supermercado', 'supermercados', 'tienda', 'ultramarinos'],
  },
  {
    id: 'farmacia',
    label: 'Farmacias',
    group: 'salud',
    overpassFilter: 'nwr["amenity"="pharmacy"]',
    keywords: ['farmacia', 'farmacias', 'parafarmacia'],
  },
  {
    id: 'hospital',
    label: 'Hospitales y clínicas',
    group: 'salud',
    overpassFilter: 'nwr["amenity"~"hospital|clinic|doctors"]',
    keywords: ['hospital', 'hospitales', 'clínica', 'clinica', 'médico', 'medico', 'urgencias'],
  },
  {
    id: 'parque',
    label: 'Parques y jardines',
    group: 'naturaleza',
    overpassFilter: 'nwr["leisure"~"park|garden"]',
    keywords: ['parque', 'parques', 'jardín', 'jardin', 'zona verde'],
  },
  {
    id: 'mirador',
    label: 'Miradores',
    group: 'naturaleza',
    overpassFilter: 'nwr["tourism"="viewpoint"]',
    keywords: ['mirador', 'miradores', 'vista', 'panorámica', 'panoramica'],
  },
  {
    id: 'museo',
    label: 'Museos',
    group: 'cultura',
    overpassFilter: 'nwr["tourism"="museum"]',
    keywords: ['museo', 'museos', 'galería', 'galeria'],
  },
  {
    id: 'monumento',
    label: 'Monumentos y lugares históricos',
    group: 'cultura',
    overpassFilter: 'nwr["historic"~"monument|memorial|castle|ruins"]',
    keywords: ['monumento', 'monumentos', 'histórico', 'historico', 'castillo', 'ruinas'],
  },
  {
    id: 'hotel',
    label: 'Alojamiento',
    group: 'servicios',
    overpassFilter: 'nwr["tourism"~"hotel|guest_house|hostel|apartment"]',
    keywords: ['hotel', 'hoteles', 'hostal', 'albergue', 'apartamento', 'alojamiento', 'alojamientos'],
  },
  {
    id: 'banco',
    label: 'Bancos',
    group: 'servicios',
    overpassFilter: 'nwr["amenity"="bank"]',
    keywords: ['banco', 'bancos'],
  },
  {
    id: 'cajero',
    label: 'Cajeros',
    group: 'servicios',
    overpassFilter: 'nwr["amenity"="atm"]',
    keywords: ['cajero', 'cajeros', 'atm'],
  },
  {
    id: 'gasolinera',
    label: 'Gasolineras',
    group: 'movilidad',
    overpassFilter: 'nwr["amenity"="fuel"]',
    keywords: ['gasolinera', 'gasolineras', 'repostar', 'combustible'],
  },
  {
    id: 'carga_ev',
    label: 'Carga de vehículo eléctrico',
    group: 'movilidad',
    overpassFilter: 'nwr["amenity"="charging_station"]',
    keywords: ['carga', 'eléctrico', 'electrico', 'cargador', 'punto de carga'],
  },
  {
    id: 'aparcamiento',
    label: 'Aparcamientos',
    group: 'movilidad',
    overpassFilter: 'nwr["amenity"="parking"]',
    keywords: ['aparcamiento', 'aparcamientos', 'parking', 'estacionamiento'],
  },
  {
    id: 'estacion',
    label: 'Estaciones de tren',
    group: 'movilidad',
    overpassFilter: 'nwr["railway"="station"]',
    keywords: ['estación', 'estacion', 'tren', 'cercanías', 'cercanias'],
  },
  {
    id: 'parada_bus',
    label: 'Paradas de bus',
    group: 'movilidad',
    overpassFilter: 'nwr["highway"="bus_stop"]',
    keywords: ['parada', 'paradas', 'bus', 'autobús', 'autobus'],
  },
  {
    id: 'biblioteca',
    label: 'Bibliotecas',
    group: 'cultura',
    overpassFilter: 'nwr["amenity"="library"]',
    keywords: ['biblioteca', 'bibliotecas'],
  },
  {
    id: 'deporte',
    label: 'Deporte',
    group: 'naturaleza',
    overpassFilter: 'nwr["leisure"~"sports_centre|fitness_centre|swimming_pool|pitch"]',
    keywords: ['gimnasio', 'gimnasios', 'piscina', 'deporte', 'polideportivo'],
  },
  {
    id: 'tienda',
    label: 'Tiendas',
    group: 'comprar',
    overpassFilter: 'nwr["shop"]',
    keywords: ['tienda', 'tiendas', 'compras', 'shop'],
  },
]

const byId = new Map<PlaceCategoryId, PlaceCategory>(PLACE_CATEGORIES.map((c) => [c.id, c]))

export function getCategory(id: PlaceCategoryId): PlaceCategory | undefined {
  return byId.get(id)
}

export function categoryLabel(id: PlaceCategoryId): string {
  return byId.get(id)?.label ?? 'Lugar'
}

/** Categorías que aparecen como chips en Explorar (las más útiles de un vistazo). */
export const EXPLORE_POPULAR: PlaceCategoryId[] = [
  'cafeteria',
  'restaurante',
  'parque',
  'mirador',
  'supermercado',
  'farmacia',
  'museo',
  'aparcamiento',
  'carga_ev',
  'estacion',
]

/** Normaliza texto para comparar palabras clave (sin acentos, minúsculas). */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/** Detecta si la consulta de búsqueda corresponde a una categoría conocida.
    Es deliberadamente conservador: un nombre propio como «Museo del Prado»
    no debe convertirse en una búsqueda de categoría. */
export function detectCategory(query: string): PlaceCategory | null {
  const q = normalizeText(query)
  if (q.length < 3) return null
  for (const cat of PLACE_CATEGORIES) {
    for (const kw of cat.keywords) {
      const k = normalizeText(kw)
      if (q === k) return cat
      if (q.endsWith(` ${k}`)) return cat
      if (q.startsWith(`${k} `) && CATEGORY_QUALIFIERS.has(q.slice(k.length + 1).trim())) {
        return cat
      }
    }
  }
  return null
}

/** Modificadores que no convierten un nombre propio en categoría. */
const CATEGORY_QUALIFIERS = new Set([
  'cerca',
  'cercanas',
  'cercanos',
  'aqui',
  'en el mapa',
  'en esta zona',
  'por la zona',
  'por aqui',
])
