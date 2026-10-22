import { appConfig, type ProviderDef } from '../../app/config'
import type {
  LngLat,
  RouteEndpoint,
  RouteLeg,
  RouteNote,
  RoutePlan,
  RouteStep,
  TravelMode,
} from '../../types/domain'
import { isValidLngLat } from '../../utils/geo'
import { uid } from '../../utils/id'
import { describeHttpError, fetchJson, HttpError } from '../http'

/* ═══════════════════════════════════════════════════════════════
   Rutas con OSRM.
   Solo se muestra lo que el proveedor devuelve: distancia, duración,
   geometría, piernas y pasos. No se inventan perfiles ni tráfico.
   ═══════════════════════════════════════════════════════════════ */

export class RoutingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RoutingError'
  }
}

export interface RouteRequest {
  endpoints: RouteEndpoint[]
  mode: TravelMode
  signal?: AbortSignal
}

export interface OsrmManeuver {
  type?: string
  modifier?: string
  exit?: number
  location?: [number, number]
}

export interface OsrmStep {
  distance?: number
  duration?: number
  name?: string
  ref?: string
  maneuver?: OsrmManeuver
}

export interface OsrmLeg {
  distance?: number
  duration?: number
  steps?: OsrmStep[]
}

export interface OsrmRoute {
  distance?: number
  duration?: number
  geometry?: { type?: string; coordinates?: unknown }
  legs?: OsrmLeg[]
}

export interface OsrmResponse {
  code?: string
  message?: string
  routes?: OsrmRoute[]
}

type ResolvedEndpoint = RouteEndpoint & { coords: LngLat }

const ROUTE_TIMEOUT_MS = 15000

/** Proveedor de rutas para el modo, o null si no hay uno configurado. */
export function routingProviderFor(mode: TravelMode): ProviderDef | null {
  if (mode === 'transit') return null
  return appConfig.routing[mode]
}

function coordsParam(points: LngLat[]): string {
  return points.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(';')
}

/** Petición de rutas con alternativas. Las coordenadas van en el orden indicado. */
export async function fetchRoutes(req: RouteRequest): Promise<RoutePlan[]> {
  const provider = routingProviderFor(req.mode)
  if (!provider) {
    throw new RoutingError('No hay un proveedor de rutas configurado para este modo de transporte.')
  }
  if (req.endpoints.length < 2) {
    throw new RoutingError('Necesitas al menos un origen y un destino para calcular la ruta.')
  }

  const endpoints: ResolvedEndpoint[] = []
  for (const endpoint of req.endpoints) {
    if (!endpoint.coords || !isValidLngLat(endpoint.coords)) {
      throw new RoutingError('Falta la ubicación de un origen, destino o parada. Vuelve a elegirla.')
    }
    endpoints.push({ ...endpoint, coords: endpoint.coords })
  }

  const base = provider.url.replace(/\/+$/, '')
  const url = `${base}/route/v1/${req.mode}/${coordsParam(endpoints.map((e) => e.coords))}?overview=full&geometries=geojson&steps=true&alternatives=true`

  const raw = await fetchJson<OsrmResponse>(url, {
    signal: req.signal,
    timeoutMs: ROUTE_TIMEOUT_MS,
    headers: { Accept: 'application/json' },
  })

  return parseOsrmResponse(raw, {
    stops: endpoints,
    mode: req.mode,
    isDemo: provider.isDemo,
  })
}

/** Traduce una respuesta OSRM a planes de ATLAS. Exportada para pruebas y futuros proveedores. */
export function parseOsrmResponse(
  raw: OsrmResponse,
  opts: { stops: ResolvedEndpoint[]; mode: TravelMode; isDemo: boolean },
): RoutePlan[] {
  if (raw.code !== 'Ok') {
    throw new RoutingError(messageForCode(raw.code, raw.message))
  }
  const rawRoutes = raw.routes ?? []
  if (rawRoutes.length === 0) {
    throw new RoutingError('OSRM no devolvió ninguna ruta para esos puntos.')
  }

  const plans: RoutePlan[] = []
  rawRoutes.forEach((route) => {
    const plan = normalizeRoute(route, opts)
    if (plan) plans.push(plan)
  })

  if (plans.length === 0) {
    throw new RoutingError('OSRM respondió sin una geometría de ruta válida. Prueba otros puntos.')
  }
  return plans
}

