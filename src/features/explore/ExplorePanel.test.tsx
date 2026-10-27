import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { searchPlacesAround } from '../../services/pois/overpass'
import { useAppStore } from '../../store/appStore'
import type { Place } from '../../types/domain'
import { ExplorePanel } from './ExplorePanel'

vi.mock('../../services/pois/overpass', () => ({
  searchPlacesAround: vi.fn(),
}))

const cafe: Place = {
  id: 'node/2',
  name: 'Café Central',
  category: 'cafeteria',
  address: 'Plaza del Rey, 1',
  coords: { lng: -3.704, lat: 40.4155 },
  source: 'osm',
  quality: 'real',
}

beforeEach(() => {
  vi.clearAllMocks()
  useAppStore.setState({
    exploreCategory: null,
    exploreStatus: 'idle',
    explorePois: [],
    exploreError: null,
    exploreAnchor: null,
    selectedPlace: null,
    prefs: { units: 'metric', reduceMotion: true, showPoiLayer: true, poiRadiusM: 1500 },
  })
})

describe('ExplorePanel', () => {
  it('consulta Overpass al elegir una categoría y lista los lugares reales', async () => {
    vi.mocked(searchPlacesAround).mockResolvedValue([cafe])
    const user = userEvent.setup()
    render(<ExplorePanel />)

    expect(screen.getByText('Qué hay cerca')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cafeterías' }))

    expect(await screen.findByText('Café Central')).toBeInTheDocument()
    expect(screen.getByText(/1 lugar encontrado/)).toBeInTheDocument()
    expect(searchPlacesAround).toHaveBeenCalledWith(
      expect.objectContaining({ category: expect.objectContaining({ id: 'cafeteria' }) }),
    )

    await user.click(screen.getByRole('button', { name: 'Abrir ficha de Café Central' }))
    expect(useAppStore.getState().selectedPlace?.name).toBe('Café Central')
  })

  it('muestra el error de Overpass sin inventar resultados', async () => {
    vi.mocked(searchPlacesAround).mockRejectedValue(new Error('Overpass no disponible'))
    const user = userEvent.setup()
    render(<ExplorePanel />)

    await user.click(screen.getByRole('button', { name: 'Farmacias' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/No se pudo completar la consulta/)
    expect(screen.queryByText(/lugar encontrado/)).not.toBeInTheDocument()
  })

  it('guarda el radio elegido y lo aplica a la categoría activa', async () => {
    vi.mocked(searchPlacesAround).mockResolvedValue([])
    const user = userEvent.setup()
    render(<ExplorePanel />)

    await user.click(screen.getByRole('button', { name: 'Cafeterías' }))
    await waitFor(() => expect(searchPlacesAround).toHaveBeenCalledTimes(1))
    expect(searchPlacesAround).toHaveBeenLastCalledWith(
      expect.objectContaining({ radiusM: 1500 }),
    )

    await user.click(screen.getByRole('button', { name: '3 km' }))

    await waitFor(() => expect(searchPlacesAround).toHaveBeenCalledTimes(2))
    expect(searchPlacesAround).toHaveBeenLastCalledWith(
      expect.objectContaining({ radiusM: 3000 }),
    )
    expect(useAppStore.getState().prefs.poiRadiusM).toBe(3000)
  })
})
