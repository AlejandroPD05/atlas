import type { FeatureCollection } from 'geojson'
import type {
  LayerSpecification,
  Map as MapLibreMap,
  SourceSpecification,
  StyleSpecification,
} from 'maplibre-gl'
import type { BasemapDef } from '../../app/config'

/* ═══════════════════════════════════════════════════════════════
   Mapa base + capas propias.

   Modos:
   1. Satélite realista: imagen de Esri World Imagery, etiquetas
      transparentes, sombreado y modelo digital de elevación (DEM).
      Es el modo por defecto: el mundo se ve como es, no como un esquema.
   2. Estilo vectorial completo (OpenFreeMap): aporta sus fuentes, glifos,
      sprite y atribución.
   3. Teselas raster propias (VITE_TILES_*): estilo mínimo generado aquí.
   Las capas propias no se incrustan en estilos de terceros para no
   depender de su estructura interna.
   ═══════════════════════════════════════════════════════════════ */

export const SRC = {
  basemap: 'atlas-bm',
  labels: 'atlas-labels',
  vector: 'atlas-vector',
  terrain: 'atlas-terrain',
  hillshade: 'atlas-hillshade-src',
  pois: 'atlas-pois',
  places: 'atlas-places',
  route: 'atlas-route',
} as const

export const LAYER = {
  satellite: 'atlas-satellite',
  hillshade: 'atlas-hillshade',
  labels: 'atlas-labels',
  labelCountry: 'atlas-label-country',
  labelState: 'atlas-label-state',
  labelCity: 'atlas-label-city',
  labelDistrict: 'atlas-label-district',
  labelWater: 'atlas-label-water',
  labelRoadMajor: 'atlas-label-road-major',
  labelRoadMinor: 'atlas-label-road-minor',
  labelPoi: 'atlas-label-poi',
  poisCluster: 'atlas-pois-cluster',
  poisClusterCount: 'atlas-pois-cluster-count',
  poisDot: 'atlas-pois-dot',
  placesHalo: 'atlas-places-halo',
  placesDot: 'atlas-places-dot',
  routeGlow: 'atlas-route-glow',
  routeCasing: 'atlas-route-casing',
  routeLine: 'atlas-route-line',
  routePointsHalo: 'atlas-route-points-halo',
  routePoints: 'atlas-route-points',
} as const

/* Glifos de OpenFreeMap: permiten dibujar los contadores de los clústeres
   también sobre el mapa satelital, que no trae glifos propios. */
const OFM_GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf'

function emptyFC(): FeatureCollection {
  return { type: 'FeatureCollection', features: [] }
}

/**
 * Etiquetas vectoriales propias para el mapa satelital.
 * Se dibujan con la fuente de OpenFreeMap y no dependen de un proveedor
 * de etiquetas raster (varios ya exigen clave y devuelven marcas de agua).
 */