function normalizeRoute(
  route: OsrmRoute,
  opts: { stops: ResolvedEndpoint[]; mode: TravelMode; isDemo: boolean },
): RoutePlan | null {
  const geometry = validCoordinates(route.geometry?.coordinates)
  if (!geometry) return null

  const legs: RouteLeg[] = []
  const rawLegs = route.legs ?? []
  rawLegs.forEach((leg, legIndex) => {
    const steps = normalizeSteps(leg.steps ?? [], legIndex === rawLegs.length - 1)
    const distance = finiteNonNegative(leg.distance) ?? sum(steps, (s) => s.distanceM)
    const duration = finiteNonNegative(leg.duration) ?? sum(steps, (s) => s.durationS ?? 0)
    legs.push({ distanceM: distance, durationS: duration, steps })
  })

  const distance = finiteNonNegative(route.distance) ?? sum(legs, (l) => l.distanceM)
  const duration = finiteNonNegative(route.duration) ?? sum(legs, (l) => l.durationS)
  if (distance === 0 && duration === 0 && geometry.length < 2) return null

  return {
    id: uid('route'),
    mode: opts.mode,
    preference: 'fast',
    distanceM: distance,
    durationS: duration,
    geometry,
    legs,
    notes: notesFor(opts),
    provider: 'OSRM',
    providerIsDemo: opts.isDemo,
    stops: opts.stops.map((stop) => ({ ...stop, coords: { ...stop.coords } })),
  }
}

function normalizeSteps(rawSteps: OsrmStep[], isFinalLeg: boolean): RouteStep[] {
  const steps: RouteStep[] = []
  rawSteps.forEach((raw) => {
    const type = raw.maneuver?.type ?? ''
    const instruction = spanishInstruction(raw, isFinalLeg)
    if (!instruction) return
    const distanceM = finiteNonNegative(raw.distance) ?? 0
    const durationS = finiteNonNegative(raw.duration)
    steps.push({
      instruction,
      distanceM,
      ...(durationS !== undefined ? { durationS } : {}),
      ...(raw.name?.trim() ? { name: raw.name.trim() } : {}),
      ...(type ? { maneuver: type } : {}),
    })
  })
  return steps
}

/** Instrucción legible en español a partir de los pasos de OSRM. */
export function spanishInstruction(step: OsrmStep, isFinalLeg = true): string {
  const type = step.maneuver?.type ?? ''
  const modifier = step.maneuver?.modifier ?? ''
  const road = (step.name?.trim() || step.ref?.trim() || '').trim()
  const byRoad = road ? ` por ${road}` : ''
  const towards = road ? ` hacia ${road}` : ''
  const direction = directionFor(modifier)

  switch (type) {
    case 'depart':
      return road ? `Sal por ${road}` : 'Empieza la ruta'
    case 'arrive':
      return isFinalLeg ? 'Llegada al destino' : 'Llegada a la parada'
    case 'turn':
      if (modifier === 'uturn') return 'Haz un cambio de sentido'
      if (modifier === 'straight') return road ? `Continúa recto por ${road}` : 'Continúa recto'
      return `Gira ${direction}${byRoad}`
    case 'new name':
    case 'continue':
      return road ? `Continúa por ${road}` : 'Continúa'
    case 'merge':
      return road ? `Incorpórate a ${road}` : 'Incorpórate a la vía'
    case 'fork':
      return `En la bifurcación, mantente ${direction}${byRoad}`
    case 'end of road':
      return `Al final de la vía, gira ${direction}${byRoad}`
    case 'roundabout':
    case 'rotary':
    case 'roundabout turn': {
      const exit = step.maneuver?.exit
      const exitText = typeof exit === 'number' && exit > 0 ? ` y sal por la salida ${exit}` : ''
      return `Toma la rotonda${exitText}${towards}`
    }
    case 'exit roundabout':
    case 'exit rotary':
      return road ? `Sal de la rotonda hacia ${road}` : 'Sal de la rotonda'
    case 'on ramp':
      return `Toma la incorporación${towards}`
    case 'off ramp':
      return `Toma la salida${towards}`
    case 'use lane':
      return 'Mantente en el carril indicado'
    case 'notification':
      return road ? `Continúa por ${road}` : 'Sigue las indicaciones'
    default:
      return road ? `Continúa por ${road}` : 'Sigue las indicaciones'
  }
}

