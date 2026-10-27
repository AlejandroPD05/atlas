import { describe, expect, it } from 'vitest'
import type { RoutePlan } from '../../types/domain'
import { routeExportFileName, routeToGeoJson, routeToGpx } from './exportRoute'

const plan: RoutePlan = {
  id: 'route_1',
  mode: 'driving',
  preference: 'fast',
  distanceM: 1234.6,
  durationS: 321,
  geometry: [
    [-3.70379, 40.41678],
    [-3.70123, 40.4189],
    [-3.7, 40.42],
  ],
  legs: [],
  notes: [],
  provider: 'OSRM',
  providerIsDemo: true,
  stops: [
    {
      id: 'origin',
      kind: 'origin',
      label: 'Puerta & <Sol>',
      coords: { lng: -3.70379, lat: 40.41678 },
    },
    { id: 'waypoint', kind: 'waypoint', label: 'Parada sin coordenadas' },
    {
      id: 'destination',
      kind: 'destination',
      label: 'El Retiro',
      coords: { lng: -3.7, lat: 40.42 },
    },
  ],
}

describe('routeToGeoJson', () => {
  it('serializa la geometría y las paradas con coordenadas', () => {
    const geojson = JSON.parse(routeToGeoJson(plan)) as {
      type: string
      features: Array<{
        properties: Record<string, unknown>
        geometry: { type: string; coordinates: unknown }
      }>
    }

    expect(geojson.type).toBe('FeatureCollection')
    expect(geojson.features).toHaveLength(3)
    expect(geojson.features[0]?.geometry).toEqual({
      type: 'LineString',
      coordinates: plan.geometry,
    })
    expect(geojson.features[0]?.properties).toMatchObject({
      name: 'Ruta Coche',
      mode: 'driving',
      preference: 'fast',
      distance_m: 1235,
      duration_s: 321,
      provider: 'OSRM',
      provider_is_demo: true,
    })
    expect(geojson.features[1]).toMatchObject({
      properties: { name: 'Puerta & <Sol>', role: 'origin', stop_index: 0 },
      geometry: { type: 'Point', coordinates: [-3.70379, 40.41678] },
    })
    expect(geojson.features[2]?.properties).toMatchObject({ name: 'El Retiro', role: 'destination' })
  })
})

describe('routeToGpx', () => {
  it('serializa una traza y waypoints, escapando el XML', () => {
    const gpx = routeToGpx(plan)

    expect(gpx).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(gpx.match(/<trkpt /g)).toHaveLength(3)
    expect(gpx.match(/<wpt /g)).toHaveLength(2)
    expect(gpx).toContain('<name>Puerta &amp; &lt;Sol&gt;</name>')
    expect(gpx).toContain('1235 m')
    expect(gpx).toContain('321 s')
    expect(gpx).not.toContain('Parada sin coordenadas')
    expect(gpx).toContain('lat="40.41678" lon="-3.70379"')
  })
})

describe('routeExportFileName', () => {
  it('usa el modo y la extensión del formato', () => {
    expect(routeExportFileName(plan, 'gpx')).toBe('atlas-ruta-driving.gpx')
    expect(routeExportFileName(plan, 'geojson')).toBe('atlas-ruta-driving.geojson')
  })
})
