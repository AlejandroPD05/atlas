import { describe, expect, it } from 'vitest'
import { normalizeNominatimItem } from './nominatim'

describe('normalizeNominatimItem', () => {
  it('normaliza un lugar real con dirección y contacto', () => {
    const place = normalizeNominatimItem({
      place_id: 123,
      osm_type: 'node',
      osm_id: 456,
      lat: '40.4168',
      lon: '-3.7038',
      display_name: 'Café Central, Plaza del Callao, Madrid, España',
      name: 'Café Central',
      class: 'amenity',
      type: 'cafe',
      address: { road: 'Plaza del Callao', house_number: '2', postcode: '28013', city: 'Madrid' },
      extratags: {
        website: 'cafecentral.example',
        phone: '+34 910 000 000',
        opening_hours: 'Mo-Su 09:00-24:00',
      },
    })

    expect(place).not.toBeNull()
    expect(place?.id).toBe('osm-node-456')
    expect(place?.name).toBe('Café Central')
    expect(place?.category).toBe('cafeteria')
    expect(place?.address).toBe('Plaza del Callao 2, 28013 Madrid')
    expect(place?.coords).toEqual({ lng: -3.7038, lat: 40.4168 })
    expect(place?.quality).toBe('real')
    expect(place?.contact?.website).toBe('https://cafecentral.example/')
    expect(place?.contact?.phone).toBe('+34 910 000 000')
    expect(place?.osm).toEqual({ type: 'node', id: 456 })
  })

  it('usa el primer segmento del display_name si no hay nombre', () => {
    const place = normalizeNominatimItem({
      place_id: 9,
      lat: '40.4138',
      lon: '-3.6928',
      display_name: 'Museo del Prado, Paseo del Prado, Madrid',
      class: 'tourism',
      type: 'museum',
    })
    expect(place?.name).toBe('Museo del Prado')
    expect(place?.category).toBe('museo')
    expect(place?.id).toBe('nominatim-9')
    expect(place?.contact).toBeUndefined()
  })

  it('descarta resultados sin coordenadas válidas', () => {
    expect(normalizeNominatimItem({ lat: 'x', lon: 'y', display_name: 'Nada' })).toBeNull()
    expect(normalizeNominatimItem({ lat: '200', lon: '0' })).toBeNull()
  })
})
