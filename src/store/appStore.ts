import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  LngLat,
  MapViewport,
  Place,
  PlaceCategoryId,
  RouteEndpoint,
  RoutePlan,
  RoutePreference,
  SavedCollection,
  SavedPlace,
  SearchResult,
  TravelMode,
  UserPreferences,
} from '../types/domain'
import { appConfig } from '../app/config'
import { uid } from '../utils/id'
import {
  DEFAULT_COLLECTIONS,
  defaultPreferences,
  makeCollection,
  sanitizeCollections,
  sanitizePreferences,
  sanitizeStringArray,
} from './persist'

/* ═══════════════════════════════════════════════════════════════
   Estado global (zustand).
   - prefs + colecciones + búsquedas recientes → persisten en localStorage.
   - El resto vive en memoria de sesión.
   Las llamadas a proveedores viven en hooks de cada feature; aquí solo
   se guarda el estado resultante.
   ═══════════════════════════════════════════════════════════════ */

export type PanelTab = 'search' | 'route' | 'explore' | 'saved'

/** Punto de ruta que se está eligiendo sobre el mapa. */
export type RoutePickTarget = 'origin' | 'destination' | 'waypoint'
export type LoadStatus = 'idle' | 'loading' | 'done' | 'error'
export type LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'error'

export interface Notice {
  id: string
  kind: 'info' | 'success' | 'warn' | 'error'
  title: string
  detail?: string
}

interface AppState {
  /* ── Interfaz ── */
  activeTab: PanelTab
  sideCollapsed: boolean
  mobileSheetOpen: boolean
  settingsOpen: boolean
  basemapId: 'dark' | 'light'
  setActiveTab: (tab: PanelTab) => void
  toggleSideCollapsed: () => void
  setMobileSheetOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setBasemapId: (id: 'dark' | 'light') => void

  /* ── Avisos no bloqueantes ── */
  notices: Notice[]
  pushNotice: (notice: Omit<Notice, 'id'>) => string
  dismissNotice: (id: string) => void

  /* ── Preferencias (persistidas) ── */
  prefs: UserPreferences
  updatePrefs: (patch: Partial<UserPreferences>) => void

  /* ── Mapa ── */
  viewport: MapViewport
  setViewport: (v: MapViewport) => void
  userLocation: LngLat | null
  locationStatus: LocationStatus
  setLocationStatus: (s: LocationStatus) => void
  setUserLocation: (p: LngLat | null) => void

  /* ── Búsqueda ── */
  searchQuery: string
  searchStatus: LoadStatus
  searchResults: SearchResult[]
  searchError: string | null
  /** true cuando los resultados provienen de Overpass (categoría), no de Nominatim. */
  searchFromCategory: boolean
  recentSearches: string[]
  setSearchQuery: (q: string) => void
  setSearchResults: (r: SearchResult[], fromCategory?: boolean) => void
  setSearchStatus: (s: LoadStatus) => void
  setSearchError: (msg: string | null) => void
  setSearchFromCategory: (v: boolean) => void
  clearSearch: () => void
  addRecentSearch: (q: string) => void
  clearRecentSearches: () => void

  /* ── Lugar seleccionado ── */
  selectedPlace: Place | null
  selectPlace: (p: Place | null) => void

  /* ── Rutas ── */
  routeOrigin: RouteEndpoint | null
  routeDestination: RouteEndpoint | null
  routeWaypoints: RouteEndpoint[]
  travelMode: TravelMode
  routePreference: RoutePreference
  routeStatus: LoadStatus
  routeError: string | null
  routePlan: RoutePlan | null
  routeAlternatives: RoutePlan[]
  routePickTarget: RoutePickTarget | null
  setRouteOrigin: (e: RouteEndpoint | null) => void
  setRouteDestination: (e: RouteEndpoint | null) => void
  swapRouteEndpoints: () => void
  addRouteWaypoint: (e: RouteEndpoint) => void
  removeRouteWaypoint: (id: string) => void
  moveRouteWaypoint: (from: number, to: number) => void
  setRoutePickTarget: (target: RoutePickTarget | null) => void
  setTravelMode: (m: TravelMode) => void
  setRoutePreference: (p: RoutePreference) => void
  setRouteStatus: (s: LoadStatus) => void
  setRouteError: (msg: string | null) => void
  setRouteResult: (plan: RoutePlan | null, alternatives?: RoutePlan[]) => void
  clearRoutePlan: () => void
  resetRoute: () => void

  /* ── Explorar ── */
  exploreCategory: PlaceCategoryId | null
  exploreStatus: LoadStatus
  explorePois: Place[]
  exploreError: string | null
  exploreAnchor: { center: LngLat; zoom: number } | null
  setExploreCategory: (c: PlaceCategoryId | null) => void
  setExploreStatus: (s: LoadStatus) => void
  setExploreResult: (pois: Place[], anchor: { center: LngLat; zoom: number }) => void
  setExploreError: (msg: string | null) => void

