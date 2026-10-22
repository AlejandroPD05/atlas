import type { Bounds, LngLat } from '../types/domain'

const EARTH_RADIUS_M = 6371008.8

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Distancia geodésica (haversine) en metros. */
export function haversineDistanceM(a: LngLat, b: LngLat): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Valida que un punto sea finito y esté dentro del rango terrestre. */
export function isValidLngLat(p: unknown): p is LngLat {
  if (typeof p !== 'object' || p === null) return false
  const { lng, lat } = p as Record<string, unknown>
  return (
    typeof lng === 'number' &&
    typeof lat === 'number' &&
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  )
}

/** Bounding box de una lista de coordenadas. Devuelve null si no hay puntos válidos. */
export function boundsOf(coords: LngLat[]): Bounds | null {
  const valid = coords.filter(isValidLngLat)
  if (valid.length === 0) return null
  let west = valid[0]!.lng
  let east = valid[0]!.lng
  let south = valid[0]!.lat
  let north = valid[0]!.lat
  for (const c of valid) {
    west = Math.min(west, c.lng)
    east = Math.max(east, c.lng)
    south = Math.min(south, c.lat)
    north = Math.max(north, c.lat)
  }
  return { west, south, east, north }
}

/** Expande un bounds por un ratio (para padding visual en fitBounds). */
export function padBounds(b: Bounds, ratio: number): Bounds {
  const dLng = Math.max((b.east - b.west) * ratio, 0.004)
  const dLat = Math.max((b.north - b.south) * ratio, 0.004)
  return {
    west: b.west - dLng,
    east: b.east + dLng,
    south: b.south - dLat,
    north: b.north + dLat,
  }
}

/* Proyección local equirectangular a metros (precisa a escalas urbanas). */
function toLocalXY(p: LngLat, refLat: number): { x: number; y: number } {
  const k = Math.cos(toRad(refLat))
  return { x: p.lng * k * 111320, y: p.lat * 110540 }
}

/** Distancia en metros de un punto al segmento [a, b]. */
export function pointToSegmentDistanceM(p: LngLat, a: LngLat, b: LngLat): number {
  const refLat = (a.lat + b.lat + p.lat) / 3
  const P = toLocalXY(p, refLat)
  const A = toLocalXY(a, refLat)
  const B = toLocalXY(b, refLat)
  const abx = B.x - A.x
  const aby = B.y - A.y
  const lenSq = abx * abx + aby * aby
  if (lenSq === 0) return Math.hypot(P.x - A.x, P.y - A.y)
  let t = ((P.x - A.x) * abx + (P.y - A.y) * aby) / lenSq
  t = Math.max(0, Math.min(1, t))
  const cx = A.x + t * abx
  const cy = A.y + t * aby
  return Math.hypot(P.x - cx, P.y - cy)
}

/** Distancia mínima de un punto a una polilínea (tolerante a líneas largas). */
export function pointToPolylineDistanceM(p: LngLat, line: LngLat[]): number {
  if (line.length === 0) return Number.POSITIVE_INFINITY
  if (line.length === 1) return haversineDistanceM(p, line[0]!)
  let min = Number.POSITIVE_INFINITY
  for (let i = 0; i < line.length - 1; i += 1) {
    const d = pointToSegmentDistanceM(p, line[i]!, line[i + 1]!)
    if (d < min) min = d
  }
  return min
}

/** Comprueba si un punto cae dentro de un bounds. */
export function boundsContain(b: Bounds, p: LngLat): boolean {
  return p.lng >= b.west && p.lng <= b.east && p.lat >= b.south && p.lat <= b.north
}
