import { Search } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { Button, Chip, EmptyState, Eyebrow, Input } from '../../components/ui'
import { EXPLORE_POPULAR, getCategory } from '../explore/categories'
import panel from '../layout/panel.module.css'

/** Pestaña Buscar. En la fase 2 se conecta al geocoder real. */
export function SearchPanel() {
  const query = useAppStore((s) => s.searchQuery)
  const setQuery = useAppStore((s) => s.setSearchQuery)
  const recents = useAppStore((s) => s.recentSearches)
  const clearRecents = useAppStore((s) => s.clearRecentSearches)

  return (
    <div className={panel.body}>
      <Input
        icon={<Search size={15} />}
        value={query}
        placeholder="Direcciones, lugares o categorías…"
        aria-label="Buscar"
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => setQuery(e.target.value)}
      />

      {recents.length > 0 && (
        <div className={panel.section}>
          <div className={panel.btnRow} style={{ justifyContent: 'space-between' }}>
            <Eyebrow>Recientes</Eyebrow>
            <Button variant="ghost" small onClick={clearRecents}>
              Limpiar
            </Button>
          </div>
          <div className={panel.chipGrid}>
            {recents.map((r) => (
              <button key={r} type="button" onClick={() => setQuery(r)}>
                <Chip tone="neutral">{r}</Chip>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={panel.section}>
        <Eyebrow>Explorar por categoría</Eyebrow>
        <div className={panel.chipGrid}>
          {EXPLORE_POPULAR.map((id) => {
            const cat = getCategory(id)
            if (!cat) return null
            return (
              <button key={id} type="button" onClick={() => setQuery(cat.label.toLowerCase())}>
                <Chip tone="neutral">{cat.label}</Chip>
              </button>
            )
          })}
        </div>
      </div>

      <EmptyState
        icon={<Search size={20} />}
        title="Busca un lugar para empezar"
        hint="Direcciones y negocios sobre datos de OpenStreetMap. También puedes escribir una categoría como «cafeterías» o «parques»."
      />
    </div>
  )
}
