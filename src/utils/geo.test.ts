import { describe, expect, it } from 'vitest'
import {
  boundsContain,
  boundsOf,
  haversineDistanceM,
  isValidLngLat,
  padBounds,
  pointToPolylineDistanceM,
  pointToSegmentDistanceM,
} from './geo'

describe('haversineDistanceM', () => {
  it('calcula una distancia urbana conocida dentro de un margen', () => {
    /* Puerta del Sol → Atocha (Madrid), ~1,6 km en línea recta. */
    const d = haversineDistanceM({ lat: 40.4168, lng: -3.7038 }, { lat: 40.4066, lng: -3.6906 })
    expect(d).toBeGreaterThan(1500)
    expect(d).toBeLessThan(1750)
  })

  it('devuelve 0 para el mismo punto', () => {
    const p = { lat: 40.4, lng: -3.7 }
    expect(haversineDistanceM(p, p)).toBe(0)
  })
})

describe('isValidLngLat', () => {
  it('acepta coordenadas válidas', () => {
    expect(isValidLngLat({ lng: -3.7038, lat: 40.4168 })).toBe(true)
  })

  it('rechaza rangos imposibles y valores no numéricos', () => {
    expect(isValidLngLat({ lng: 200, lat: 40 })).toBe(false)
    expect(isValidLngLat({ lng: -3, lat: 91 })).toBe(false)
    expect(isValidLngLat({ lng: 'x', lat: 4 })).toBe(false)
    expect(isValidLngLat(null)).toBe(false)
  })
})

describe('bounds', () => {
  const coords = [
    { lng: -3.72, lat: 40.4 },
    { lng: -3.68, lat: 40.43 },
    { lng: -3.7, lat: 40.39 },
  ]

  it('calcula el rectángulo envolvente', () => {
    expect(boundsOf(coords)).toEqual({ west: -3.72, south: 40.39, east: -3.68, north: 40.43 })
  })

  it('devuelve null sin puntos válidos', () => {
    expect(boundsOf([])).toBeNull()
    expect(boundsOf([{ lng: 500, lat: 0 }])).toBeNull()
  })

  it('expande el bounds con un mínimo visible', () => {
    const b = padBounds({ west: -3.7001, south: 40.4, east: -3.7, north: 40.4001 }, 0.1)
    expect(b.west).toBeLessThan(-3.7001)
    expect(b.east).toBeGreaterThan(-3.7)
  })

  it('comprueba contención', () => {
    const b = { west: -4, south: 40, east: -3, north: 41 }
    expect(boundsContain(b, { lng: -3.5, lat: 40.5 })).toBe(true)
    expect(boundsContain(b, { lng: -2.5, lat: 40.5 })).toBe(false)
  })
})

describe('distancias a segmentos', () => {
  it('mide la perpendicular a un segmento horizontal', () => {
    const d = pointToSegmentDistanceM(
      { lat: 40.401, lng: -3.7 },
      { lat: 40.4, lng: -3.71 },
      { lat: 40.4, lng: -3.69 },
    )
    /* 0,001° de latitud ≈ 111 m. */
    expect(d).toBeGreaterThan(105)
    expect(d).toBeLessThan(118)
  })

  it('usa el extremo más cercano fuera del segmento', () => {
    const d = pointToSegmentDistanceM(
      { lat: 40.4, lng: -3.72 },
      { lat: 40.4, lng: -3.71 },
      { lat: 40.4, lng: -3.69 },
    )
    expect(d).toBeGreaterThan(800)
    expect(d).toBeLessThan(900)
  })

  it('recorre una polilínea y devuelve infinito si está vacía', () => {
    const line = [
      { lat: 40.4, lng: -3.71 },
      { lat: 40.4, lng: -3.69 },
      { lat: 40.41, lng: -3.69 },
    ]
    expect(pointToPolylineDistanceM({ lat: 40.4, lng: -3.7 }, line)).toBeLessThan(20)
    expect(pointToPolylineDistanceM({ lat: 40.4, lng: -3.7 }, [])).toBe(Number.POSITIVE_INFINITY)
  })
})
