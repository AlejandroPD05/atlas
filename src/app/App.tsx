import { useEffect } from 'react'
import { MapView } from '../features/map/MapView'
import { MapControls } from '../features/map/MapControls'
import { MapDataLayer } from '../features/map/MapDataLayer'
import { MapRouteLayer } from '../features/map/MapRouteLayer'
import { TopBar } from '../features/layout/TopBar'
import { SidePanel } from '../features/layout/SidePanel'
import { MobileNav } from '../features/layout/MobileNav'
import { ContextPanel } from '../features/places/ContextPanel'
import { RoutePickBanner } from '../features/routes/RoutePickBanner'
import { SettingsDialog } from '../features/settings/SettingsDialog'
import { ToastHost } from '../components/ToastHost'
import { useAppStore } from '../store/appStore'
import styles from './App.module.css'

/** Composición principal: el mapa es el lienzo; la interfaz flota sobre él. */
export function App() {
  const basemapId = useAppStore((s) => s.basemapId)
  const reduceMotion = useAppStore((s) => s.prefs.reduceMotion)
  const seedCollectionsOnce = useAppStore((s) => s.seedCollectionsOnce)

  useEffect(() => {
    seedCollectionsOnce()
  }, [seedCollectionsOnce])

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = reduceMotion ? 'true' : 'false'
  }, [reduceMotion])

  return (
    <div className={styles.shell} id="atlas-root">
      <MapView key={basemapId} />
      <MapDataLayer />
      <MapRouteLayer />
      <TopBar />
      <SidePanel />
      <ContextPanel />
      <MapControls />
      <RoutePickBanner />
      <MobileNav />
      <SettingsDialog />
      <ToastHost />
    </div>
  )
}
