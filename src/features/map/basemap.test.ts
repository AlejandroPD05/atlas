import { describe, expect, it } from 'vitest'
import { appConfig } from '../../app/config'
import { baseStyleForBasemap, SRC } from './basemap'

describe('baseStyleForBasemap', () => {
  it('genera un satélite real con etiquetas vectoriales, relieve y cielo', () => {
    const satellite = appConfig.basemaps.find((basemap) => basemap.id === 'satellite')
    expect(satellite).toBeDefined()

    const style = baseStyleForBasemap(satellite!)
    expect(typeof style).toBe('object')
    if (typeof style === 'string') throw new Error('El satélite debe generar un estilo propio')

    expect(style.sources[SRC.basemap]).toMatchObject({ type: 'raster' })
    expect(style.sources[SRC.vector]).toMatchObject({ type: 'vector' })
    expect(style.sources[SRC.terrain]).toMatchObject({ type: 'raster-dem', encoding: 'terrarium' })
    expect(style.terrain).toEqual({ source: SRC.terrain, exaggeration: 1.15 })
    expect(style.sky).toBeDefined()
    expect(style.layers.map((layer) => layer.id)).toContain('atlas-satellite')
    expect(style.layers.map((layer) => layer.id)).toContain('atlas-label-city')
    expect(style.layers.map((layer) => layer.id)).toContain('atlas-hillshade')

    // El proveedor de etiquetas raster anterior exigía clave y marcaba el mapa.
    expect(JSON.stringify(style)).not.toContain('cartocdn')
  })

  it('mantiene los estilos vectoriales como URL externa', () => {
    const dark = appConfig.basemaps.find((basemap) => basemap.id === 'dark')
    expect(dark).toBeDefined()
    expect(typeof baseStyleForBasemap(dark!)).toBe('string')
  })
})
