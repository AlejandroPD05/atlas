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

   Dos modos:
   1. Estilo vectorial completo (OpenFreeMap por defecto): aporta sus
      fuentes, glifos, sprite y atribución. ATLAS añade sus capas GeoJSON
      cuando el estilo ha terminado de cargar.
   2. Teselas raster propias (VITE_TILES_*): estilo mínimo generado aquí.
   Las capas propias no se incrustan en estilos de terceros para no
   depender de su estructura interna.
   ═══════════════════════════════════════════════════════════════ */

export const SRC = {
  basemap: 'atlas-bm',
  pois: 'atlas-pois',
  places: 'atlas-places',
  route: 'atlas-route',
} as const

export const LAYER = {
  poisCluster: 'atlas-pois-cluster',
  poisDot: 'atlas-pois-dot',
  placesHalo: 'atlas-places-halo',
  placesDot: 'atlas-places-dot',
  routeGlow: 'atlas-route-glow',
  routeCasing: 'atlas-route-casing',
  routeLine: 'atlas-route-line',
  routePointsHalo: 'atlas-route-points-halo',
  routePoints: 'atlas-route-points',
} as const

function emptyFC(): FeatureCollection {
  return { type: 'FeatureCollection', features: [] }
}

/**
 * Estilo inicial del mapa: URL de un estilo vectorial (OpenFreeMap)
 * o un estilo raster generado para teselas propias.
 */
export function baseStyleForBasemap(def: BasemapDef): string | StyleSpecification {
  if (def.styleUrl) return def.styleUrl

  return {
    version: 8,
    sources: {
      [SRC.basemap]: {
        type: 'raster',
        tiles: def.tiles ?? [],
        tileSize: 256,
        maxzoom: 19,
        ...(def.attribution ? { attribution: def.attribution } : {}),
      },
    },
    layers: [
      { id: 'atlas-bg', type: 'background', paint: { 'background-color': '#06090b' } },
      { id: 'atlas-basemap', type: 'raster', source: SRC.basemap, paint: { 'raster-opacity': 0.94 } },
    ],
  }
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
  for (const layer of overlayLayers()) {
    if (!map.getLayer(layer.id)) map.addLayer(layer)
  }
}
