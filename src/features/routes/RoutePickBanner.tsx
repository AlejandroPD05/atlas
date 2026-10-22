import { useEffect } from 'react'
import { Crosshair, X } from 'lucide-react'
import { Button } from '../../components/ui'
import { useAppStore } from '../../store/appStore'
import styles from './RoutePickBanner.module.css'

const TARGET_LABEL = {
  origin: 'el origen',
  destination: 'el destino',
  waypoint: 'una parada',
} as const

/** Aviso flotante mientras se elige un punto de ruta sobre el mapa. */
export function RoutePickBanner() {
  const target = useAppStore((s) => s.routePickTarget)
  const setTarget = useAppStore((s) => s.setRoutePickTarget)

  useEffect(() => {
    if (!target) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTarget(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [target, setTarget])

  if (!target) return null

  return (
    <div className={styles.banner} role="status" aria-live="polite">
      <span className={styles.icon} aria-hidden="true">
        <Crosshair size={16} />
      </span>
      <p className={styles.text}>
        Toca el mapa para fijar {TARGET_LABEL[target]}. <span>Pulsa Esc para cancelar.</span>
      </p>
      <Button
        small
        variant="ghost"
        icon={<X size={14} />}
        onClick={() => setTarget(null)}
        aria-label="Cancelar la selección en el mapa"
      >
        Cancelar
      </Button>
    </div>
  )
}
