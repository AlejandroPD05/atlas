import { describe, expect, it } from 'vitest'
import {
  EXPLORE_POPULAR,
  PLACE_CATEGORIES,
  categoryLabel,
  detectCategory,
  getCategory,
  normalizeText,
} from './categories'

describe('detectCategory', () => {
  it('detecta categorías con y sin acentos ni mayúsculas', () => {
    expect(detectCategory('cafeterías')?.id).toBe('cafeteria')
    expect(detectCategory('CAFETERIAS')?.id).toBe('cafeteria')
    expect(detectCategory('cafés')?.id).toBe('cafeteria')
    expect(detectCategory('farmacias')?.id).toBe('farmacia')
    expect(detectCategory('parques')?.id).toBe('parque')
    expect(detectCategory('gasolineras')?.id).toBe('gasolinera')
    expect(detectCategory('alojamiento')?.id).toBe('hotel')
  })

  it('detecta la categoría dentro de una frase simple', () => {
    expect(detectCategory('farmacias cerca')?.id).toBe('farmacia')
    expect(detectCategory('quiero un bar')?.id).toBe('bar')
  })

  it('no confunde texto libre con categorías', () => {
    expect(detectCategory('Museo del Prado')).toBeNull()
    expect(detectCategory('Calle Mayor 3')).toBeNull()
    expect(detectCategory('zzz')).toBeNull()
  })

  it('exige al menos 3 caracteres', () => {
    expect(detectCategory('ba')).toBeNull()
    expect(detectCategory('bar')?.id).toBe('bar')
  })
})

describe('catálogo de categorías', () => {
  it('tiene ids únicos, filtros Overpass y palabras clave', () => {
    const ids = new Set(PLACE_CATEGORIES.map((c) => c.id))
    expect(ids.size).toBe(PLACE_CATEGORIES.length)
    for (const cat of PLACE_CATEGORIES) {
      expect(cat.overpassFilter).toMatch(/^nwr\[/)
      expect(cat.keywords.length).toBeGreaterThan(0)
      expect(cat.label.length).toBeGreaterThan(0)
    }
  })

  it('las categorías populares existen y tienen etiqueta', () => {
    for (const id of EXPLORE_POPULAR) {
      expect(getCategory(id)).toBeDefined()
      expect(categoryLabel(id)).not.toBe('Lugar')
    }
  })
})

describe('normalizeText', () => {
  it('quita acentos, mayúsculas y espacios exteriores', () => {
    expect(normalizeText('  Estación  ')).toBe('estacion')
    expect(normalizeText('Ávila')).toBe('avila')
  })
})
