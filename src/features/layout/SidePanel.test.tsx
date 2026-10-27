import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MOBILE_QUERY } from '../../hooks/useMediaQuery'
import { useAppStore } from '../../store/appStore'
import { SidePanel } from './SidePanel'

const sheetHeights = { collapsed: 489.5, expanded: 640 }

function stubMobileMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn((query: string) => ({
    matches: query === MOBILE_QUERY ? matches : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

function getSheetElements() {
  const sheet = document.getElementById('atlas-sheet')
  if (!sheet) throw new Error('No se encontró el bottom sheet')
  const handle = screen.getByRole('button', { name: /(Expandir|Contraer) panel/ })
  vi.spyOn(sheet, 'getBoundingClientRect').mockImplementation(() => {
    const expanded = handle.getAttribute('aria-expanded') === 'true'
    const height = expanded ? sheetHeights.expanded : sheetHeights.collapsed
    return {
      x: 0,
      y: 0,
      width: 374,
      height,
      top: 0,
      right: 374,
      bottom: height,
      left: 0,
      toJSON: () => ({}),
    } as DOMRect
  })
  return { sheet, handle }
}

beforeEach(() => {
  stubMobileMatchMedia(true)
  /* jsdom no implementa pointer capture; el arrastre lo usa al empezar y al soltar. */
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
    configurable: true,
    value: vi.fn(),
  })
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
    configurable: true,
    value: vi.fn(),
  })
  Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
    configurable: true,
    value: vi.fn(() => false),
  })
  /* Altura de viewport estable: el sheet calcula sus dos topes en píxeles. */
  window.innerHeight = 900
  useAppStore.setState({
    activeTab: 'search',
    mobileSheetOpen: true,
    sideCollapsed: false,
    basemapId: 'satellite',
    settingsOpen: false,
    prefs: { units: 'metric', reduceMotion: true, showPoiLayer: true, poiRadiusM: 1500 },
    selectedPlace: null,
    userLocation: null,
    locationStatus: 'idle',
    notices: [],
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  useAppStore.setState({ mobileSheetOpen: false })
})

describe('bottom sheet móvil', () => {
  it('alterna entre las dos alturas con clic', () => {
    render(<SidePanel />)
    const { handle } = getSheetElements()

    expect(handle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(handle)
    expect(handle).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(handle)
    expect(handle).toHaveAttribute('aria-expanded', 'false')
  })

  it('arrastra hacia arriba, actualiza la altura en vivo y hace snap', () => {
    render(<SidePanel />)
    const { sheet, handle } = getSheetElements()

    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, buttons: 1, clientY: 287.5 })
    fireEvent.pointerMove(handle, { pointerId: 1, buttons: 1, clientY: 187.5 })

    expect(sheet.style.height).toBe('589.5px')

    fireEvent.pointerUp(handle, { pointerId: 1, button: 0, buttons: 0, clientY: 187.5 })

    expect(handle).toHaveAttribute('aria-expanded', 'true')
    expect(sheet.style.height).toBe('')
  })

  it('arrastra hacia abajo desde la altura expandida y vuelve a la media', () => {
    render(<SidePanel />)
    const { sheet, handle } = getSheetElements()

    fireEvent.click(handle)
    expect(handle).toHaveAttribute('aria-expanded', 'true')

    fireEvent.pointerDown(handle, { pointerId: 2, button: 0, buttons: 1, clientY: 100 })
    fireEvent.pointerMove(handle, { pointerId: 2, buttons: 1, clientY: 200 })
    expect(sheet.style.height).toBe('540px')

    fireEvent.pointerUp(handle, { pointerId: 2, button: 0, buttons: 0, clientY: 200 })
    expect(handle).toHaveAttribute('aria-expanded', 'false')
  })

  it('ignora el clic que sigue al arrastre y recupera el clic normal después', () => {
    vi.useFakeTimers()
    render(<SidePanel />)
    const { handle } = getSheetElements()

    fireEvent.pointerDown(handle, { pointerId: 3, button: 0, buttons: 1, clientY: 200 })
    fireEvent.pointerMove(handle, { pointerId: 3, buttons: 1, clientY: 100 })
    fireEvent.pointerUp(handle, { pointerId: 3, button: 0, buttons: 0, clientY: 100 })

    expect(handle).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(handle)
    expect(handle).toHaveAttribute('aria-expanded', 'true')

    act(() => {
      vi.advanceTimersByTime(301)
    })
    fireEvent.click(handle)
    expect(handle).toHaveAttribute('aria-expanded', 'false')
  })

  it('responde a las flechas del teclado', () => {
    render(<SidePanel />)
    const { handle } = getSheetElements()

    handle.focus()
    fireEvent.keyDown(handle, { key: 'ArrowUp' })
    expect(handle).toHaveAttribute('aria-expanded', 'true')

    fireEvent.keyDown(handle, { key: 'ArrowDown' })
    expect(handle).toHaveAttribute('aria-expanded', 'false')
  })

  it('vuelve a la altura media al cerrar y reabrir', () => {
    render(<SidePanel />)
    const { handle } = getSheetElements()

    fireEvent.click(handle)
    expect(handle).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar panel' }))
    expect(document.getElementById('atlas-sheet')).toBeNull()

    act(() => useAppStore.setState({ mobileSheetOpen: true }))
    const reopened = screen.getByRole('button', { name: 'Expandir panel' })
    expect(reopened).toHaveAttribute('aria-expanded', 'false')
  })
})
