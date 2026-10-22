import type { Feature, FeatureCollection, Point } from 'geojson'
import { GeoJSONSource, type MapMouseEvent } from 'maplibre-gl'
import { useEffect, useRef } from 'react'
import { useAppStore } from '../../store/appStore'
import type { Place } from '../../types/domain'
import { uid } from '../../utils/id'
import { LAYER, SRC } from './basemap'
import { useMapInstance } from './mapInstance'

function pointFor(place: Place, selected: boolean): Feature<Point> {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [place.coords.lng, place.coords.lat] },
    properties: { id: place.id, selected },
  }
}

function poiPointFor(place: Place): Feature<Point> {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [place.coords.lng, place.coords.lat] },
    properties: { id: place.id, name: place.name, category: place.category },
  }
}

function readId(feature: { properties?: unknown } | undefined): string | null {
  const props = feature?.properties
  if (typeof props !== 'object' || props === null) return null
  const id = (props as Record<string, unknown>).id
  return typeof id === 'string' ? id : null
}

/** Sincroniza lugares y POI con el mapa y centraliza los clics sobre el lienzo. */
export function useMapData(): void {
  const map = useMapInstance()
  const results = useAppStore((s) => s.searchResults)
  const selected = useAppStore((s) => s.selectedPlace)
  const explorePois = useAppStore((s) => s.explorePois)
  const showPoiLayer = useAppStore((s) => s.prefs.showPoiLayer)
  const routePickTarget = useAppStore((s) => s.routePickTarget)
  const lookupRef = useRef<Map<string, Place>>(new Map())
  const poiLookupRef = useRef<Map<string, Place>>(new Map())

  useEffect(() => {
    if (!map) return
    const source = map.getSource(SRC.places)
    if (!(source instanceof GeoJSONSource)) return

    const lookup = new Map<string, Place>()
    const features: Array<Feature<Point>> = []

    for (const r of results) {
      lookup.set(r.place.id, r.place)
      features.push(pointFor(r.place, selected?.id === r.place.id))
    }
    if (selected && !lookup.has(selected.id)) {
      lookup.set(selected.id, selected)
      features.push(pointFor(selected, true))
    }

    lookupRef.current = lookup
    const data: FeatureCollection<Point> = { type: 'FeatureCollection', features }
    source.setData(data)
  }, [map, results, selected])

  /* POI de Explorar: fuente con clustering real de MapLibre. */
  useEffect(() => {
    if (!map) return
    const source = map.getSource(SRC.pois)
    if (!(source instanceof GeoJSONSource)) return

    const lookup = new Map<string, Place>()
    const features = explorePois.map((place) => {
      lookup.set(place.id, place)
      return poiPointFor(place)
    })

    poiLookupRef.current = lookup
    const data: FeatureCollection<Point> = { type: 'FeatureCollection', features }
    source.setData(data)
  }, [map, explorePois])

  useEffect(() => {
    if (!map) return
    const visibility = showPoiLayer ? 'visible' : 'none'
    for (const id of [LAYER.poisCluster, LAYER.poisClusterCount, LAYER.poisDot]) {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visibility)
    }
  }, [map, showPoiLayer])

  useEffect(() => {
    if (!map) return
    const canvas = map.getCanvas()
    canvas.style.cursor = routePickTarget ? 'crosshair' : ''
    return () => {
      canvas.style.cursor = ''
    }
  }, [map, routePickTarget])

  useEffect(() => {
    if (!map) return
    const canvas = map.getCanvas()

    const onMapClick = (e: MapMouseEvent) => {
      const store = useAppStore.getState()

      if (store.routePickTarget) {
        const coords = { lng: e.lngLat.lng, lat: e.lngLat.lat }
        const endpoint = {
          id: uid('endpoint'),
          kind: store.routePickTarget,
          label: 'Punto en el mapa',
          coords,
        }
        if (store.routePickTarget === 'origin') store.setRouteOrigin(endpoint)
        else if (store.routePickTarget === 'destination') store.setRouteDestination(endpoint)
        else if (store.routeWaypoints.length < 4) store.addRouteWaypoint(endpoint)
        else {
          store.pushNotice({
            kind: 'warn',
            title: 'Máximo de paradas alcanzado',
            detail: 'Quita una parada antes de añadir otra. El límite es de 4.',
          })
        }
        store.setRoutePickTarget(null)
        store.setActiveTab('route')
        if (window.matchMedia('(max-width: 860px)').matches) store.setMobileSheetOpen(true)
        return
      }

      /* Un grupo de POI acerca el mapa hasta separar sus puntos. */
      if (map.getLayer(LAYER.poisCluster)) {
        const cluster = map.queryRenderedFeatures(e.point, { layers: [LAYER.poisCluster] })[0]
        const clusterId = cluster?.properties?.cluster_id
        const geometry = cluster?.geometry
        if (typeof clusterId === 'number' && geometry?.type === 'Point') {
          const source = map.getSource(SRC.pois)
          if (source instanceof GeoJSONSource) {
            const [lng, lat] = geometry.coordinates
            void source
              .getClusterExpansionZoom(clusterId)
              .then((zoom) => {
                map.easeTo({
                  center: [lng, lat],
                  zoom,
                  duration: useAppStore.getState().prefs.reduceMotion ? 0 : 450,
                })
              })
              .catch(() => {
                /* La fuente puede cambiar mientras se calcula el zoom. */
              })
          }
          return
        }
      }

      /* Resultados de búsqueda y lugar seleccionado. */
      if (map.getLayer(LAYER.placesDot)) {
        const hits = map.queryRenderedFeatures(e.point, { layers: [LAYER.placesDot] })
        const id = readId(hits[0])
        if (id) {
          const place = lookupRef.current.get(id)
          if (place) {
            store.selectPlace(place)
            return
          }
        }
      }

      /* POI de Explorar. */
      if (map.getLayer(LAYER.poisDot)) {
        const hits = map.queryRenderedFeatures(e.point, { layers: [LAYER.poisDot] })
        const id = readId(hits[0])
        if (id) {
          const place = poiLookupRef.current.get(id)
          if (place) store.selectPlace(place)
        }
      }
    }
    const onEnter = () => {
      if (!useAppStore.getState().routePickTarget) canvas.style.cursor = 'pointer'
    }
    const onLeave = () => {
      if (!useAppStore.getState().routePickTarget) canvas.style.cursor = ''
    }

    const interactiveLayers = [LAYER.placesDot, LAYER.poisCluster, LAYER.poisDot].filter((id) =>
      Boolean(map.getLayer(id)),
    )

    map.on('click', onMapClick)
    for (const id of interactiveLayers) {
      map.on('mouseenter', id, onEnter)
      map.on('mouseleave', id, onLeave)
    }

    return () => {
      map.off('click', onMapClick)
      for (const id of interactiveLayers) {
        map.off('mouseenter', id, onEnter)
        map.off('mouseleave', id, onLeave)
      }
      canvas.style.cursor = ''
    }
  }, [map])
}
