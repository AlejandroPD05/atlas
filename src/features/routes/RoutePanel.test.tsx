import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../../store/appStore'
import type { RoutePlan } from '../../types/domain'
import { downloadTextFile } from '../../utils/download'
import { RoutePanel } from './RoutePanel'

vi.mock('../../utils/download', () => ({
  downloadTextFile: vi.fn(),
}))

const plan: RoutePlan = {
  id: 'route_1',
  mode: 'driving',
  preference: 'fast',
  distanceM: 2400,
  durationS: 600,
  geometry: [
    [-3.70379, 40.41678],
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
      label: 'Puerta del Sol',
      coords: { lng: -3.70379, lat: 40.41678 },
    },
    {
      id: 'destination',
      kind: 'destination',
      label: 'El Retiro',
      coords: { lng: -3.7, lat: 40.42 },
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  useAppStore.setState({
    routeOrigin: {
      id: 'origin',
      kind: 'origin',
      label: 'Puerta del Sol',
      coords: { lng: -3.70379, lat: 40.41678 },
    },
    routeDestination: {
      id: 'destination',
      kind: 'destination',
      label: 'El Retiro',
      coords: { lng: -3.7, lat: 40.42 },
    },
    routeWaypoints: [],
    travelMode: 'driving',
    routePreference: 'fast',
    routeStatus: 'done',
    routeError: null,
    routePlan: plan,
    routeAlternatives: [],
    prefs: { units: 'metric', reduceMotion: true, showPoiLayer: true, poiRadiusM: 1500 },
  })
})

describe('RoutePanel · exportación', () => {
  it('descarga la ruta en GPX con los datos del proveedor', async () => {
    const user = userEvent.setup()
    render(<RoutePanel />)

    await user.click(screen.getByRole('button', { name: 'Descargar GPX' }))

    expect(downloadTextFile).toHaveBeenCalledTimes(1)
    const [fileName, content, mime] = vi.mocked(downloadTextFile).mock.calls[0]!
    expect(fileName).toBe('atlas-ruta-driving.gpx')
    expect(mime).toBe('application/gpx+xml;charset=utf-8')
    expect(content).toContain('<trkpt lat="40.41678" lon="-3.70379" />')
    expect(content).toContain('<name>Puerta del Sol</name>')
  })

  it('descarga la ruta en GeoJSON con una línea y las paradas', async () => {
    const user = userEvent.setup()
    render(<RoutePanel />)

    await user.click(screen.getByRole('button', { name: 'Descargar GeoJSON' }))

    expect(downloadTextFile).toHaveBeenCalledTimes(1)
    const [fileName, content, mime] = vi.mocked(downloadTextFile).mock.calls[0]!
    expect(fileName).toBe('atlas-ruta-driving.geojson')
    expect(mime).toBe('application/geo+json;charset=utf-8')
    const geojson = JSON.parse(content) as { features: Array<{ geometry: { type: string } }> }
    expect(geojson.features[0]?.geometry.type).toBe('LineString')
    expect(geojson.features).toHaveLength(3)
  })
})
