import { describe, expect, it } from 'vitest'
import { getCategory } from '../../features/explore/categories'
import { buildOverpassQuery, normalizeOverpassElements } from './overpass'

const cafe = getCategory('cafeteria')!

describe('buildOverpassQuery', () => {
  it('incluye filtro, radio y límite', () => {
    const q = buildOverpassQuery({
      category: cafe,
      center: { lat: 40.4168, lng: -3.7038 },
      radiusM: 1500,
      limit: 40,
    })
    expect(q).toContain('nwr["amenity"="cafe"](around:1500,40.416800,-3.703800)')
    expect(q).toContain('out center tags 40;')
    expect(q).toContain('[out:json][timeout:30]')
  })

  it('limita el radio a un rango prudente', () => {
    expect(
      buildOverpassQuery({ category: cafe, center: { lat: 0, lng: 0 }, radiusM: 99999, limit: 1 }),
    ).toContain('around:5000')
    expect(
      buildOverpassQuery({ category: cafe, center: { lat: 0, lng: 0 }, radiusM: 1, limit: 1 }),
    ).toContain('around:100')
  })
})

describe('normalizeOverpassElements', () => {
  it('normaliza nodos y ways con center, deduplica y ordena datos', () => {
    const places = normalizeOverpassElements(
      [
        {
          type: 'node',
          id: 1,
          lat: 40.4168,
          lon: -3.7038,
          tags: {
            amenity: 'cafe',
            name: 'Café Central',
            'addr:street': 'Plaza del Callao',
            'addr:housenumber': '2',
            website: 'cafecentral.example',
            opening_hours: 'Mo-Su 09:00-24:00',
          },
        },
        {
          type: 'way',
          id: 2,
          center: { lat: 40.42, lon: -3.7 },
          tags: { amenity: 'cafe', name: 'Café de la Plaza' },
        },
        {
          type: 'node',
          id: 1,
          lat: 40.4168,
          lon: -3.7038,
          tags: { amenity: 'cafe', name: 'Duplicado' },
        },
      ],
      'cafeteria',
    )

    expect(places).toHaveLength(2)
    expect(places[0]?.id).toBe('osm-node-1')
    expect(places[0]?.name).toBe('Café Central')
    expect(places[0]?.address).toBe('Plaza del Callao 2')
    expect(places[0]?.contact?.website).toBe('https://cafecentral.example/')
    expect(places[1]?.coords).toEqual({ lng: -3.7, lat: 40.42 })
  })

  it('etiqueta como "Sin nombre" cuando OSM no publica nombre', () => {
    const places = normalizeOverpassElements(
      [{ type: 'node', id: 3, lat: 40.4, lon: -3.7, tags: { amenity: 'atm' } }],
      'cafeteria',
    )
    expect(places[0]?.name).toBe('Sin nombre')
    expect(places[0]?.category).toBe('cajero')
  })

  it('usa la categoría solicitada si los tags no la aclaran', () => {
    const places = normalizeOverpassElements([{ type: 'node', id: 4, lat: 40.4, lon: -3.7 }], 'cafeteria')
    expect(places[0]?.category).toBe('cafeteria')
  })

  it('descarta elementos sin coordenadas válidas', () => {
    expect(
      normalizeOverpassElements(
        [
          { type: 'node', id: 5 },
          { type: 'node', id: 6, lat: 999, lon: 0 },
          { type: 'node', id: 7, lat: 40.4, lon: -3.7 },
        ],
        'cafeteria',
      ),
    ).toHaveLength(1)
  })
})
