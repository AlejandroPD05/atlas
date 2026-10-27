import { act, fireEvent, render, screen } from '@testing-library/react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../../store/appStore'
import { MapControls } from './MapControls'

const { mapMock, emitMapEvent, setMapView, easeToCalls } = vi.hoisted(() => {
  const handlers = new Map<string, Set<() => void>>()
  const viewport = { pitch: 55, bearing: 0 }
  const calls: unknown[] = []
  const mapMock = {
    on(event: string, callback: () => void) {
      const set = handlers.get(event) ?? new Set<() => void>()
      set.add(callback)
      handlers.set(event, set)
      return mapMock
    },
    off(event: string, callback: () => void) {
      handlers.get(event)?.delete(callback)
      return mapMock
    },
    getPitch: () => viewport.pitch,
    getBearing: () => viewport.bearing,
    getZoom: () => 13,
    easeTo: (options: unknown) => {
      calls.push(options)
    },
  }
  return {
    mapMock,
    emitMapEvent: (event: string) => handlers.get(event)?.forEach((callback) => callback()),
    setMapView: (pitch: number, bearing: number) => {
      viewport.pitch = pitch
      viewport.bearing = bearing
    },
    easeToCalls: calls,
  }
})

vi.mock('./mapInstance', () => ({
  useMapInstance: () => mapMock as unknown as MapLibreMap,
}))

vi.mock('./useUserMarker', () => ({
  useUserMarker: () => undefined,
}))

beforeEach(() => {
  easeToCalls.length = 0
  setMapView(55, 0)
  useAppStore.setState({
    basemapId: 'satellite',
    sideCollapsed: false,
    userLocation: null,
    locationStatus: 'idle',
    prefs: { units: 'metric', reduceMotion: true, showPoiLayer: true, poiRadiusM: 1500 },
  })
})

describe('controles de cámara', () => {
  it('no muestra la brújula en la vista por defecto del satélite', () => {
    render(<MapControls />)
    expect(screen.queryByRole('button', { name: 'Restablecer orientación' })).not.toBeInTheDocument()
  })

  it('muestra la brújula al inclinar o girar y restaura el pitch del mapa base', () => {
    render(<MapControls />)

    act(() => {
      setMapView(70, 30)
      emitMapEvent('pitch')
      emitMapEvent('rotate')
    })

    const compass = screen.getByRole('button', { name: 'Restablecer orientación' })
    fireEvent.click(compass)

    expect(easeToCalls.at(-1)).toEqual({ bearing: 0, pitch: 55, duration: 500 })

    act(() => {
      setMapView(55, 0)
      emitMapEvent('pitch')
      emitMapEvent('rotate')
    })

    expect(screen.queryByRole('button', { name: 'Restablecer orientación' })).not.toBeInTheDocument()
  })
})
