import { Search, X } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { Input, IconButton } from '../../components/ui'
import styles from './SearchBar.module.css'

/** Búsqueda global de la barra superior (escritorio). */
export function SearchBar() {
  const query = useAppStore((s) => s.searchQuery)
  const setQuery = useAppStore((s) => s.setSearchQuery)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const clearSearch = useAppStore((s) => s.clearSearch)

  return (
    <div className={styles.wrap}>
      <Input
        icon={<Search size={15} />}
        value={query}
        placeholder="Busca direcciones, lugares o categorías…"
        aria-label="Buscar en el mapa"
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => {
          setQuery(e.target.value)
          if (e.target.value.length > 0) setActiveTab('search')
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') setActiveTab('search')
        }}
        trailing={
          query ? (
            <IconButton label="Limpiar búsqueda" onClick={clearSearch}>
              <X size={14} />
            </IconButton>
          ) : undefined
        }
      />
    </div>
  )
}