function directionFor(modifier: string): string {
  switch (modifier) {
    case 'uturn':
      return 'en U'
    case 'sharp left':
    case 'left':
      return 'a la izquierda'
    case 'slight left':
      return 'ligeramente a la izquierda'
    case 'straight':
      return 'recto'
    case 'slight right':
      return 'ligeramente a la derecha'
    case 'sharp right':
    case 'right':
      return 'a la derecha'
    default:
      return 'en la dirección indicada'
  }
}

function notesFor(opts: { mode: TravelMode; isDemo: boolean }): RouteNote[] {
  const notes: RouteNote[] = [
    {
      kind: 'unknown',
      text: 'Los tiempos son estimaciones del proveedor a partir de OpenStreetMap; no incluyen tráfico en directo.',
    },
    {
      kind: 'info',
      text: 'Los puntos de origen, destino y paradas se ajustan a la vía más cercana de la red del proveedor.',
    },
  ]
  if (opts.isDemo) {
    notes.unshift({
      kind: 'warn',
      text: 'OSRM público de demostración: sin SLA, sin tráfico en directo y con límites de uso.',
    })
  }
  notes.push({
    kind: 'unknown',
    text: 'No hay datos de accesibilidad, pendientes, paisaje ni calma viaria: solo se calcula la ruta más rápida.',
  })
  return notes
}

function messageForCode(code: string | undefined, detail: string | undefined): string {
  switch (code) {
    case 'NoRoute':
      return 'OSRM no encuentra una ruta viable con esos puntos y ese modo. Prueba a cambiar el origen, el destino o el modo.'
    case 'NoSegment':
      return 'Alguno de los puntos no está cerca de una vía transitable para este modo. Elige otro punto.'
    case 'InvalidQuery':
      return 'OSRM rechazó la solicitud. Revisa los puntos e inténtalo de nuevo.'
    case 'TooBig':
      return 'La ruta es demasiado grande para el servicio. Reduce la distancia o el número de paradas.'
    default: {
      const suffix = detail?.trim() ? ` (${detail.trim()})` : ''
      return `OSRM no pudo calcular la ruta${code ? ` ${code}` : ''}${suffix}. Inténtalo de nuevo.`
    }
  }
}

function validCoordinates(input: unknown): [number, number][] | null {
  if (!Array.isArray(input)) return null
  const coords: [number, number][] = []
  for (const item of input) {
    if (!Array.isArray(item) || item.length < 2) continue
    const lng = item[0]
    const lat = item[1]
    if (typeof lng !== 'number' || typeof lat !== 'number') continue
    if (!isValidLngLat({ lng, lat })) continue
    coords.push([lng, lat])
  }
  return coords.length >= 2 ? coords : null
}

function finiteNonNegative(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined
}

function sum<T>(items: T[], get: (item: T) => number): number {
  return items.reduce((total, item) => total + get(item), 0)
}

/** Convierte cualquier fallo de rutas en un mensaje apto para la interfaz. */
export function describeRoutingError(error: unknown): string {
  if (error instanceof RoutingError) return error.message
  if (error instanceof HttpError && error.kind === 'aborted') return 'Petición cancelada.'
  return describeHttpError(error)
}
