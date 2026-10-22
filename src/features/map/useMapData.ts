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

function readId(feature: { properties?: unknown } | undefined): string | null {
  const props = feature?.properties
  if (typeof props !== 'object' || props === null) return null
  const id = (props as Record<string, unknown>).id
  return typeof id === 'string' ? id : null
}

/** Sincroniza lugares con el mapa y centraliza los clics sobre el lienzo. */
export function useMapData(): void {
  const map = useMapInstance()
  const results = useAppStore((s) => s.searchResults)
  const selected = useAppStore((s) => s.selectedPlace)
  const routePickTarget = useAppStore((s) => s.routePickTarget)
  const lookupRef = useRef<Map<string, Place>>(new Map())

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

      if (!map.getLayer(LAYER.placesDot)) return
      const hits = map.queryRenderedFeatures(e.point, { layers: [LAYER.placesDot] })
      const id = readId(hits[0])
      if (!id) return
      const place = lookupRef.current.get(id)
      if (place) store.selectPlace(place)
    }
    const onEnter = () => {
      if (!useAppStore.getState().routePickTarget) canvas.style.cursor = 'pointer'
    }
    const onLeave = () => {
      if (!useAppStore.getState().routePickTarget) canvas.style.cursor = ''
    }

    map.on('click', onMapClick)
    map.on('mouseenter', LAYER.placesDot, onEnter)
    map.on('mouseleave', LAYER.placesDot, onLeave)

    return () => {
      map.off('click', onMapClick)
      map.off('mouseenter', LAYER.placesDot, onEnter)
      map.off('mouseleave', LAYER.placesDot, onLeave)
      canvas.style.cursor = ''
    }
  }, [map])
}
