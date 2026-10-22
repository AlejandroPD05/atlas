import { describe, expect, it } from 'vitest'
import {
  buildAddressFromNominatim,
  buildAddressFromTags,
  contactFromTags,
  firstSegment,
  inferCategory,
  inferCategoryFromTags,
  normalizeWebsite,
} from './normalize'

describe('inferCategory', () => {
  it('mapea claves OSM frecuentes', () => {
    expect(inferCategory('amenity', 'cafe')).toBe('cafeteria')
    expect(inferCategory('amenity', 'restaurant')).toBe('restaurante')
    expect(inferCategory('amenity', 'pharmacy')).toBe('farmacia')
    expect(inferCategory('amenity', 'charging_station')).toBe('carga_ev')
    expect(inferCategory('shop', 'bakery')).toBe('panaderia')
    expect(inferCategory('shop', 'supermarket')).toBe('supermercado')
    expect(inferCategory('shop', 'cualquiera')).toBe('tienda')
    expect(inferCategory('tourism', 'viewpoint')).toBe('mirador')
    expect(inferCategory('tourism', 'museum')).toBe('museo')
    expect(inferCategory('historic', 'castle')).toBe('monumento')
    expect(inferCategory('leisure', 'park')).toBe('parque')
    expect(inferCategory('highway', 'bus_stop')).toBe('parada_bus')
    expect(inferCategory('railway', 'station')).toBe('estacion')
    expect(inferCategory('place', 'house')).toBe('direccion')
    expect(inferCategory('place', 'city')).toBe('lugar')
  })

  it('devuelve "otros" cuando no reconoce la clave', () => {
    expect(inferCategory('amenity', 'toilets')).toBe('otros')
    expect(inferCategory('desconocida', 'x')).toBe('otros')
    expect(inferCategory(undefined, undefined)).toBe('otros')
  })
})

describe('inferCategoryFromTags', () => {
  it('elige la primera clave reconocible', () => {
    expect(inferCategoryFromTags({ amenity: 'cafe', shop: 'bakery' })).toBe('cafeteria')
    expect(inferCategoryFromTags({ shop: 'bakery' })).toBe('panaderia')
    expect(inferCategoryFromTags({ highway: 'bus_stop' })).toBe('parada_bus')
    expect(inferCategoryFromTags({ name: 'Sin categoría' })).toBeNull()
  })
})

describe('direcciones', () => {
  it('compone addr:* de OSM', () => {
    expect(
      buildAddressFromTags({ 'addr:street': 'Calle Mayor', 'addr:housenumber': '3', 'addr:city': 'Madrid' }),
    ).toBe('Calle Mayor 3, Madrid')
    expect(buildAddressFromTags({ 'addr:city': 'Toledo' })).toBe('Toledo')
    expect(buildAddressFromTags({})).toBeUndefined()
  })

  it('compone la dirección de Nominatim', () => {
    expect(
      buildAddressFromNominatim({
        road: 'Paseo del Prado',
        house_number: '20',
        postcode: '28014',
        city: 'Madrid',
      }),
    ).toBe('Paseo del Prado 20, 28014 Madrid')
    expect(buildAddressFromNominatim({ county: 'Madrid' })).toBe('Madrid')
    expect(buildAddressFromNominatim(undefined)).toBeUndefined()
  })
})

describe('normalizeWebsite', () => {
  it('acepta http/https y añade el esquema si falta', () => {
    expect(normalizeWebsite('https://ejemplo.org/carta')).toBe('https://ejemplo.org/carta')
    expect(normalizeWebsite('http://ejemplo.org')).toBe('http://ejemplo.org/')
    expect(normalizeWebsite('ejemplo.org')).toBe('https://ejemplo.org/')
  })

  it('rechaza esquemas peligrosos o valores vacíos', () => {
    expect(normalizeWebsite(undefined)).toBeUndefined()
    expect(normalizeWebsite('   ')).toBeUndefined()
    expect(normalizeWebsite('javascript:alert(1)')).toBeUndefined()
    expect(normalizeWebsite('data:text/html,<script>')).toBeUndefined()
  })
})

describe('contactFromTags', () => {
  it('extrae solo los campos publicados', () => {
    expect(
      contactFromTags({
        website: 'ejemplo.org',
        'contact:phone': '+34 910 000 000',
        opening_hours: 'Mo-Fr 09:00-20:00',
      }),
    ).toEqual({
      website: 'https://ejemplo.org/',
      phone: '+34 910 000 000',
      openingHours: 'Mo-Fr 09:00-20:00',
    })
    expect(contactFromTags({ phone: '123' })).toEqual({ phone: '123' })
    expect(contactFromTags({ name: 'Solo nombre' })).toBeNull()
  })
})

describe('firstSegment', () => {
  it('extrae el primer fragmento de un display_name', () => {
    expect(firstSegment('Museo del Prado, Paseo del Prado, Madrid')).toBe('Museo del Prado')
    expect(firstSegment('')).toBeUndefined()
    expect(firstSegment(undefined)).toBeUndefined()
  })
})
