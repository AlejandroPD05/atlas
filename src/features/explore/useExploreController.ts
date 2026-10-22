import { useCallback, useEffect, useRef } from 'react'
import { appConfig } from '../../app/config'
import { HttpError, describeHttpError } from '../../services/http'
import { searchPlacesAround } from '../../services/pois/overpass'
import { useAppStore } from '../../store/appStore'
import type { Place, PlaceCategory } from '../../types/domain'
import { isAbortError } from '../../utils/async'
import { haversineDistanceM } from '../../utils/geo'
import { getCategory } from './categories'
import { getMapInstance } from '../map/mapInstance'

const EXPLORE_RADIUS_M = 1500
const EXPLORE_LIMIT = 60

function sortByDistance(places: Place[], center: { lng: number; lat: number }): Place[] {
  return [...places].sort(
    (a, b) => haversineDistanceM(center, a.coords) - haversineDistanceM(center, b.coords),
  )
}

function isAborted(error: unknown): boolean {
  return isAbortError(error) || (error instanceof HttpError && error.kind === 'aborted')
}

/** Explora POI reales de OpenStreetMap alrededor del centro del mapa. */
export function useExploreController() {
  const abortRef = useRef<AbortController | null>(null)
  const lastCategoryRef = useRef<PlaceCategory | null>(null)

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const runCategory = useCallback(async (category: PlaceCategory) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    lastCategoryRef.current = category

    const store = useAppStore.getState()
    const center = store.viewport.center
    const zoom = store.viewport.zoom

    store.setExploreCategory(category.id)
    store.setExploreResult([], { center, zoom })
    store.setExploreStatus('loading')
    store.setExploreError(null)

    try {
      const places = await searchPlacesAround({
        baseUrl: appConfig.pois.url,
        category,
        center,
        radiusM: EXPLORE_RADIUS_M,
        limit: EXPLORE_LIMIT,
        signal: controller.signal,
      })
      if (controller.signal.aborted) return
      store.setExploreResult(sortByDistance(places, center), { center, zoom })
    } catch (error) {
      if (controller.signal.aborted || isAborted(error)) return
      store.setExploreError(describeHttpError(error))
    }
  }, [])

  const refresh = useCallback(() => {
    const store = useAppStore.getState()
    const category = lastCategoryRef.current ?? (store.exploreCategory ? getCategory(store.exploreCategory) : null)
    if (category) void runCategory(category)
  }, [runCategory])

  const selectPoi = useCallback((place: Place) => {
    const store = useAppStore.getState()
    store.selectPlace(place)
    const map = getMapInstance()
    if (map) {
      map.flyTo({
        center: [place.coords.lng, place.coords.lat],
        zoom: Math.max(map.getZoom(), 16),
        duration: store.prefs.reduceMotion ? 0 : 800,
      })
    }
    if (window.matchMedia('(max-width: 860px)').matches) store.setMobileSheetOpen(false)
  }, [])

  return {
    runCategory,
    refresh,
    retry: refresh,
    selectPoi,
    radiusM: EXPLORE_RADIUS_M,
  }
}