  /* ── Guardados (persistidos) ── */
  collections: SavedCollection[]
  collectionsSeedDone: boolean
  seedCollectionsOnce: () => void
  createCollection: (name: string) => string
  renameCollection: (id: string, name: string) => void
  deleteCollection: (id: string) => void
  toggleSavePlace: (place: Place, collectionId?: string) => void
  addPlaceToCollection: (collectionId: string, place: Place) => void
  removePlaceFromCollection: (collectionId: string, placeId: string) => void
}

function toSavedPlace(place: Place): SavedPlace {
  return {
    id: place.id,
    name: place.name,
    category: place.category,
    coords: place.coords,
    ...(place.address ? { address: place.address } : {}),
    addedAt: Date.now(),
  }
}

export function isPlaceSaved(collections: SavedCollection[], placeId: string): boolean {
  return collections.some((c) => c.places.some((p) => p.id === placeId))
}

export function findCollectionOfPlace(
  collections: SavedCollection[],
  placeId: string,
): SavedCollection | null {
  return collections.find((c) => c.places.some((p) => p.id === placeId)) ?? null
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      /* ── Interfaz ── */
      activeTab: 'search',
      sideCollapsed: false,
      mobileSheetOpen: false,
      settingsOpen: false,
      basemapId: 'dark',
      setActiveTab: (tab) =>
        set((s) => ({
          activeTab: tab,
          mobileSheetOpen: false,
          ...(tab !== 'route' && s.routePickTarget ? { routePickTarget: null } : {}),
        })),
      toggleSideCollapsed: () => set((s) => ({ sideCollapsed: !s.sideCollapsed })),
      setMobileSheetOpen: (open) => set({ mobileSheetOpen: open }),
      setSettingsOpen: (open) => set({ settingsOpen: open }),
      setBasemapId: (id) => set({ basemapId: id }),

      /* ── Avisos ── */
      notices: [],
      pushNotice: (notice) => {
        const id = uid('notice')
        set((s) => ({ notices: [...s.notices.slice(-3), { ...notice, id }] }))
        return id
      },
      dismissNotice: (id) => set((s) => ({ notices: s.notices.filter((n) => n.id !== id) })),

      /* ── Preferencias ── */
      prefs: { ...defaultPreferences },
      updatePrefs: (patch) => set((s) => ({ prefs: { ...s.prefs, ...patch } })),

      /* ── Mapa ── */
      viewport: {
        center: { ...appConfig.defaultViewport.center },
        zoom: appConfig.defaultViewport.zoom,
        bearing: 0,
        pitch: 0,
      },
      setViewport: (v) => set({ viewport: v }),
      userLocation: null,
      locationStatus: 'idle',
      setLocationStatus: (s) => set({ locationStatus: s }),
      setUserLocation: (p) => set({ userLocation: p }),

      /* ── Búsqueda ── */
      searchQuery: '',
      searchStatus: 'idle',
      searchResults: [],
      searchError: null,
      searchFromCategory: false,
      recentSearches: [],
      setSearchQuery: (q) => set({ searchQuery: q }),
      setSearchResults: (r, fromCategory = false) =>
        set({ searchResults: r, searchStatus: 'done', searchError: null, searchFromCategory: fromCategory }),
      setSearchStatus: (s) => set({ searchStatus: s }),
      setSearchError: (msg) => set({ searchError: msg, searchStatus: msg ? 'error' : 'idle' }),
      setSearchFromCategory: (v) => set({ searchFromCategory: v }),
      clearSearch: () =>
        set({ searchQuery: '', searchResults: [], searchStatus: 'idle', searchError: null, searchFromCategory: false }),
      addRecentSearch: (q) => {
        const clean = q.trim()
        if (clean.length < 3) return
        set((s) => ({
          recentSearches: [clean, ...s.recentSearches.filter((x) => x !== clean)].slice(0, 8),
        }))
      },
      clearRecentSearches: () => set({ recentSearches: [] }),

      /* ── Lugar seleccionado ── */
      selectedPlace: null,
      selectPlace: (p) => set({ selectedPlace: p }),

      /* ── Rutas ── */
      routeOrigin: null,
      routeDestination: null,
      routeWaypoints: [],
      travelMode: 'driving',
      routePreference: 'fast',
      routeStatus: 'idle',
      routeError: null,
      routePlan: null,
      routeAlternatives: [],
      routePickTarget: null,
      setRouteOrigin: (e) => set({ routeOrigin: e }),
      setRouteDestination: (e) => set({ routeDestination: e }),
      swapRouteEndpoints: () =>
        set((s) => ({
          routeOrigin: s.routeDestination,
          routeDestination: s.routeOrigin,
        })),
      addRouteWaypoint: (e) =>
        set((s) => (s.routeWaypoints.length >= 4 ? s : { routeWaypoints: [...s.routeWaypoints, e] })),
      removeRouteWaypoint: (id) =>
        set((s) => ({ routeWaypoints: s.routeWaypoints.filter((w) => w.id !== id) })),
      moveRouteWaypoint: (from, to) =>
        set((s) => {
          const list = [...s.routeWaypoints]
          if (from < 0 || to < 0 || from >= list.length || to >= list.length) return s
          const [moved] = list.splice(from, 1)
          if (!moved) return s
          list.splice(to, 0, moved)
          return { routeWaypoints: list }
        }),
      setRoutePickTarget: (target) => set({ routePickTarget: target }),
      setTravelMode: (m) => set({ travelMode: m, routePlan: null, routeAlternatives: [], routeStatus: 'idle', routeError: null }),
      setRoutePreference: (p) => set({ routePreference: p }),
      setRouteStatus: (s) => set({ routeStatus: s }),
      setRouteError: (msg) => set({ routeError: msg, routeStatus: msg ? 'error' : 'idle' }),
      setRouteResult: (plan, alternatives = []) =>
        set({ routePlan: plan, routeAlternatives: alternatives, routeStatus: plan ? 'done' : 'idle', routeError: null }),
      clearRoutePlan: () =>
        set({ routePlan: null, routeAlternatives: [], routeStatus: 'idle', routeError: null }),
      resetRoute: () =>
        set({
          routeOrigin: null,
          routeDestination: null,
          routeWaypoints: [],
          routePlan: null,
          routeAlternatives: [],
          routeStatus: 'idle',
          routeError: null,
          routePickTarget: null,
        }),

      /* ── Explorar ── */
      exploreCategory: null,
      exploreStatus: 'idle',
      explorePois: [],
      exploreError: null,
      exploreAnchor: null,
      setExploreCategory: (c) => set({ exploreCategory: c }),
      setExploreStatus: (s) => set({ exploreStatus: s }),
      setExploreResult: (pois, anchor) =>
        set({ explorePois: pois, exploreAnchor: anchor, exploreStatus: 'done', exploreError: null }),
      setExploreError: (msg) => set({ exploreError: msg, exploreStatus: msg ? 'error' : 'idle' }),

      /* ── Guardados ── */
      collections: [],
      collectionsSeedDone: false,
      seedCollectionsOnce: () => {
        const { collectionsSeedDone, collections, createCollection } = get()
        if (collectionsSeedDone) return
        if (collections.length === 0) {
          for (const name of DEFAULT_COLLECTIONS) createCollection(name)
        }
        set({ collectionsSeedDone: true })
      },
      createCollection: (name) => {
        const col = makeCollection(name)
        set((s) => ({ collections: [...s.collections, col] }))
        return col.id
      },
      renameCollection: (id, name) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === id ? { ...c, name: name.trim() || c.name, updatedAt: Date.now() } : c,
          ),
        })),
      deleteCollection: (id) =>
        set((s) => ({ collections: s.collections.filter((c) => c.id !== id) })),
      toggleSavePlace: (place, collectionId) => {
        const s = get()
        const current = findCollectionOfPlace(s.collections, place.id)
        if (current) {
          s.removePlaceFromCollection(current.id, place.id)
          s.pushNotice({ kind: 'info', title: 'Eliminado de guardados', detail: place.name })
          return
        }
        let targetId = collectionId ?? s.collections[0]?.id
        if (!targetId) targetId = s.createCollection('Sitios pendientes')
        s.addPlaceToCollection(targetId, place)
        const name = get().collections.find((c) => c.id === targetId)?.name ?? 'Guardados'
        s.pushNotice({ kind: 'success', title: `Guardado en «${name}»`, detail: place.name })
      },
      addPlaceToCollection: (collectionId, place) =>
        set((s) => ({
          collections: s.collections.map((c) => {
            if (c.id !== collectionId) return c
            if (c.places.some((p) => p.id === place.id)) return c
            return { ...c, places: [toSavedPlace(place), ...c.places], updatedAt: Date.now() }
          }),
        })),
      removePlaceFromCollection: (collectionId, placeId) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === collectionId
              ? { ...c, places: c.places.filter((p) => p.id !== placeId), updatedAt: Date.now() }
              : c,
          ),
        })),
    }),
    {
      name: 'atlas.v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        prefs: s.prefs,
        collections: s.collections,
        collectionsSeedDone: s.collectionsSeedDone,
        recentSearches: s.recentSearches,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Record<string, unknown>
        return {
          ...current,
          prefs: sanitizePreferences(p.prefs),
          collections: sanitizeCollections(p.collections),
          collectionsSeedDone: p.collectionsSeedDone === true,
          recentSearches: sanitizeStringArray(p.recentSearches),
        }
      },
    },
  ),
)
