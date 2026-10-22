import type { FeatureCollection } from 'geojson'
import type { LayerSpecification, StyleSpecification } from 'maplibre-gl'
import type { BasemapDef } from '../../app/config'

/* Estilo raster + capas GeoJSON propias (POI, lugares, ruta).
   Sin capas symbol → no hacen falta glifos ni sprite externos. */

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
} as const

function emptyFC(): FeatureCollection {
  return { type: 'FeatureCollection', features: [] }
}

export function styleForBasemap(def: BasemapDef): StyleSpecification {
  const layers = [
    {
      id: 'atlas-bg',
      type: 'background',
      paint: { 'background-color': '#06090b' },
    },
    {
      id: 'atlas-basemap',
      type: 'raster',
      source: SRC.basemap,
      paint: { 'raster-opacity': 0.94 },
    },
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
        'circle-color': [
          'case',
          ['==', ['get', 'selected'], true],
          '#3fe0c8',
          '#e9f2f1',
        ],
        'circle-radius': ['case', ['==', ['get', 'selected'], true], 6.5, 4.5],
        'circle-stroke-color': 'rgba(6, 12, 14, 0.9)',
        'circle-stroke-width': 1.5,
      },
    },
  ] as LayerSpecification[]

  return {
    version: 8,
    sources: {
      [SRC.basemap]: {
        type: 'raster',
        tiles: def.tiles,
        tileSize: 256,
        maxzoom: 19,
        attribution: def.attribution,
      },
      [SRC.pois]: {
        type: 'geojson',
        data: emptyFC(),
        cluster: true,
        clusterMaxZoom: 15,
        clusterRadius: 46,
      },
      [SRC.places]: { type: 'geojson', data: emptyFC() },
      [SRC.route]: { type: 'geojson', data: emptyFC() },
    },
    layers,
  }
}
