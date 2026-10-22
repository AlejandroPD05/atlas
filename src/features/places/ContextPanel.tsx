import { useEffect } from 'react'
import {
  Bookmark,
  BookmarkCheck,
  Clock3,
  Crosshair,
  ExternalLink,
  Globe,
  ListPlus,
  Navigation,
  Phone,
  X,
} from 'lucide-react'
import type { Place } from '../../types/domain'
import { useAppStore, isPlaceSaved } from '../../store/appStore'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { useMapInstance } from '../map/mapInstance'
import { Button, Chip, DataTag, IconButton } from '../../components/ui'
import { cn } from '../../utils/cn'
import { categoryLabel } from '../explore/categories'
import { formatCoords, formatDistance } from '../../utils/format'
import { haversineDistanceM } from '../../utils/geo'
import { uid } from '../../utils/id'
import styles from './ContextPanel.module.css'

const MAX_STOPS = 4

function safeOsmUrl(place: Place): string | null {
  if (!place.osm) return null
  const { type, id } = place.osm
  if (type !== 'node' && type !== 'way' && type !== 'relation') return null
  if (!Number.isFinite(id)) return null
  return `https://www.openstreetmap.org/${type}/${id}`
}

function websiteLabel(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '') + (u.pathname !== '/' ? u.pathname : '')
  } catch {
    return url
  }
}

function PlaceCard({ place }: { place: Place }) {
  const selectPlace = useAppStore((s) => s.selectPlace)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const setRouteDestination = useAppStore((s) => s.setRouteDestination)
  const addRouteWaypoint = useAppStore((s) => s.addRouteWaypoint)
  const toggleSavePlace = useAppStore((s) => s.toggleSavePlace)
  const pushNotice = useAppStore((s) => s.pushNotice)
  const collections = useAppStore((s) => s.collections)
  const waypoints = useAppStore((s) => s.routeWaypoints)
  const units = useAppStore((s) => s.prefs.units)
  const userLocation = useAppStore((s) => s.userLocation)
  const map = useMapInstance()

  const saved = isPlaceSaved(collections, place.id)
  const distanceM = userLocation ? haversineDistanceM(userLocation, place.coords) : null
  const osmUrl = safeOsmUrl(place)
  const contact = place.contact
  const hasContact = Boolean(contact?.website || contact?.phone || contact?.openingHours)
  const stopsFull = waypoints.length >= MAX_STOPS

  return (
    <>
      <header className={styles.head}>
        <div className={styles.headText}>
          <p className={styles.category}>{categoryLabel(place.category)}</p>
          <h2 className={styles.title}>{place.name}</h2>
        </div>
        <IconButton label="Cerrar ficha" onClick={() => selectPlace(null)}>
          <X size={16} />
        </IconButton>
      </header>

      <div className={styles.tags}>
        <DataTag quality={place.quality} />
        {distanceM !== null && (
          <Chip tone="neutral" title="Distancia en línea recta desde tu ubicación (no es la ruta)">
            a {formatDistance(distanceM, units)} en línea recta
          </Chip>
        )}
      </div>

      <dl className={styles.facts}>
        {place.address ? (
          <div className={styles.fact}>
            <dt>Dirección</dt>
            <dd>{place.address}</dd>
          </div>
        ) : (
          <div className={styles.fact}>
            <dt>Dirección</dt>
            <dd className={styles.unknown}>Sin datos en la fuente</dd>
          </div>
        )}
        <div className={styles.fact}>
          <dt>Coordenadas</dt>
          <dd className={styles.mono}>{formatCoords(place.coords)}</dd>
        </div>
      </dl>

      {hasContact ? (
        <div className={styles.contact}>
          {contact?.website && (
            <p className={styles.contactRow}>
              <Globe size={13} className={styles.contactIcon} aria-hidden="true" />
              <a
                className={styles.contactLink}
                href={contact.website}
                target="_blank"
                rel="noopener noreferrer"
                title={contact.website}
              >
                {websiteLabel(contact.website)}
                <ExternalLink size={11} aria-hidden="true" />
              </a>
            </p>
          )}
          {contact?.phone && (
            <p className={styles.contactRow}>
              <Phone size={13} className={styles.contactIcon} aria-hidden="true" />
              <a className={styles.contactLink} href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}>
                {contact.phone}
              </a>
            </p>
          )}
          {contact?.openingHours && (
            <p className={styles.contactRow}>
              <Clock3 size={13} className={styles.contactIcon} aria-hidden="true" />
              <span>{contact.openingHours}</span>
            </p>
          )}
          <p className={styles.contactSource}>Datos de contacto publicados en OpenStreetMap.</p>
        </div>
      ) : (
        <p className={styles.contactNote}>
          OpenStreetMap no publica web, teléfono ni horarios para este lugar. No inventamos esos datos.
        </p>
      )}

      <div className={styles.actions}>
        <Button
          variant="primary"
          icon={<Navigation size={15} />}
          onClick={() => {
            setRouteDestination({
              id: uid('ep'),
              kind: 'destination',
              label: place.name,
              coords: place.coords,
              placeId: place.id,
            })
            setActiveTab('route')
          }}
        >
          Cómo llegar
        </Button>
        <Button
          variant="outline"
          icon={saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
          onClick={() => toggleSavePlace(place)}
        >
          {saved ? 'Guardado' : 'Guardar'}
        </Button>
      </div>

      <div className={styles.actionsSecondary}>
        <Button
          variant="ghost"
          small
          icon={<ListPlus size={14} />}
          disabled={stopsFull}
          title={
            stopsFull
              ? `Máximo ${MAX_STOPS} paradas intermedias`
              : 'Añadir este lugar como parada intermedia de la ruta'
          }
          onClick={() => {
            addRouteWaypoint({
              id: uid('wp'),
              kind: 'waypoint',
              label: place.name,
              coords: place.coords,
              placeId: place.id,
            })
            pushNotice({
              kind: 'info',
              title: 'Añadido como parada',
              detail: `${place.name} · ${waypoints.length + 1} de ${MAX_STOPS}`,
            })
            setActiveTab('route')
          }}
        >
          Añadir como parada
        </Button>
        <Button
          variant="ghost"
          small
          icon={<Crosshair size={14} />}
          onClick={() => map?.flyTo({ center: [place.coords.lng, place.coords.lat], zoom: 16, duration: 900 })}
        >
          Centrar
        </Button>
      </div>

      {osmUrl && (
        <a className={styles.osmLink} href={osmUrl} target="_blank" rel="noopener noreferrer">
          Ver el registro en OpenStreetMap
          <ExternalLink size={11} aria-hidden="true" />
        </a>
      )}
    </>
  )
}

/** Panel contextual derecho (escritorio) o tarjeta inferior (móvil). */
export function ContextPanel() {
  const selectedPlace = useAppStore((s) => s.selectedPlace)
  const setMobileSheetOpen = useAppStore((s) => s.setMobileSheetOpen)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (isMobile && selectedPlace) setMobileSheetOpen(false)
  }, [isMobile, selectedPlace, setMobileSheetOpen])

  if (!selectedPlace) return null

  return (
    <aside className={cn(styles.panel, isMobile && styles.mobile)} aria-label="Detalles del lugar">
      <PlaceCard place={selectedPlace} />
    </aside>
  )
}
