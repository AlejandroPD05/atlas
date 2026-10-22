import { useCallback, useEffect, useRef, useState } from 'react'
import { describeRoutingError, fetchRoutes } from '../../services/routing/osrm'
import { useAppStore } from '../../store/appStore'
import type { RouteEndpoint, RoutePlan, TravelMode } from '../../types/domain'
import { isAbortError } from '../../utils/async'

/* Petición de ruta ligada al estado del planificador. Solo se lanza cuando
   hay origen, destino y todas las paradas con coordenadas. */

export interface RoutePlannerController {
  /** Reintenta la última petición (por ejemplo tras un timeout). */
  retry: () => void
}

function sameCoords(a: RouteEndpoint, b: RouteEndpoint): boolean {
  const ca = a.coords
  const cb = b.coords
  if (!ca || !cb) return false
  return Math.abs(ca.lng - cb.lng) < 1e-7 && Math.abs(ca.lat - cb.lat) < 1e-7
}

function planMatches(plan: RoutePlan, stops: RouteEndpoint[], mode: TravelMode): boolean {
  if (plan.mode !== mode || plan.stops.length !== stops.length) return false
  return stops.every((stop, index) => {
    const planned = plan.stops[index]
    return planned ? sameCoords(stop, planned) : false
  })
}

export function useRoutePlanner(): RoutePlannerController {
  const origin = useAppStore((s) => s.routeOrigin)
  const destination = useAppStore((s) => s.routeDestination)
  const waypoints = useAppStore((s) => s.routeWaypoints)
  const travelMode = useAppStore((s) => s.travelMode)
  const [attempt, setAttempt] = useState(0)
  const lastAttemptRef = useRef(attempt)

  useEffect(() => {
    const store = useAppStore.getState()
    const forced = attempt !== lastAttemptRef.current
    lastAttemptRef.current = attempt

    const complete =
      origin?.coords !== undefined &&
      destination?.coords !== undefined &&
      waypoints.every((w) => w.coords !== undefined)

    if (!complete || !origin || !destination) {
      if (store.routePlan || store.routeStatus !== 'idle' || store.routeError) {
        store.clearRoutePlan()
      }
      return
    }

    const stops = [origin, ...waypoints, destination]
    if (!forced && store.routePlan && planMatches(store.routePlan, stops, travelMode)) {
      return
    }

    const controller = new AbortController()
    store.clearRoutePlan()
    store.setRouteStatus('loading')

    void (async () => {
      try {
        const plans = await fetchRoutes({ endpoints: stops, mode: travelMode, signal: controller.signal })
        if (controller.signal.aborted) return
        const [primary, ...alternatives] = plans
        if (!primary) {
          store.setRouteError('El proveedor no devolvió ninguna ruta. Prueba otros puntos.')
          return
        }
        store.setRouteResult(primary, alternatives)
      } catch (error) {
        if (controller.signal.aborted || isAbortError(error)) return
        store.setRouteError(describeRoutingError(error))
      }
    })()

    return () => {
      controller.abort()
    }
  }, [origin, destination, waypoints, travelMode, attempt])

  const retry = useCallback(() => setAttempt((value) => value + 1), [])
  return { retry }
}
