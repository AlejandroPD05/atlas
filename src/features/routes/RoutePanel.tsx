import { useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Bike,
  BusFront,
  Car,
  Check,
  CircleHelp,
  Clock3,
  Crosshair,
  Download,
  Footprints,
  Info,
  LocateFixed,
  MapPin,
  RefreshCw,
  Route as RouteIcon,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react'
import { availableModes } from '../../app/config'
import { Button, Chip, Eyebrow, IconButton, Spinner } from '../../components/ui'
import { useGeolocation } from '../../hooks/useGeolocation'
import { useAppStore } from '../../store/appStore'
import type { RouteEndpoint, RouteNote, RoutePlan, RoutePreference, TravelMode } from '../../types/domain'
import { cn } from '../../utils/cn'
import { downloadTextFile } from '../../utils/download'
import { formatCoords, formatDistance, formatDuration } from '../../utils/format'
import { uid } from '../../utils/id'
import { getMapInstance } from '../map/mapInstance'
import {
  routeExportFileName,
  routeToGeoJson,
  routeToGpx,
  type RouteExportFormat,
} from './exportRoute'
import { useRoutePlanner } from './useRoutePlanner'
import styles from './RoutePanel.module.css'

const MAX_STOPS = 4

const MODE_META: Record<TravelMode, { label: string; icon: typeof Car }> = {
  driving: { label: 'Coche', icon: Car },
  walking: { label: 'A pie', icon: Footprints },
  cycling: { label: 'Bici', icon: Bike },
  transit: { label: 'Público', icon: BusFront },
}

const MODE_OPTIONS = availableModes()

const PROFILES: ReadonlyArray<{
  id: RoutePreference
  label: string
  available: boolean
  reason: string
}> = [
  { id: 'fast', label: 'Rápida', available: true, reason: 'Ruta más rápida calculada por OSRM.' },
  {
    id: 'cheap',
    label: 'Económica',
    available: false,
    reason:
      'No tenemos datos de peajes, combustible ni tarifas de transporte, así que no podemos optimizar por coste.',
  },
  {
    id: 'calm',
    label: 'Tranquila',
    available: false,
    reason:
      'No tenemos datos de tráfico, ruido, anchura de vías ni siniestralidad para valorar la calma de un recorrido.',
  },
  {
    id: 'scenic',
    label: 'Escénica',
    available: false,
    reason:
      'No tenemos datos de paisaje, miradores ni valor escénico de las vías para elegir un recorrido más bonito.',
  },
  {
    id: 'accessible',
    label: 'Accesible',
    available: false,
    reason:
      'No tenemos datos de pendientes, bordillos, escalones, ascensores ni accesibilidad de la vía.',
  },
  {
    id: 'explore',
    label: 'Explorar',
    available: false,
    reason:
      'Explorar no es una optimización de ruta. Usa la pestaña Explorar para descubrir lugares alrededor del mapa.',
  },
]

function endpointForCenter(kind: RouteEndpoint['kind']): RouteEndpoint {
  const map = getMapInstance()
  const mapCenter = map?.getCenter()
  const coords = mapCenter
    ? { lng: mapCenter.lng, lat: mapCenter.lat }
    : { ...useAppStore.getState().viewport.center }
  return { id: uid(kind), kind, label: 'Centro del mapa', coords }
}

interface EndpointCardProps {
  kind: 'origin' | 'destination'
  endpoint: RouteEndpoint | null
  locating: boolean
  onRemove: () => void
  onLocation?: () => void
  onCenter: () => void
  onPick: () => void
}

function EndpointCard({
  kind,
  endpoint,
  locating,
  onRemove,
  onLocation,
  onCenter,
  onPick,
}: EndpointCardProps) {
  const role = kind === 'origin' ? 'Origen' : 'Destino'
  return (
    <div className={styles.endpoint}>
      <div className={styles.endpointTop}>
        <span
          className={cn(styles.dot, kind === 'origin' ? styles.dotOrigin : styles.dotDestination)}
          aria-hidden="true"
        />
        <div className={styles.endpointText}>
          <span className={styles.endpointRole}>{role}</span>
          <span className={cn(styles.endpointLabel, !endpoint?.coords && styles.endpointPlaceholder)}>
            {endpoint?.label ?? `Sin ${role.toLowerCase()}`}
          </span>
          {endpoint?.coords && <span className={styles.coords}>{formatCoords(endpoint.coords)}</span>}
        </div>
        {endpoint && (
          <button
            type="button"
            className={styles.clearEndpoint}
            onClick={onRemove}
            aria-label={`Quitar ${role.toLowerCase()}`}
            title={`Quitar ${role.toLowerCase()}`}
          >
            <X size={13} />
          </button>
        )}
      </div>
      <div className={styles.endpointActions}>
        {onLocation && (
          <button type="button" className={styles.miniAction} onClick={onLocation} disabled={locating}>
            {locating ? <Spinner size={12} label="Localizando" /> : <LocateFixed size={12} />}
            {locating ? 'Localizando…' : 'Mi ubicación'}
          </button>
        )}
        <button type="button" className={styles.miniAction} onClick={onCenter}>
          <Crosshair size={12} />
          Centro del mapa
        </button>
        <button type="button" className={styles.miniAction} onClick={onPick}>
          <MapPin size={12} />
          Elegir en el mapa
        </button>
      </div>
    </div>
  )
}

function NoteList({ notes }: { notes: RouteNote[] }) {
  return (
    <ul className={styles.notes}>
      {notes.map((note) => {
        const Icon = note.kind === 'warn' ? TriangleAlert : note.kind === 'unknown' ? CircleHelp : Info
        return (
          <li key={note.text} className={cn(styles.note, styles[`note_${note.kind}`])}>
            <Icon size={13} aria-hidden="true" />
            <span>{note.text}</span>
          </li>
        )
      })}
    </ul>
  )
}

/** Pestaña Ruta: planificador real sobre OSRM. */
export function RoutePanel() {
  const { retry } = useRoutePlanner()

  const origin = useAppStore((s) => s.routeOrigin)
  const destination = useAppStore((s) => s.routeDestination)
  const waypoints = useAppStore((s) => s.routeWaypoints)
  const travelMode = useAppStore((s) => s.travelMode)
  const routePreference = useAppStore((s) => s.routePreference)
  const routeStatus = useAppStore((s) => s.routeStatus)
  const routeError = useAppStore((s) => s.routeError)
  const plan = useAppStore((s) => s.routePlan)
  const alternatives = useAppStore((s) => s.routeAlternatives)
  const units = useAppStore((s) => s.prefs.units)

  const setRouteOrigin = useAppStore((s) => s.setRouteOrigin)
  const setRouteDestination = useAppStore((s) => s.setRouteDestination)
  const swapRouteEndpoints = useAppStore((s) => s.swapRouteEndpoints)
  const addRouteWaypoint = useAppStore((s) => s.addRouteWaypoint)
  const removeRouteWaypoint = useAppStore((s) => s.removeRouteWaypoint)
  const moveRouteWaypoint = useAppStore((s) => s.moveRouteWaypoint)
  const setRoutePickTarget = useAppStore((s) => s.setRoutePickTarget)
  const setMobileSheetOpen = useAppStore((s) => s.setMobileSheetOpen)
  const setTravelMode = useAppStore((s) => s.setTravelMode)
  const setRoutePreference = useAppStore((s) => s.setRoutePreference)
  const setRouteResult = useAppStore((s) => s.setRouteResult)
  const resetRoute = useAppStore((s) => s.resetRoute)

  const geo = useGeolocation()
  const pendingLocationRef = useRef(false)
  const [profileNotice, setProfileNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!pendingLocationRef.current) return
    if (geo.coords) {
      pendingLocationRef.current = false
      setRouteOrigin({
        id: uid('origin'),
        kind: 'origin',
        label: 'Mi ubicación',
        coords: geo.coords,
        fromUserLocation: true,
      })
    } else if (geo.status === 'denied' || geo.status === 'error') {
      pendingLocationRef.current = false
    }
  }, [geo.coords, geo.status, setRouteOrigin])

  const locating = geo.status === 'requesting'
  const stopsFull = waypoints.length >= MAX_STOPS
  const hasRouteInput = Boolean(origin || destination || waypoints.length > 0 || plan)
  const bothEndsReady = Boolean(origin?.coords && destination?.coords)

  const startPick = (target: 'origin' | 'destination' | 'waypoint') => {
    setRoutePickTarget(target)
    setMobileSheetOpen(false)
  }

  const requestLocation = () => {
    if (geo.coords) {
      setRouteOrigin({
        id: uid('origin'),
        kind: 'origin',
        label: 'Mi ubicación',
        coords: geo.coords,
        fromUserLocation: true,
      })
      return
    }
    pendingLocationRef.current = true
    geo.request()
  }

  const addCenterStop = () => {
    if (stopsFull) return
    addRouteWaypoint(endpointForCenter('waypoint'))
  }

  const chooseProfile = (profile: (typeof PROFILES)[number]) => {
    if (!profile.available) {
      setProfileNotice(
        `«${profile.label}» no está disponible. ${profile.reason} Mantenemos la ruta más rápida.`,
      )
      return
    }
    setRoutePreference(profile.id)
    setProfileNotice(null)
  }

  const options = plan ? [plan, ...alternatives] : []
  const fastest = options.length
    ? options.reduce((best, option) => (option.durationS < best.durationS ? option : best), options[0]!)
    : null
  const sortedOptions = [...options].sort((a, b) => a.durationS - b.durationS)

  const selectPlan = (option: RoutePlan) => {
    if (!plan || option.id === plan.id) return
    setRouteResult(option, options.filter((item) => item.id !== option.id))
  }

  const exportPlan = (format: RouteExportFormat) => {
    if (!plan) return
    const isGpx = format === 'gpx'
    downloadTextFile(
      routeExportFileName(plan, format),
      isGpx ? routeToGpx(plan) : routeToGeoJson(plan),
      isGpx ? 'application/gpx+xml;charset=utf-8' : 'application/geo+json;charset=utf-8',
    )
  }

  const steps = plan?.legs.flatMap((leg) => leg.steps) ?? []
  const loading = routeStatus === 'loading' || (!plan && bothEndsReady && routeStatus === 'idle')

  return (
    <div className={styles.root}>
      <header className={styles.head}>
        <div>
          <Eyebrow>Planificador</Eyebrow>
          <h2 className={styles.title}>De dónde a dónde</h2>
        </div>
        {hasRouteInput && (
          <Button
            variant="ghost"
            small
            icon={<Trash2 size={14} />}
            onClick={() => {
              resetRoute()
              setProfileNotice(null)
            }}
            title="Borrar puntos, paradas y resultado de la ruta"
          >
            Limpiar
          </Button>
        )}
      </header>

      <p className={styles.intro}>
        Origen, destino y hasta cuatro paradas. Calculamos la ruta más rápida con OSRM; no
        simulamos perfiles para los que no tenemos datos.
      </p>

      <section className={styles.section} aria-label="Puntos de la ruta">
        <div className={styles.sectionHead}>
          <Eyebrow>Puntos</Eyebrow>
          <IconButton
            label="Intercambiar origen y destino"
            onClick={swapRouteEndpoints}
            disabled={!origin && !destination}
            title={
              origin || destination
                ? 'Intercambiar origen y destino'
                : 'No hay puntos que intercambiar'
            }
          >
            <ArrowUpDown size={14} />
          </IconButton>
        </div>
        <div className={styles.endpointBox}>
          <EndpointCard
            kind="origin"
            endpoint={origin}
            locating={locating}
            onRemove={() => setRouteOrigin(null)}
            onLocation={requestLocation}
            onCenter={() => setRouteOrigin(endpointForCenter('origin'))}
            onPick={() => startPick('origin')}
          />
          <EndpointCard
            kind="destination"
            endpoint={destination}
            locating={false}
            onRemove={() => setRouteDestination(null)}
            onCenter={() => setRouteDestination(endpointForCenter('destination'))}
            onPick={() => startPick('destination')}
          />
        </div>
        <p className={styles.hint}>
          También puedes abrir una ficha de lugar y pulsar «Cómo llegar» o «Añadir como parada».
        </p>
      </section>

      <section className={styles.section} aria-label="Paradas intermedias">
        <div className={styles.sectionHead}>
          <Eyebrow>Paradas</Eyebrow>
          <span className={styles.count}>
            {waypoints.length} / {MAX_STOPS}
          </span>
        </div>

        {waypoints.length > 0 && (
          <ol className={styles.stopList}>
            {waypoints.map((stop, index) => (
              <li key={stop.id} className={styles.stopItem}>
                <span className={styles.stopIndex} aria-hidden="true">
                  {index + 1}
                </span>
                <div className={styles.stopBody}>
                  <span className={styles.stopLabel}>{stop.label}</span>
                  {stop.coords && <span className={styles.stopCoords}>{formatCoords(stop.coords)}</span>}
                </div>
                <div className={styles.stopActions}>
                  <button
                    type="button"
                    className={styles.stopBtn}
                    onClick={() => moveRouteWaypoint(index, index - 1)}
                    disabled={index === 0}
                    aria-label={`Subir ${stop.label}`}
                    title={index === 0 ? 'Ya es la primera parada' : 'Subir parada'}
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    type="button"
                    className={styles.stopBtn}
                    onClick={() => moveRouteWaypoint(index, index + 1)}
                    disabled={index === waypoints.length - 1}
                    aria-label={`Bajar ${stop.label}`}
                    title={
                      index === waypoints.length - 1 ? 'Ya es la última parada' : 'Bajar parada'
                    }
                  >
                    <ArrowDown size={12} />
                  </button>
                  <button
                    type="button"
                    className={styles.stopBtn}
                    onClick={() => removeRouteWaypoint(stop.id)}
                    aria-label={`Quitar ${stop.label}`}
                    title="Quitar parada"
                  >
                    <X size={12} />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className={styles.stopButtons}>
          <Button
            small
            variant="ghost"
            icon={<MapPin size={13} />}
            onClick={() => startPick('waypoint')}
            disabled={stopsFull}
            title={stopsFull ? 'Máximo 4 paradas' : 'Añadir una parada tocando el mapa'}
          >
            Añadir en el mapa
          </Button>
          <Button
            small
            variant="ghost"
            icon={<Crosshair size={13} />}
            onClick={addCenterStop}
            disabled={stopsFull}
            title={stopsFull ? 'Máximo 4 paradas' : 'Añadir el centro del mapa como parada'}
          >
            Añadir centro
          </Button>
        </div>
        <p className={styles.hint}>
          El orden se respeta en la ruta. Usa las flechas para reordenar; la ruta se recalcula sola.
        </p>
      </section>

      <section className={styles.section} aria-label="Modo de transporte">
        <Eyebrow>Modo</Eyebrow>
        <div className={styles.modeRow} role="group" aria-label="Modo de transporte">
          {MODE_OPTIONS.map((option) => {
            const meta = MODE_META[option.mode]
            const Icon = meta.icon
            const active = travelMode === option.mode
            return (
              <button
                key={option.mode}
                type="button"
                className={cn(styles.mode, active && styles.modeActive)}
                aria-pressed={active}
                disabled={!option.available}
                title={
                  option.available
                    ? `Calcular en ${meta.label.toLowerCase()}`
                    : (option.reason ?? 'Sin proveedor configurado para este modo')
                }
                onClick={() => setTravelMode(option.mode)}
              >
                <Icon size={15} aria-hidden="true" />
                <span>{meta.label}</span>
              </button>
            )
          })}
        </div>
        <p className={styles.hint}>
          Los modos desactivados no tienen proveedor configurado; no se estiman tiempos para ellos.
        </p>
      </section>

      <section className={styles.section} aria-label="Perfil de ruta">
        <div className={styles.sectionHead}>
          <Eyebrow>Perfil</Eyebrow>
          <span className={styles.count}>según tu intención</span>
        </div>
        <div className={styles.profileGrid} role="group" aria-label="Perfil de ruta">
          {PROFILES.map((profile) => {
            const active = routePreference === profile.id
            return (
              <button
                key={profile.id}
                type="button"
                className={cn(
                  styles.profile,
                  active && styles.profileActive,
                  !profile.available && styles.profileUnavailable,
                )}
                aria-pressed={active}
                title={profile.available ? profile.reason : `Sin datos: ${profile.reason}`}
                onClick={() => chooseProfile(profile)}
              >
                {profile.label}
                {!profile.available && <span className={styles.profileMark}>·</span>}
              </button>
            )
          })}
        </div>
        <div className={styles.profileNote} aria-live="polite">
          {profileNotice ? (
            <>
              <Info size={13} aria-hidden="true" />
              <span>{profileNotice}</span>
            </>
          ) : (
            <>
              <CircleHelp size={13} aria-hidden="true" />
              <span>
                Solo «Rápida» usa datos reales de OSRM. Los perfiles atenuados no se simulan:
                pulsa para saber qué datos faltan.
              </span>
            </>
          )}
        </div>
      </section>

      <section className={styles.section} aria-label="Resultado de la ruta">
        <Eyebrow>Resultado</Eyebrow>

        {routeStatus === 'error' && routeError && (
          <div className={styles.errorBox} role="alert">
            <div className={styles.errorHead}>
              <TriangleAlert size={15} aria-hidden="true" />
              <strong>No se pudo calcular la ruta</strong>
            </div>
            <p>{routeError}</p>
            <Button
              small
              variant="outline"
              icon={<RefreshCw size={13} />}
              onClick={retry}
              disabled={!bothEndsReady}
            >
              Reintentar
            </Button>
          </div>
        )}

        {loading && !plan && (
          <div className={styles.statusBox} role="status" aria-live="polite">
            <Spinner size={16} label="Calculando ruta" />
            <div>
              <p className={styles.statusTitle}>Calculando la ruta con OSRM…</p>
              <p className={styles.statusHint}>
                El servicio público puede tardar unos segundos. Sin tráfico en directo.
              </p>
            </div>
          </div>
        )}

        {plan && (
          <>
            <div className={styles.summary}>
              <div className={styles.summaryTop}>
                <div>
                  <p className={styles.duration}>{formatDuration(plan.durationS)}</p>
                  <p className={styles.distance}>{formatDistance(plan.distanceM, units)}</p>
                </div>
                <div className={styles.badges}>
                  <Chip tone="warn" title="Estimación del proveedor sin tráfico en tiempo real">
                    Estimado
                  </Chip>
                  <Chip tone="info" title="Servicio público de OSRM">
                    {plan.providerIsDemo ? 'OSRM · demo' : 'OSRM'}
                  </Chip>
                </div>
              </div>
              <p className={styles.summaryStops}>
                {plan.stops.map((stop) => stop.label).join(' → ')}
              </p>
            </div>

            <NoteList notes={plan.notes} />

            <div className={styles.exportBlock}>
              <div className={styles.exportHead}>
                <Download size={13} aria-hidden="true" />
                <span>Exportar ruta</span>
              </div>
              <div className={styles.exportActions}>
                <Button
                  variant="outline"
                  small
                  aria-label="Descargar GPX"
                  onClick={() => exportPlan('gpx')}
                >
                  GPX
                </Button>
                <Button
                  variant="outline"
                  small
                  aria-label="Descargar GeoJSON"
                  onClick={() => exportPlan('geojson')}
                >
                  GeoJSON
                </Button>
              </div>
              <p className={styles.hint}>
                Solo la geometría y los datos devueltos por OSRM. Sin tráfico ni tiempos
                inventados.
              </p>
            </div>

            {options.length > 1 ? (
              <div className={styles.optionsBlock}>
                <div className={styles.sectionHead}>
                  <p className={styles.subheading}>Opciones de ruta</p>
                  <span className={styles.count}>{options.length}</span>
                </div>
                <div className={styles.options} role="group" aria-label="Opciones de ruta">
                  {sortedOptions.map((option) => {
                    const active = option.id === plan.id
                    const rank = sortedOptions.findIndex((item) => item.id === option.id)
                    const delta = Math.round((option.durationS - (fastest?.durationS ?? 0)) / 60)
                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={cn(styles.option, active && styles.optionActive)}
                        aria-pressed={active}
                        onClick={() => selectPlan(option)}
                      >
                        <span className={styles.optionDot} aria-hidden="true" />
                        <span className={styles.optionBody}>
                          <span className={styles.optionTitle}>
                            {rank === 0 ? 'Ruta más rápida' : `Alternativa ${rank}`}
                          </span>
                          <span className={styles.optionMeta}>
                            {formatDuration(option.durationS)} ·{' '}
                            {formatDistance(option.distanceM, units)}
                            {delta > 0 && <span className={styles.optionDelta}>+{delta} min</span>}
                          </span>
                        </span>
                        {active && <Check size={14} className={styles.optionCheck} aria-hidden="true" />}
                      </button>
                    )
                  })}
                </div>
                <p className={styles.hint}>
                  Alternativas calculadas por OSRM con los mismos puntos. No son perfiles temáticos.
                </p>
              </div>
            ) : (
              <p className={styles.hint}>
                OSRM solo devolvió una ruta para estos puntos; no hay alternativas que comparar.
              </p>
            )}

            <div className={styles.tripHead}>
              <Clock3 size={14} aria-hidden="true" />
              <span>Vista de viaje</span>
            </div>

            {steps.length > 0 ? (
              <details className={styles.steps}>
                <summary className={styles.stepsSummary}>
                  <span>Indicaciones paso a paso</span>
                  <span className={styles.stepsMeta}>{steps.length} pasos</span>
                </summary>
                <ol className={styles.stepList}>
                  {steps.map((step, index) => (
                    <li key={`${index}-${step.instruction}`} className={styles.step}>
                      <span className={styles.stepNum} aria-hidden="true">
                        {index + 1}
                      </span>
                      <div>
                        <p className={styles.stepText}>{step.instruction}</p>
                        {step.distanceM > 0 && (
                          <span className={styles.stepDist}>
                            {formatDistance(step.distanceM, units)}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </details>
            ) : (
              <p className={styles.hint}>El proveedor no devolvió indicaciones paso a paso.</p>
            )}
          </>
        )}

        {!plan && !loading && routeStatus !== 'error' && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon} aria-hidden="true">
              <RouteIcon size={18} />
            </span>
            <p className={styles.emptyTitle}>
              {!origin && !destination
                ? 'Elige origen y destino'
                : !origin
                  ? 'Elige un origen'
                  : !destination
                    ? 'Elige un destino'
                    : 'Preparando la ruta'}
            </p>
            <p className={styles.emptyHint}>
              Usa tu ubicación, el centro del mapa o toca el mapa para elegir un punto exacto.
            </p>
          </div>
        )}
      </section>

      <p className={styles.sourceNote}>
        Rutas: OSRM · Datos © OpenStreetMap contributors. Sin tráfico, peajes ni accesibilidad en
        tiempo real.
      </p>
    </div>
  )
}
