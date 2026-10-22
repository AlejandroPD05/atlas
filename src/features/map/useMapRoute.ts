import type { Feature, FeatureCollection, LineString, Point } from 'geojson'
import { GeoJSONSource, LngLatBounds } from 'maplibre-gl'
import { useEffect } from 'react'
import { useAppStore } from '../../store/appStore'
import type { LngLat } from '../../types/domain'
import { SRC } from './basemap'
import { useMapInstance } from './mapInstance'

type RouteRole = 'origin' | 'destination' | 'waypoint'

function endpointFeature(coords: LngLat, role: RouteRole): Feature<Point> {
  return {
    type: 'Feature',
    properties: { role },
    geometry: {
      type: 'Point',
      coordinates: [coords.lng, coords.lat],
    },
  }
}

/** Pinta la ruta seleccionada y sus puntos; ajusta la vista cuando llega una ruta nueva. */
export function useMapRoute(): void {
  const map = useMapInstance()
  const plan = useAppStore((s) => s.routePlan)
  const origin = useAppStore((s) => s.routeOrigin)
  const destination = useAppStore((s) => s.routeDestination)
  const waypoints = useAppStore((s) => s.routeWaypoints)
  const reduceMotion = useAppStore((s) => s.prefs.reduceMotion)

  useEffect(() => {
    if (!map) return
    const source = map.getSource(SRC.route)
    if (!(source instanceof GeoJSONSource)) return

    const features: Feature[] = []

    if (plan && plan.geometry.length >= 2) {
      const line: Feature<LineString> = {
        type: 'Feature',
        properties: { role: 'route' },
        geometry: { type: 'LineString', coordinates: plan.geometry },
      }
      features.push(line)
    }
    if (origin?.coords) features.push(endpointFeature(origin.coords, 'origin'))
    waypoints.forEach((stop) => {
      if (stop.coords) features.push(endpointFeature(stop.coords, 'waypoint'))
    })
    if (destination?.coords) features.push(endpointFeature(destination.coords, 'destination'))

    const data: FeatureCollection = { type: 'FeatureCollection', features }
    source.setData(data)
  }, [map, plan, origin, waypoints, destination])

  useEffect(() => {
    if (!map || !plan || plan.geometry.length < 2) return

    const bounds = new LngLatBounds()
    plan.geometry.forEach(([lng, lat]) => bounds.extend([lng, lat]))
    if (bounds.isEmpty()) return

    const state = useAppStore.getState()
    const mobile = window.innerWidth <= 860
    const padding = mobile
      ? { top: 84, right: 24, bottom: 160, left: 24 }
      : {
          top: 96,
          left: state.sideCollapsed ? 90 : 430,
          right: state.selectedPlace ? 380 : 70,
          bottom: 86,
        }

    map.fitBounds(bounds, {
      padding,
      maxZoom: 15.5,
      duration: reduceMotion ? 0 : 900,
    })
  }, [map, plan, reduceMotion])
}
