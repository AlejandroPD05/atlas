import { useEffect } from 'react'
import { Bookmark, BookmarkCheck, Crosshair, Navigation, X } from 'lucide-react'
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

function PlaceCard({ place }: { place: Place }) {
  const selectPlace = useAppStore((s) => s.selectPlace)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const setRouteDestination = useAppStore((s) => s.setRouteDestination)
  const toggleSavePlace = useAppStore((s) => s.toggleSavePlace)
  const collections = useAppStore((s) => s.collections)
  const units = useAppStore((s) => s.prefs.units)
  const userLocation = useAppStore((s) => s.userLocation)
  const map = useMapInstance()

  const saved = isPlaceSaved(collections, place.id)
  const distanceM = userLocation ? haversineDistanceM(userLocation, place.coords) : null

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
      <div className={styles.actions}>
        <Button
          variant="ghost"
          icon={<Crosshair size={15} />}
          onClick={() => map?.flyTo({ center: [place.coords.lng, place.coords.lat], zoom: 16, duration: 900 })}
        >
          Centrar en el mapa
        </Button>
      </div>
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
