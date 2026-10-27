import { useCallback, useEffect, useRef } from 'react'
import { appConfig } from '../../app/config'
import { geocoder } from '../../services/geocoding'
import { HttpError, describeHttpError } from '../../services/http'
import { searchPlacesAround } from '../../services/pois/overpass'
import { useAppStore } from '../../store/appStore'
import type { Place, PlaceCategory, SearchResult } from '../../types/domain'
import { haversineDistanceM } from '../../utils/geo'
import { isAbortError } from '../../utils/async'
import { detectCategory } from '../explore/categories'
import { getMapInstance } from '../map/mapInstance'

function sortByDistance(places: Place[], center: { lng: number; lat: number }): Place[] {
  return [...places].sort(
    (a, b) => haversineDistanceM(center, a.coords) - haversineDistanceM(center, b.coords),
  )
}

function isAborted(e: unknown): boolean {
  return isAbortError(e) || (e instanceof HttpError && e.kind === 'aborted')
}

/** Orquesta búsquedas: geocoding real o categoría vía Overpass, con cancelación. */
export function useSearchController() {
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const runSearch = useCallback(async (rawTerm?: string, forcedCategory?: PlaceCategory | null) => {
    const store = useAppStore.getState()
    const term = (rawTerm ?? store.searchQuery).trim()
    if (term.length < 3) {
      store.setSearchStatus('idle')
      return
    }

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    store.setSearchQuery(term)
    store.setSearchStatus('loading')
    store.setSearchError(null)

    const category = forcedCategory ?? detectCategory(term)
    store.setSearchFromCategory(Boolean(category))

    try {
      if (category) {
        /* Categoría → POI reales alrededor del centro del mapa (Overpass). */
        const center = useAppStore.getState().viewport.center
        const places = await searchPlacesAround({
          baseUrl: appConfig.pois.url,
          category,
          center,
          radiusM: useAppStore.getState().prefs.poiRadiusM,
          limit: 50,
          signal: ctrl.signal,
        })
        if (ctrl.signal.aborted) return
        const sorted = sortByDistance(places, center)
        const results: SearchResult[] = sorted.map((place) => ({
          id: place.id,
          place,
          distanceM: haversineDistanceM(center, place.coords),
        }))
        store.setSearchResults(results, true)
        store.addRecentSearch(term)
      } else {
        /* Texto libre → geocoder configurado (Nominatim o Photon). */
        const places = await geocoder.search(term, {
          signal: ctrl.signal,
          limit: 8,
          near: useAppStore.getState().userLocation ?? undefined,
        })
        if (ctrl.signal.aborted) return
        const userLocation = useAppStore.getState().userLocation
        const results: SearchResult[] = places.map((place) => ({
          id: place.id,
          place,
          ...(userLocation ? { distanceM: haversineDistanceM(userLocation, place.coords) } : {}),
        }))
        store.setSearchResults(results, false)
        store.addRecentSearch(term)
      }
    } catch (e) {
      if (isAborted(e)) return
      store.setSearchError(describeHttpError(e))
    }
  }, [])

  const selectResult = useCallback((result: SearchResult) => {
    const store = useAppStore.getState()
    store.selectPlace(result.place)
    store.addRecentSearch(store.searchQuery || result.place.name)

    const map = getMapInstance()
    if (map) {
      map.flyTo({
        center: [result.place.coords.lng, result.place.coords.lat],
        zoom: Math.max(map.getZoom(), 15),
        duration: 950,
      })
    }
    if (window.matchMedia('(max-width: 860px)').matches) {
      store.setMobileSheetOpen(false)
    }
  }, [])

  const retry = useCallback(() => {
    void runSearch()
  }, [runSearch])

  return {
    runSearch,
    selectResult,
    retry,
    supportsSuggestions: geocoder.supportsSuggestions,
    providerLabel: geocoder.id === 'photon' ? 'Photon' : 'Nominatim',
    providerIsDemo: geocoder.isDemo,
  }
}
