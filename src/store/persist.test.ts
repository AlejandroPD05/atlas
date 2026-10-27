import { describe, expect, it, vi } from 'vitest'
import {
  defaultPreferences,
  makeCollection,
  sanitizeCollections,
  sanitizePreferences,
  sanitizeStringArray,
} from './persist'

describe('sanitizePreferences', () => {
  it('devuelve las preferencias por defecto si el dato persistido no es válido', () => {
    expect(sanitizePreferences(null)).toEqual(defaultPreferences)
    expect(sanitizePreferences('basura')).toEqual(defaultPreferences)
    expect(sanitizePreferences({ units: 'marciano', reduceMotion: 'sí' })).toEqual(defaultPreferences)
  })

  it('conserva valores válidos', () => {
    expect(
      sanitizePreferences({
        units: 'imperial',
        reduceMotion: true,
        showPoiLayer: false,
        poiRadiusM: 3000,
      }),
    ).toEqual({
      units: 'imperial',
      reduceMotion: true,
      showPoiLayer: false,
      poiRadiusM: 3000,
    })
  })

  it('descarta radios de búsqueda fuera de la lista admitida', () => {
    expect(sanitizePreferences({ poiRadiusM: 9999 }).poiRadiusM).toBe(1500)
    expect(sanitizePreferences({ poiRadiusM: '500' }).poiRadiusM).toBe(1500)
    expect(sanitizePreferences({ poiRadiusM: 500 }).poiRadiusM).toBe(500)
  })
})

describe('sanitizeStringArray', () => {
  it('descarta valores no textuales o vacíos y limita el tamaño', () => {
    const raw = ['madrid', '', 42, null, '  ', 'toledo', 'segovia', 'ávila', 'cuenca', 'salamanca']
    const out = sanitizeStringArray(raw, 4)
    expect(out).toEqual(['madrid', 'toledo', 'segovia', 'ávila'])
  })

  it('devuelve un array vacío si el dato no es un array', () => {
    expect(sanitizeStringArray('madrid')).toEqual([])
    expect(sanitizeStringArray(undefined)).toEqual([])
  })
})

describe('sanitizeCollections', () => {
  it('descarta colecciones y lugares que no cumplen el esquema', () => {
    const raw = [
      {
        id: 'col-1',
        name: 'Favoritos',
        createdAt: 1,
        updatedAt: 2,
        places: [
          { id: 'p1', name: 'Café Central', category: 'cafeteria', coords: { lng: -3.7, lat: 40.4 }, addedAt: 3 },
          { id: 'p2', name: '', coords: { lng: -3.7, lat: 40.4 } },
          { id: 'p3', name: 'Roto', coords: { lng: 999, lat: 40 } },
          'no-es-un-lugar',
        ],
      },
      { id: '', name: 'Sin id', places: [] },
      null,
      {
        id: 'col-2',
        name: 'Sin lugares',
        places: 'no-es-array',
      },
    ]
    const out = sanitizeCollections(raw)
    expect(out).toHaveLength(2)
    expect(out[0]?.places).toHaveLength(1)
    expect(out[0]?.places[0]?.name).toBe('Café Central')
    expect(out[1]?.places).toEqual([])
  })

  it('devuelve un array vacío si la raíz no es un array', () => {
    expect(sanitizeCollections({ id: 'x' })).toEqual([])
  })
})

describe('makeCollection', () => {
  it('crea una colección vacía con nombre limpio', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000)
    const col = makeCollection('  Escapadas  ')
    expect(col.name).toBe('Escapadas')
    expect(col.places).toEqual([])
    expect(col.createdAt).toBe(1000)
    expect(col.id).toMatch(/^col_/)
    vi.restoreAllMocks()
  })
})
