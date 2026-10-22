import { lazy, Suspense, useEffect } from 'react'
import { TopBar } from '../features/layout/TopBar'
import { SidePanel } from '../features/layout/SidePanel'
import { MobileNav } from '../features/layout/MobileNav'
import { ContextPanel } from '../features/places/ContextPanel'
import { RoutePickBanner } from '../features/routes/RoutePickBanner'
import { SettingsDialog } from '../features/settings/SettingsDialog'
import { ToastHost } from '../components/ToastHost'
import { useAppStore } from '../store/appStore'
import styles from './App.module.css'

/* MapLibre es el paquete más pesado: entra tras el primer render. */
const MapStage = lazy(() => import('../features/map/MapStage'))
const MapControls = lazy(() =>
  import('../features/map/MapControls').then((module) => ({ default: module.MapControls })),
)

/** Composición principal: el mapa es el lienzo; la interfaz flota sobre él. */
export function App() {
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
      <Suspense
        fallback={
          <div className={styles.mapFallback} role="status">
            <span className={styles.mapFallbackLabel}>Cargando mapa…</span>
          </div>
        }
      >
        <MapStage />
      </Suspense>
      <TopBar />
      <SidePanel />
      <ContextPanel />
      <Suspense fallback={null}>
        <MapControls />
      </Suspense>
      <RoutePickBanner />
      <MobileNav />
      <SettingsDialog />
      <ToastHost />
    </div>
  )
}
