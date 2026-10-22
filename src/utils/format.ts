import type { LngLat } from '../types/domain'

const nf1 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 })
const nf0 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 })

const M_PER_MI = 1609.344
const M_PER_FT = 0.3048

/** Formatea una distancia en el sistema de unidades elegido. */
export function formatDistance(meters: number, units: 'metric' | 'imperial' = 'metric'): string {
  if (!Number.isFinite(meters) || meters < 0) return '—'
  if (units === 'imperial') {
    const miles = meters / M_PER_MI
    if (miles < 0.15) return `${nf0.format(meters / M_PER_FT)} ft`
    return `${nf1.format(miles)} mi`
  }
  if (meters < 950) return `${nf0.format(meters)} m`
  return `${nf1.format(meters / 1000)} km`
}

/** Formatea una duración en segundos: "18 min", "1 h 4 min". */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '—'
  const totalMin = Math.round(seconds / 60)
  if (totalMin < 1) return '< 1 min'
  if (totalMin < 60) return `${totalMin} min`
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

/** "40.41678, -3.70379" */
export function formatCoords(p: LngLat): string {
  return `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`
}

export function formatNumber(n: number, digits = 0): string {
  return new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n)
}

/** Fecha corta local, p. ej. "21 oct 2026". */
export function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(ts),
  )
}

/** Distancia relativa simple ("hace 3 días"). */
export function formatRelative(ts: number, now = Date.now()): string {
  const diffS = Math.max(0, (now - ts) / 1000)
  if (diffS < 60) return 'ahora mismo'
  const min = Math.floor(diffS / 60)
  if (min < 60) return min === 1 ? 'hace 1 min' : `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return h === 1 ? 'hace 1 hora' : `hace ${h} horas`
  const d = Math.floor(h / 24)
  if (d < 30) return d === 1 ? 'hace 1 día' : `hace ${d} días`
  return formatDate(ts)
}
