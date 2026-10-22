import { ChevronRight, Clock3, Search, TriangleAlert } from 'lucide-react'
import type { FormEvent } from 'react'
import { Button, Chip, EmptyState, Eyebrow, Input } from '../../components/ui'
import { useAppStore } from '../../store/appStore'
import { formatDistance } from '../../utils/format'
import { EXPLORE_POPULAR, getCategory } from '../explore/categories'
import { CategoryIcon } from '../explore/categoryIcons'
import { useSearchController } from './useSearchController'
import styles from './SearchPanel.module.css'

const RADIUS_M = 1500

/** Pestaña Buscar: geocoding real + categorías OSM vía Overpass. */
export function SearchPanel() {
  const query = useAppStore((s) => s.searchQuery)
  const setQuery = useAppStore((s) => s.setSearchQuery)
  const status = useAppStore((s) => s.searchStatus)
  const results = useAppStore((s) => s.searchResults)
  const error = useAppStore((s) => s.searchError)
  const fromCategory = useAppStore((s) => s.searchFromCategory)
  const recents = useAppStore((s) => s.recentSearches)
  const clearRecents = useAppStore((s) => s.clearRecentSearches)
  const units = useAppStore((s) => s.prefs.units)

  const {
    runSearch,
    retry,
    selectResult,
    supportsSuggestions,
    providerLabel,
    providerIsDemo,
  } = useSearchController()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void runSearch()
  }

  const distanceTitle = fromCategory
    ? 'Distancia en línea recta desde el centro del mapa'
    : 'Distancia en línea recta desde tu ubicación'

  return (
    <div className={styles.root}>
      <form className={styles.form} role="search" onSubmit={submit}>
        <Input
          icon={<Search size={15} />}
          value={query}
          placeholder="Direcciones, lugares o categorías…"
          aria-label="Buscar lugares en OpenStreetMap"
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" variant="primary" small icon={<Search size={14} />}>
          Buscar
        </Button>
      </form>

      <p className={styles.providerNote}>
        {providerLabel} · OpenStreetMap.{' '}
        {providerIsDemo ? 'Servicio público de demostración, con límites de uso. ' : ''}
        {supportsSuggestions
          ? 'Sugerencias al escribir activadas por el proveedor.'
          : 'El proveedor no permite autocompletado: la búsqueda se lanza al pulsar Intro o «Buscar».'}
      </p>

      {status === 'loading' && (
        <>
          <p className={styles.loadingText} role="status">
            {fromCategory
              ? 'Buscando lugares en Overpass; el servicio público puede tardar unos segundos…'
              : 'Buscando en OpenStreetMap…'}
          </p>
          <div className={styles.skeletons} aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={styles.skeleton}>
                <span className={styles.skeletonIcon} />
                <span className={styles.skeletonBody}>
                  <span className={styles.skeletonBar} style={{ width: `${68 - i * 7}%` }} />
                  <span className={styles.skeletonBar} style={{ width: `${44 + i * 5}%` }} />
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {status === 'error' && (
        <div className={styles.error} role="alert">
          <p className={styles.errorTitle}>
            <TriangleAlert size={14} aria-hidden="true" /> No se pudo completar la búsqueda
          </p>
          <p className={styles.errorText}>{error}</p>
          <Button variant="outline" small onClick={retry}>
            Reintentar
          </Button>
        </div>
      )}

      {status === 'done' && results.length === 0 && (
        <EmptyState
          icon={<Search size={20} />}
          title="Sin resultados"
          hint={
            fromCategory
              ? 'No hay lugares de esta categoría cerca del centro del mapa. Prueba a mover el mapa o a ampliar la zona.'
              : 'No se han encontrado coincidencias. Revisa la ortografía o busca una categoría como «farmacias» o «parques».'
          }
        />
      )}

      {status === 'done' && results.length > 0 && (
        <div className={styles.results}>
          <div className={styles.resultsHead}>
            <Eyebrow>
              {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
            </Eyebrow>
            <span className={styles.headChips}>
              {fromCategory ? (
                <Chip tone="accent" title="Puntos de interés reales de OpenStreetMap vía Overpass">
                  Overpass · OSM
                </Chip>
              ) : (
                <Chip tone="ok" title="Resultados reales de OpenStreetMap vía el geocoder configurado">
                  {providerLabel} · OSM
                </Chip>
              )}
              {(fromCategory || providerIsDemo) && (
                <Chip tone="info" title="Servicio público de demostración: límites de uso y sin SLA">
                  demo
                </Chip>
              )}
            </span>
          </div>

          {fromCategory && (
            <p className={styles.hint}>
              Alrededor del centro actual del mapa (radio {formatDistance(RADIUS_M, units)}). Mueve el mapa y
              vuelve a buscar para cambiar la zona.
            </p>
          )}

          <ul className={styles.list}>
            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className={styles.row}
                  onClick={() => selectResult(r)}
                  aria-label={`Abrir ficha de ${r.place.name}`}
                >
                  <span className={styles.rowIcon}>
                    <CategoryIcon id={r.place.category} size={16} />
                  </span>
                  <span className={styles.rowText}>
                    <span className={styles.rowName}>{r.place.name}</span>
                    {r.place.address ? (
                      <span className={styles.rowSub}>{r.place.address}</span>
                    ) : (
                      <span className={styles.rowSubMuted}>Sin dirección en la fuente</span>
                    )}
                  </span>
                  {r.distanceM !== undefined && (
                    <span className={styles.rowDist} title={distanceTitle}>
                      {formatDistance(r.distanceM, units)}
                    </span>
                  )}
                  <ChevronRight size={14} className={styles.rowChevron} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {status === 'idle' && (
        <>
          {recents.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <Eyebrow>Recientes</Eyebrow>
                <button type="button" className={styles.link} onClick={clearRecents}>
                  Limpiar
                </button>
              </div>
              <div className={styles.chipGrid}>
                {recents.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={styles.chipButton}
                    onClick={() => void runSearch(r)}
                  >
                    <Clock3 size={12} aria-hidden="true" />
                    {r}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className={styles.section}>
            <Eyebrow>Explorar por categoría</Eyebrow>
            <div className={styles.chipGrid}>
              {EXPLORE_POPULAR.map((id) => {
                const cat = getCategory(id)
                if (!cat) return null
                return (
                  <button
                    key={id}
                    type="button"
                    className={styles.chipButton}
                    onClick={() => void runSearch(cat.label.toLowerCase(), cat)}
                  >
                    <CategoryIcon id={cat.id} size={12} />
                    {cat.label}
                  </button>
                )
              })}
            </div>
            <p className={styles.hint}>
              Puntos reales de OpenStreetMap alrededor del centro del mapa. Si mueves el mapa, vuelve a buscar.
              El servicio público de Overpass puede tardar unos segundos.
            </p>
          </section>

          <EmptyState
            icon={<Search size={20} />}
            title="Busca un lugar para empezar"
            hint="Direcciones y negocios sobre datos de OpenStreetMap. También puedes escribir una categoría como «cafeterías» o «parques»."
          />
        </>
      )}
    </div>
  )
}
