import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { providerStatuses } from '../../app/config'
import { useAppStore } from '../../store/appStore'
import { Chip, Eyebrow, IconButton } from '../../components/ui'
import { cn } from '../../utils/cn'
import styles from './SettingsDialog.module.css'

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

/** Ajustes: preferencias de la app y estado honesto de los proveedores. */
export function SettingsDialog() {
  const open = useAppStore((s) => s.settingsOpen)
  const setOpen = useAppStore((s) => s.setSettingsOpen)
  const prefs = useAppStore((s) => s.prefs)
  const updatePrefs = useAppStore((s) => s.updatePrefs)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    dialogRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  /* Ciclo de foco básico dentro del diálogo */
  const onKeyDownTrap = (e: ReactKeyboardEvent) => {
    if (e.key !== 'Tab' || !dialogRef.current) return
    const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
      'button, input, select, a[href], [tabindex]:not([tabindex="-1"])',
    )
    if (focusables.length === 0) return
    const first = focusables[0]!
    const last = focusables[focusables.length - 1]!
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  if (!open) return null
  const statuses = providerStatuses()

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false)
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
        className={styles.dialog}
        onKeyDown={onKeyDownTrap}
      >
        <header className={styles.head}>
          <h2 id="settings-title" className={styles.title}>
            Ajustes
          </h2>
          <IconButton label="Cerrar ajustes" onClick={() => setOpen(false)}>
            <X size={16} />
          </IconButton>
        </header>

        <div className={styles.body}>
          <section className={styles.section}>
            <Eyebrow>Preferencias</Eyebrow>

            <div className={styles.row}>
              <div className={styles.rowText}>
                <p className={styles.rowTitle}>Unidades de distancia</p>
                <p className={styles.rowHint}>Se aplican a distancias y fichas de lugar</p>
              </div>
              <div className={styles.segment} role="radiogroup" aria-label="Sistema de unidades">
                <button
                  type="button"
                  role="radio"
                  aria-checked={prefs.units === 'metric'}
                  className={cn(styles.segBtn, prefs.units === 'metric' && styles.segActive)}
                  onClick={() => updatePrefs({ units: 'metric' })}
                >
                  Métrico
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={prefs.units === 'imperial'}
                  className={cn(styles.segBtn, prefs.units === 'imperial' && styles.segActive)}
                  onClick={() => updatePrefs({ units: 'imperial' })}
                >
                  Imperial
                </button>
              </div>
            </div>

            <label className={styles.row}>
              <div className={styles.rowText}>
                <p className={styles.rowTitle}>Movimiento reducido</p>
                <p className={styles.rowHint}>Desactiva animaciones de paneles y transiciones</p>
              </div>
              <input
                type="checkbox"
                checked={prefs.reduceMotion}
                onChange={(e) => updatePrefs({ reduceMotion: e.target.checked })}
              />
            </label>

            <label className={styles.row}>
              <div className={styles.rowText}>
                <p className={styles.rowTitle}>Capa de puntos de interés</p>
                <p className={styles.rowHint}>Muestra los POI de Explorar sobre el mapa</p>
              </div>
              <input
                type="checkbox"
                checked={prefs.showPoiLayer}
                onChange={(e) => updatePrefs({ showPoiLayer: e.target.checked })}
              />
            </label>
          </section>

          <section className={styles.section}>
            <Eyebrow>Proveedores configurados</Eyebrow>
            <ul className={styles.providers}>
              {statuses.map((p) => (
                <li key={p.id} className={styles.providerRow}>
                  <span className={styles.providerLabel}>{p.label}</span>
                  {p.isDemo ? <Chip tone="info">demo</Chip> : <Chip tone="ok">propio</Chip>}
                  <span className={styles.providerUrl}>{hostnameOf(p.url)}</span>
                </li>
              ))}
            </ul>
            <p className={styles.note}>
              Los proveedores por defecto son servicios públicos de demostración: tienen límites de uso y
              no garantizan disponibilidad. Puedes cambiarlos con variables de entorno — consulta{' '}
              <code>.env.example</code>.
            </p>
          </section>

          <section className={styles.section}>
            <Eyebrow>Datos y atribución</Eyebrow>
            <p className={styles.note}>
              Datos cartográficos © OpenStreetMap contributors (licencia ODbL). Búsqueda mediante Nominatim,
              rutas mediante OSRM y lugares mediante Overpass. ATLAS no muestra tráfico, horarios ni precios
              en tiempo real: si un dato no existe en la fuente, se indica como desconocido. La imagen
              satelital de demostración (Esri World Imagery) no está licenciada para uso comercial: para
              publicar con tráfico real hay que configurar un proveedor propio.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
