import type { Feature, FeatureCollection, Point } from 'geojson'
import { GeoJSONSource } from 'maplibre-gl'
import type { MapLayerMouseEvent } from 'maplibre-gl'
import { useEffect, useRef } from 'react'
import { useAppStore } from '../../store/appStore'
import type { Place } from '../../types/domain'
import { LAYER, SRC } from './basemap'
import { useMapInstance } from './mapInstance'

function pointFor(place: Place, selected: boolean): Feature<Point> {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [place.coords.lng, place.coords.lat] },
    properties: { id: place.id, selected },
  }
}

function readId(e: MapLayerMouseEvent): string | null {
  const props: unknown = e.features?.[0]?.properties
  if (typeof props !== 'object' || props === null) return null
  const id = (props as Record<string, unknown>).id
  return typeof id === 'string' ? id : null
}

/** Sincroniza resultados de búsqueda y lugar seleccionado con la capa del mapa. */
export function useMapData(): void {
  const map = useMapInstance()
  const results = useAppStore((s) => s.searchResults)
  const selected = useAppStore((s) => s.selectedPlace)
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

    const onClick = (e: MapLayerMouseEvent) => {
      const id = readId(e)
      if (!id) return
      const place = lookupRef.current.get(id)
      if (place) useAppStore.getState().selectPlace(place)
    }
    const onEnter = () => {
      canvas.style.cursor = 'pointer'
    }
    const onLeave = () => {
      canvas.style.cursor = ''
    }

    map.on('click', LAYER.placesDot, onClick)
    map.on('mouseenter', LAYER.placesDot, onEnter)
    map.on('mouseleave', LAYER.placesDot, onLeave)

    return () => {
      map.off('click', LAYER.placesDot, onClick)
      map.off('mouseenter', LAYER.placesDot, onEnter)
      map.off('mouseleave', LAYER.placesDot, onLeave)
      canvas.style.cursor = ''
    }
  }, [map])
}