function vectorLabelLayers(): LayerSpecification[] {
  return [
    {
      id: LAYER.labelWater,
      type: 'symbol',
      source: SRC.vector,
      'source-layer': 'water_name',
      minzoom: 3,
      filter: [
        'all',
        ['has', 'name'],
        ['in', ['get', 'class'], ['literal', ['ocean', 'sea', 'bay', 'lake', 'river', 'water']]],
      ],
      layout: {
        'text-field': ['coalesce', ['get', 'name:es'], ['get', 'name']],
        'text-font': ['Noto Sans Italic'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 3, 10, 9, 13, 15, 16],
        'text-letter-spacing': 0.08,
        'text-max-width': 9,
        'text-padding': 4,
        'text-rotation-alignment': 'viewport',
        'text-pitch-alignment': 'viewport',
        'symbol-sort-key': ['coalesce', ['get', 'rank'], 10],
      },
      paint: {
        'text-color': '#93c9c5',
        'text-halo-color': 'rgba(3, 9, 12, 0.9)',
        'text-halo-width': 1.4,
        'text-halo-blur': 0.4,
      },
    },
    {
      id: LAYER.labelPoi,
      type: 'symbol',
      source: SRC.vector,
      'source-layer': 'poi',
      minzoom: 14,
      filter: [
        'all',
        ['has', 'name'],
        [
          'in',
          ['get', 'class'],
          ['literal', ['park', 'garden', 'hospital', 'museum', 'stadium', 'airport', 'railway', 'zoo', 'university', 'college', 'attraction', 'viewpoint']],
        ],
      ],
      layout: {
        'text-field': ['coalesce', ['get', 'name:es'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 14, 9, 18, 11],
        'text-max-width': 8,
        'text-padding': 3,
        'text-optional': true,
        'text-rotation-alignment': 'viewport',
        'text-pitch-alignment': 'viewport',
        'symbol-sort-key': ['coalesce', ['get', 'rank'], 10],
      },
      paint: {
        'text-color': '#c9d9d4',
        'text-halo-color': 'rgba(3, 9, 12, 0.9)',
        'text-halo-width': 1.3,
        'text-halo-blur': 0.35,
      },
    },
    {
      id: LAYER.labelRoadMinor,
      type: 'symbol',
      source: SRC.vector,
      'source-layer': 'transportation_name',
      minzoom: 13,
      filter: [
        'all',
        ['has', 'name'],
        ['in', ['get', 'class'], ['literal', ['tertiary', 'residential', 'unclassified', 'living_street', 'service']]],
      ],
      layout: {
        'symbol-placement': 'line',
        'text-field': ['coalesce', ['get', 'name:es'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 13, 9, 17, 11],
        'symbol-spacing': ['interpolate', ['linear'], ['zoom'], 13, 360, 17, 240],
        'text-max-angle': 30,
        'text-padding': 2,
        'text-keep-upright': true,
        'text-rotation-alignment': 'map',
      },
      paint: {
        'text-color': '#d6e5e1',
        'text-halo-color': 'rgba(3, 9, 12, 0.94)',
        'text-halo-width': 1.5,
        'text-halo-blur': 0.25,
      },
    },
    {
      id: LAYER.labelRoadMajor,
      type: 'symbol',
      source: SRC.vector,
      'source-layer': 'transportation_name',
      minzoom: 10,
      filter: [
        'all',
        ['has', 'name'],
        ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary']]],
      ],
      layout: {
        'symbol-placement': 'line',
        'text-field': ['coalesce', ['get', 'name:es'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 10, 9, 14, 11, 18, 13],
        'symbol-spacing': ['interpolate', ['linear'], ['zoom'], 10, 380, 16, 240],
        'text-max-angle': 25,
        'text-padding': 2,
        'text-keep-upright': true,
        'text-rotation-alignment': 'map',
      },
      paint: {
        'text-color': '#f2e5c3',
        'text-halo-color': 'rgba(3, 9, 12, 0.94)',
        'text-halo-width': 1.7,
        'text-halo-blur': 0.3,
      },
    },
    {
      id: LAYER.labelDistrict,
      type: 'symbol',
      source: SRC.vector,
      'source-layer': 'place',
      minzoom: 11,
      filter: ['in', ['get', 'class'], ['literal', ['suburb', 'neighbourhood', 'village', 'hamlet', 'isolated_dwelling']]],
      layout: {
        'text-field': ['coalesce', ['get', 'name:es'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 11, 9, 16, 12],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.1,
        'text-max-width': 8,
        'text-padding': 4,
        'text-rotation-alignment': 'viewport',
        'text-pitch-alignment': 'viewport',
        'symbol-sort-key': ['coalesce', ['get', 'rank'], 10],
      },
      paint: {
        'text-color': '#dce8e3',
        'text-halo-color': 'rgba(3, 9, 12, 0.9)',
        'text-halo-width': 1.4,
        'text-halo-blur': 0.35,
      },
    },
    {
      id: LAYER.labelCity,
      type: 'symbol',
      source: SRC.vector,
      'source-layer': 'place',
      minzoom: 6,
      filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]],
      layout: {
        'text-field': ['coalesce', ['get', 'name:es'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 6, 11, 10, 14, 14, 18, 18, 21],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.06,
        'text-max-width': 9,
        'text-padding': 5,
        'text-rotation-alignment': 'viewport',
        'text-pitch-alignment': 'viewport',
        'symbol-sort-key': ['coalesce', ['get', 'rank'], 10],
      },
      paint: {
        'text-color': '#f3f8f4',
        'text-halo-color': 'rgba(2, 7, 9, 0.94)',
        'text-halo-width': 1.9,
        'text-halo-blur': 0.4,
      },
    },
    {
      id: LAYER.labelState,
      type: 'symbol',
      source: SRC.vector,
      'source-layer': 'place',
      minzoom: 4,
      maxzoom: 10,
      filter: ['in', ['get', 'class'], ['literal', ['state', 'province']]],
      layout: {
        'text-field': ['coalesce', ['get', 'name:es'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 4, 10, 8, 13],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.12,
        'text-max-width': 8,
        'text-padding': 5,
        'text-rotation-alignment': 'viewport',
        'text-pitch-alignment': 'viewport',
      },
      paint: {
        'text-color': '#d2dfda',
        'text-halo-color': 'rgba(3, 9, 12, 0.9)',
        'text-halo-width': 1.4,
        'text-halo-blur': 0.3,
      },
    },
    {
      id: LAYER.labelCountry,
      type: 'symbol',
      source: SRC.vector,
      'source-layer': 'place',
      minzoom: 2,
      maxzoom: 8,
      filter: ['==', ['get', 'class'], 'country'],
      layout: {
        'text-field': ['coalesce', ['get', 'name:es'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 2, 11, 5, 14, 8, 17],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.18,
        'text-max-width': 7,
        'text-padding': 6,
        'text-rotation-alignment': 'viewport',
        'text-pitch-alignment': 'viewport',
      },
      paint: {
        'text-color': '#f4ecd7',
        'text-halo-color': 'rgba(3, 9, 12, 0.92)',
        'text-halo-width': 1.6,
        'text-halo-blur': 0.4,
      },
    },
  ]
}

/**
 * Estilo inicial del mapa: URL de un estilo vectorial/satelital completo
 * o un estilo generado para teselas propias.
 */
export function baseStyleForBasemap(def: BasemapDef): string | StyleSpecification {
  if (def.styleUrl) return def.styleUrl

  const sources: Record<string, SourceSpecification> = {
    [SRC.basemap]: {
      type: 'raster',
      tiles: def.tiles ?? [],
      tileSize: 256,
      maxzoom: 19,
      ...(def.attribution ? { attribution: def.attribution } : {}),
    },
  }

  const layers: LayerSpecification[] = [
    { id: 'atlas-bg', type: 'background', paint: { 'background-color': '#04080a' } },
    {
      id: LAYER.satellite,
      type: 'raster',
      source: SRC.basemap,
      paint: {
        'raster-opacity': def.id === 'satellite' ? 0.98 : 0.94,
        ...(def.id === 'satellite'
          ? {
              /* Grado cinematográfico: imagen real, más oscura y desaturada
                 para que las capas de ATLAS sigan siendo legibles. */
              'raster-brightness-min': 0.01,
              'raster-brightness-max': 0.72,
              'raster-contrast': 0.18,
              'raster-saturation': -0.5,
              'raster-hue-rotate': 8,
              'raster-resampling': 'linear',
            }
          : {}),
      },
    },
  ]

  if (def.terrainTiles?.length) {
    const demOptions = {
      type: 'raster-dem' as const,
      tiles: def.terrainTiles,
      tileSize: 256,
      maxzoom: 15,
      encoding: 'terrarium' as const,
      ...(def.terrainAttribution ? { attribution: def.terrainAttribution } : {}),
    }
    sources[SRC.terrain] = { ...demOptions, tiles: [...demOptions.tiles] }
    /* MapLibre recomienda una fuente distinta para el sombreado y el terreno;
       ambas leen las mismas teselas, así que no se duplica la descarga. */
    sources[SRC.hillshade] = { ...demOptions, tiles: [...demOptions.tiles] }
    layers.push({
      id: LAYER.hillshade,
      type: 'hillshade',
      source: SRC.hillshade,
      paint: {
        'hillshade-exaggeration': 0.22,
        'hillshade-shadow-color': '#020608',
        'hillshade-highlight-color': '#d7e7e4',
        'hillshade-accent-color': '#1d3b40',
      },
    })
  }

  if (def.labelTiles?.length) {
    sources[SRC.labels] = {
      type: 'raster',
      tiles: def.labelTiles,
      tileSize: 256,
      maxzoom: 19,
      ...(def.labelAttribution ? { attribution: def.labelAttribution } : {}),
    }
    layers.push({
      id: LAYER.labels,
      type: 'raster',
      source: SRC.labels,
      paint: { 'raster-opacity': 0.95 },
    })
  }

  if (def.vectorLabels) {
    sources[SRC.vector] = {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
    }
    layers.push(...vectorLabelLayers())
  }

  const style: StyleSpecification = {
    version: 8,
    glyphs: OFM_GLYPHS,
    sources,
    layers,
  }

  if (def.terrainTiles?.length) {
    style.terrain = { source: SRC.terrain, exaggeration: 1.15 }
  }

  if (def.id === 'satellite') {
    style.sky = {
      'sky-color': '#091a22',
      'horizon-color': '#173b40',
      'fog-color': '#061014',
      'fog-ground-blend': 0.82,
      'horizon-fog-blend': 0.55,
      'sky-horizon-blend': 0.86,
      'atmosphere-blend': 0.6,
    }
  }

  return style
}

function overlaySources(): Array<[string, SourceSpecification]> {
  return [
    [
      SRC.pois,
      {
        type: 'geojson',
        data: emptyFC(),
        cluster: true,
        clusterMaxZoom: 15,
        clusterRadius: 46,
      },
    ],
    [SRC.places, { type: 'geojson', data: emptyFC() }],
    [SRC.route, { type: 'geojson', data: emptyFC() }],
  ]
}

function overlayLayers(): LayerSpecification[] {
  return [
    /* Ruta: halo + contorno + línea */
    {
      id: LAYER.routeGlow,
      type: 'line',
      source: SRC.route,
      paint: {
        'line-color': '#3fe0c8',
        'line-width': 11,
        'line-opacity': 0.18,
        'line-blur': 7,
      },
    },
    {
      id: LAYER.routeCasing,
      type: 'line',
      source: SRC.route,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': 'rgba(3, 16, 15, 0.85)',
        'line-width': 7.5,
      },
    },
    {
      id: LAYER.routeLine,
      type: 'line',
      source: SRC.route,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#3fe0c8',
        'line-width': 4,
      },
    },
    /* POI (ámbar, distinto del acento de ruta/selección) */
    {
      id: LAYER.poisCluster,
      type: 'circle',
      source: SRC.pois,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': 'rgba(240, 185, 90, 0.16)',
        'circle-radius': ['step', ['get', 'point_count'], 15, 10, 19, 40, 25],
        'circle-stroke-color': 'rgba(240, 185, 90, 0.8)',
        'circle-stroke-width': 1.5,
      },
    },
    {
      id: LAYER.poisClusterCount,
      type: 'symbol',
      source: SRC.pois,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': ['Noto Sans Regular'],
        'text-size': 11,
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#f7e9c8',
        'text-halo-color': 'rgba(6, 12, 14, 0.92)',
        'text-halo-width': 1.5,
      },
    },
    {
      id: LAYER.poisDot,
      type: 'circle',
      source: SRC.pois,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#f0b95a',
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 3.5, 14, 5.5, 17, 7.5],
        'circle-stroke-color': 'rgba(6, 12, 14, 0.9)',
        'circle-stroke-width': 1.4,
      },
    },
    /* Lugares seleccionados / resultados de búsqueda */
    {
      id: LAYER.placesHalo,
      type: 'circle',
      source: SRC.places,
      filter: ['==', ['get', 'selected'], true],
      paint: {
        'circle-color': 'rgba(63, 224, 200, 0.16)',
        'circle-radius': 17,
      },
    },
    {
      id: LAYER.placesDot,
      type: 'circle',
      source: SRC.places,
      paint: {
        'circle-color': ['case', ['==', ['get', 'selected'], true], '#3fe0c8', '#e9f2f1'],
        'circle-radius': ['case', ['==', ['get', 'selected'], true], 6.5, 4.5],
        'circle-stroke-color': 'rgba(6, 12, 14, 0.9)',
        'circle-stroke-width': 1.5,
      },
    },
    /* Puntos de ruta al final: deben quedar por encima del lugar seleccionado. */
    {
      id: LAYER.routePointsHalo,
      type: 'circle',
      source: SRC.route,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-color': [
          'match',
          ['get', 'role'],
          'origin',
          '#5be49b',
          'destination',
          '#f0b95a',
          'waypoint',
          '#e9f2f1',
          '#3fe0c8',
        ],
        'circle-radius': 13,
        'circle-opacity': 0.18,
        'circle-blur': 0.35,
      },
    },
    {
      id: LAYER.routePoints,
      type: 'circle',
      source: SRC.route,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-color': [
          'match',
          ['get', 'role'],
          'origin',
          '#5be49b',
          'destination',
          '#f0b95a',
          'waypoint',
          '#e9f2f1',
          '#3fe0c8',
        ],
        'circle-radius': ['match', ['get', 'role'], 'waypoint', 5, 7],
        'circle-stroke-color': 'rgba(6, 12, 14, 0.95)',
        'circle-stroke-width': 2,
      },
    },
  ]
}

/** Añade fuentes y capas propias encima del estilo ya cargado. Idempotente. */
export function addAtlasOverlays(map: MapLibreMap): void {
  for (const [id, spec] of overlaySources()) {
    if (!map.getSource(id)) map.addSource(id, spec)
  }
  const hasGlyphs = Boolean(map.getStyle().glyphs)
  for (const layer of overlayLayers()) {
    // Sin glifos (estilo raster propio) no se pueden pintar etiquetas.
    if (layer.type === 'symbol' && !hasGlyphs) continue
    if (!map.getLayer(layer.id)) map.addLayer(layer)
  }
}
