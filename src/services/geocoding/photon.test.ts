import { describe, expect, it } from 'vitest'
import { normalizePhotonFeature } from './photon'

describe('normalizePhotonFeature', () => {
  it('normaliza un feature con dirección y tipo OSM', () => {
    const place = normalizePhotonFeature({
      geometry: { type: 'Point', coordinates: [-3.7038, 40.4168] },
      properties: {
        osm_id: 42,
        osm_type: 'N',
        osm_key: 'amenity',
        osm_value: 'cafe',
        name: 'Café del Sol',
        street: 'Calle Mayor',
        housenumber: '3',
        postcode: '28013',
        city: 'Madrid',
      },
    })

    expect(place).not.toBeNull()
    expect(place?.id).toBe('osm-node-42')
    expect(place?.name).toBe('Café del Sol')
    expect(place?.category).toBe('cafeteria')
    expect(place?.address).toBe('Calle Mayor 3, 28013 Madrid')
    expect(place?.osm).toEqual({ type: 'node', id: 42 })
  })

  it('traduce W/R a way/relation', () => {
    const way = normalizePhotonFeature({
      geometry: { coordinates: [-3.7, 40.4] },
      properties: { osm_id: 7, osm_type: 'W', osm_key: 'leisure', osm_value: 'park' },
    })
    expect(way?.osm?.type).toBe('way')
    expect(way?.category).toBe('parque')

    const relation = normalizePhotonFeature({
      geometry: { coordinates: [-3.7, 40.4] },
      properties: { osm_id: 8, osm_type: 'R', osm_key: 'historic', osm_value: 'castle' },
    })
    expect(relation?.osm?.type).toBe('relation')
    expect(relation?.category).toBe('monumento')
  })

  it('usa calle o ciudad como nombre cuando falta el nombre propio', () => {
    const place = normalizePhotonFeature({
      geometry: { coordinates: [-3.7, 40.4] },
      properties: { street: 'Calle de Alcalá', city: 'Madrid' },
    })
    expect(place?.name).toBe('Calle de Alcalá')
    expect(place?.id).toMatch(/^photon-/)
    expect(place?.osm).toBeUndefined()
  })

  it('descarta geometrías inválidas', () => {
    expect(normalizePhotonFeature({})).toBeNull()
    expect(normalizePhotonFeature({ geometry: { coordinates: [200, 40] } })).toBeNull()
  })
})
