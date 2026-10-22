import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SavedPanel } from './SavedPanel'
import { useAppStore } from '../../store/appStore'
import type { Place } from '../../types/domain'

const place: Place = {
  id: 'node/1',
  name: 'Museo del Prado',
  category: 'museo',
  address: 'Calle de Ruiz de Alarcón, 23',
  coords: { lng: -3.692, lat: 40.4138 },
  source: 'osm',
  quality: 'real',
}

beforeEach(() => {
  localStorage.clear()
  useAppStore.setState({
    collections: [],
    collectionsSeedDone: true,
    selectedPlace: null,
    routeDestination: null,
    activeTab: 'saved',
    prefs: { units: 'metric', reduceMotion: true, showPoiLayer: true },
  })
})

describe('SavedPanel', () => {
  it('crea una colección desde el formulario', async () => {
    const user = userEvent.setup()
    render(<SavedPanel />)

    expect(screen.getByText('Sin colecciones todavía')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Nombre de la nueva colección'), 'Favoritos{Enter}')

    expect(useAppStore.getState().collections).toHaveLength(1)
    expect(useAppStore.getState().collections[0]?.name).toBe('Favoritos')
    expect(screen.getByText('Favoritos')).toBeInTheDocument()
  })

  it('abre la ficha, traza una ruta y quita un lugar guardado', async () => {
    const user = userEvent.setup()
    const store = useAppStore.getState()
    const collectionId = store.createCollection('Madrid')
    store.addPlaceToCollection(collectionId, place)
    render(<SavedPanel />)

    expect(screen.getByText('Museo del Prado')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ver Museo del Prado en el mapa' }))
    expect(useAppStore.getState().selectedPlace?.name).toBe('Museo del Prado')

    await user.click(screen.getByRole('button', { name: 'Cómo llegar a Museo del Prado' }))
    expect(useAppStore.getState().routeDestination?.label).toBe('Museo del Prado')
    expect(useAppStore.getState().activeTab).toBe('route')

    await user.click(
      screen.getByRole('button', { name: 'Quitar Museo del Prado de Madrid' }),
    )
    expect(useAppStore.getState().collections[0]?.places).toHaveLength(0)
  })

  it('renombra y elimina una colección con confirmación', async () => {
    const user = userEvent.setup()
    useAppStore.getState().createCollection('Viajes')
    render(<SavedPanel />)

    await user.click(screen.getByRole('button', { name: 'Renombrar Viajes' }))
    const input = screen.getByLabelText('Nuevo nombre para Viajes')
    await user.clear(input)
    await user.type(input, 'Escapadas{Enter}')
    expect(useAppStore.getState().collections[0]?.name).toBe('Escapadas')

    await user.click(screen.getByRole('button', { name: 'Eliminar Escapadas' }))
    expect(screen.getByRole('group', { name: 'Confirmar eliminación de Escapadas' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(useAppStore.getState().collections).toHaveLength(0)
  })
})
