import { useMemo, useState } from 'react'
import { ChevronRight, Compass, MapPin, RefreshCw, TriangleAlert } from 'lucide-react'
import { Button, Chip, EmptyState, Eyebrow, Spinner } from '../../components/ui'
import { useAppStore } from '../../store/appStore'
import type { PlaceCategoryId, PoiRadiusM } from '../../types/domain'
import { POI_RADII_M } from '../../types/domain'
import { formatDistance } from '../../utils/format'
import { haversineDistanceM } from '../../utils/geo'
import {
  EXPLORE_POPULAR,
  PLACE_CATEGORIES,
  getCategory,
} from './categories'
import { CategoryIcon } from './categoryIcons'
import { useExploreController } from './useExploreController'
import styles from './ExplorePanel.module.css'

const GROUP_LABELS: Record<string, string> = {
  comer: 'Comer',
  comprar: 'Comprar',
  salud: 'Salud',
  naturaleza: 'Naturaleza',
  cultura: 'Cultura',
  servicios: 'Servicios',
  movilidad: 'Movilidad',
  otros: 'Otros',
}

const GROUP_ORDER = ['comer', 'comprar', 'salud', 'naturaleza', 'cultura', 'servicios', 'movilidad', 'otros']

/** Pestaña Explorar: categorías reales de OpenStreetMap con clustering en el mapa. */
export function ExplorePanel() {
  const categoryId = useAppStore((s) => s.exploreCategory)
  const status = useAppStore((s) => s.exploreStatus)
  const pois = useAppStore((s) => s.explorePois)
  const error = useAppStore((s) => s.exploreError)
  const anchor = useAppStore((s) => s.exploreAnchor)
  const viewport = useAppStore((s) => s.viewport)
  const units = useAppStore((s) => s.prefs.units)
  const radiusM = useAppStore((s) => s.prefs.poiRadiusM)
  const updatePrefs = useAppStore((s) => s.updatePrefs)
  const [showAll, setShowAll] = useState(false)

  const { runCategory, refresh, retry, selectPoi } = useExploreController()
  const activeCategory = categoryId ? getCategory(categoryId) : null

  const grouped = useMemo(() => {
    return GROUP_ORDER.map((group) => ({
      group,
      label: GROUP_LABELS[group] ?? group,
      categories: PLACE_CATEGORIES.filter((c) => c.group === group),
    })).filter((g) => g.categories.length > 0)
  }, [])

  const stale = (() => {
    if (!anchor) return false
    const moved = haversineDistanceM(anchor.center, viewport.center)
    return moved > 250 || Math.abs(anchor.zoom - viewport.zoom) > 0.75
  })()

  const choose = (id: PlaceCategoryId) => {
    const category = getCategory(id)
    if (!category) return
    setShowAll(false)
    void runCategory(category)
  }

  const chooseRadius = (next: PoiRadiusM) => {
    if (next === radiusM) return
    updatePrefs({ poiRadiusM: next })
    if (activeCategory) void runCategory(activeCategory)
  }

  return (
    <div className={styles.root}>
      <header className={styles.head}>
        <Eyebrow>Descubrir</Eyebrow>
        <h2 className={styles.title}>Qué hay cerca</h2>
        <p className={styles.intro}>
          Lugares reales de OpenStreetMap alrededor del centro del mapa. Elige una categoría: los
          resultados aparecen como puntos ámbar y se agrupan al alejar el mapa.
        </p>
      </header>

      <section className={styles.radiusBlock} aria-label="Radio de búsqueda">
        <div className={styles.radiusHead}>
          <span className={styles.radiusLabel}>Radio de búsqueda</span>
          <span className={styles.radiusValue}>{formatDistance(radiusM, units)}</span>
        </div>
        <div className={styles.chips} role="group" aria-label="Radio de búsqueda de lugares">
          {POI_RADII_M.map((value) => (
            <button
              key={value}
              type="button"
              className={styles.chip}
              aria-pressed={value === radiusM}
              onClick={() => chooseRadius(value)}
            >
              {formatDistance(value, units)}
            </button>
          ))}
        </div>
        <p className={styles.sourceNote}>
          Se aplica a Explorar y a las búsquedas por categoría. Al cambiarlo se repite la consulta
          de la categoría activa.
        </p>
      </section>

      <section className={styles.section} aria-label="Categorías para explorar">
        <div className={styles.sectionHead}>
          <Eyebrow>Populares</Eyebrow>
          <Chip tone="ok" title="Datos reales de OpenStreetMap vía Overpass">
            OSM
          </Chip>
        </div>
        <div className={styles.chips}>
          {EXPLORE_POPULAR.map((id) => {
            const cat = getCategory(id)
            if (!cat) return null
            const active = categoryId === id
            return (
              <button
                key={id}
                type="button"
                className={styles.chip}
                aria-pressed={active}
                onClick={() => choose(id)}
              >
                <CategoryIcon id={id} size={13} />
                {cat.label}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          className={styles.allToggle}
          aria-expanded={showAll}
          onClick={() => setShowAll((value) => !value)}
        >
          {showAll ? 'Ocultar categorías' : 'Todas las categorías'}
          <ChevronRight size={13} className={showAll ? styles.chevronOpen : undefined} aria-hidden="true" />
        </button>

        {showAll && (
          <div className={styles.allGroups}>
            {grouped.map((group) => (
              <div key={group.group} className={styles.group}>
                <p className={styles.groupLabel}>{group.label}</p>
                <div className={styles.chips}>
                  {group.categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={styles.chip}
                      aria-pressed={categoryId === cat.id}
                      onClick={() => choose(cat.id)}
                    >
                      <CategoryIcon id={cat.id} size={13} />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className={styles.sourceNote}>
          Overpass público de demostración: puede tardar o devolver error. No inventamos lugares
          cuando la consulta falla.
        </p>
      </section>

      {!activeCategory && (
        <EmptyState
          icon={<Compass size={20} />}
          title="Elige una categoría"
          hint="Consultaremos OpenStreetMap alrededor del centro actual del mapa. Si mueves el mapa, podrás volver a buscar en la nueva zona."
        />
      )}

      {activeCategory && (
        <section className={styles.results} aria-label={`Resultados de ${activeCategory.label}`}>
          <div className={styles.resultsHead}>
            <div className={styles.resultsTitle}>
              <span className={styles.resultsIcon}>
                <CategoryIcon id={activeCategory.id} size={16} />
              </span>
              <div>
                <Eyebrow>Explorando</Eyebrow>
                <h3 className={styles.categoryTitle}>{activeCategory.label}</h3>
              </div>
            </div>
            <Button
              variant="ghost"
              small
              icon={<RefreshCw size={13} />}
              onClick={refresh}
              disabled={status === 'loading'}
              title="Volver a buscar esta categoría alrededor del centro actual del mapa"
            >
              Buscar aquí
            </Button>
          </div>

          <div className={styles.resultMeta}>
            <Chip tone="accent" title="Puntos reales de OpenStreetMap vía Overpass">
              Overpass · OSM
            </Chip>
            <Chip tone="info" title="Servicio público de demostración, sin SLA y con límites de uso">
              demo
            </Chip>
            <span className={styles.radius}>Radio {formatDistance(radiusM, units)}</span>
          </div>

          {stale && status !== 'loading' && (
            <div className={styles.stale} role="status">
              <MapPin size={14} aria-hidden="true" />
              <span>El mapa se ha movido. Pulsa «Buscar aquí» para explorar la nueva zona.</span>
            </div>
          )}

          {status === 'loading' && (
            <div className={styles.loading} role="status">
              <Spinner size={15} label="Buscando lugares" />
              <span>Buscando {activeCategory.label.toLowerCase()} en Overpass…</span>
            </div>
          )}

          {status === 'error' && (
            <div className={styles.error} role="alert">
              <p className={styles.errorTitle}>
                <TriangleAlert size={14} aria-hidden="true" /> No se pudo completar la consulta
              </p>
              <p className={styles.errorText}>{error}</p>
              <Button variant="outline" small onClick={retry}>
                Reintentar
              </Button>
            </div>
          )}

          {status === 'done' && pois.length === 0 && (
            <EmptyState
              icon={<MapPin size={20} />}
              title="Sin lugares de esta categoría"
              hint="No hay resultados en el radio de búsqueda actual. Mueve el mapa y pulsa «Buscar aquí», o prueba otra categoría."
            />
          )}

          {status === 'done' && pois.length > 0 && (
            <>
              <p className={styles.countNote}>
                {pois.length} {pois.length === 1 ? 'lugar encontrado' : 'lugares encontrados'} · toca
                uno para abrir su ficha.
              </p>
              <ul className={styles.list}>
                {pois.map((place) => {
                  const distance = anchor ? haversineDistanceM(anchor.center, place.coords) : null
                  return (
                    <li key={place.id}>
                      <button
                        type="button"
                        className={styles.row}
                        aria-label={`Abrir ficha de ${place.name}`}
                        onClick={() => selectPoi(place)}
                      >
                        <span className={styles.rowIcon}>
                          <CategoryIcon id={place.category} size={15} />
                        </span>
                        <span className={styles.rowText}>
                          <span className={styles.rowName}>{place.name}</span>
                          <span className={styles.rowSub}>
                            {place.address ?? 'Sin dirección en la fuente'}
                          </span>
                        </span>
                        {distance !== null && (
                          <span className={styles.rowDist} title="Distancia en línea recta desde el centro de búsqueda">
                            {formatDistance(distance, units)}
                          </span>
                        )}
                        <ChevronRight size={14} className={styles.rowChevron} aria-hidden="true" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </section>
      )}
    </div>
  )
}
