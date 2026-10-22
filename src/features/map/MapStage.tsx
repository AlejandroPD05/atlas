import { useAppStore } from '../../store/appStore'
import { MapDataLayer } from './MapDataLayer'
import { MapRouteLayer } from './MapRouteLayer'
import { MapView } from './MapView'

/** Todo lo que necesita MapLibre, cargado en un chunk aparte. */
export default function MapStage() {
  const basemapId = useAppStore((s) => s.basemapId)

  return (
    <>
      <MapView key={basemapId} />
      <MapDataLayer />
      <MapRouteLayer />
    </>
  )
}
