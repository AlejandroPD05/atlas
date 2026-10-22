import { Bookmark, Search, Settings2 } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { IconButton } from '../../components/ui'
import { SearchBar } from '../search/SearchBar'
import styles from './TopBar.module.css'

/** Barra superior compacta: identidad, búsqueda global y accesos. */
export function TopBar() {
  const activeTab = useAppStore((s) => s.activeTab)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)
  const setMobileSheetOpen = useAppStore((s) => s.setMobileSheetOpen)
  const isMobile = useIsMobile()

  const openTab = (tab: 'search' | 'saved') => {
    setActiveTab(tab)
    if (isMobile) setMobileSheetOpen(true)
  }

  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <svg className={styles.mark} viewBox="0 0 32 32" aria-hidden="true">
          <path
            d="M8 24 L16 8 L24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="24" r="2.6" fill="currentColor" />
        </svg>
        <span className={styles.name}>ATLAS</span>
        <span className={styles.beta}>beta</span>
      </div>

      {!isMobile && (
        <div className={styles.searchZone}>
          <SearchBar />
        </div>
      )}

      <div className={styles.actions}>
        {isMobile && (
          <IconButton label="Buscar" active={activeTab === 'search'} onClick={() => openTab('search')}>
            <Search size={18} />
          </IconButton>
        )}
        <IconButton label="Guardados" active={activeTab === 'saved'} onClick={() => openTab('saved')}>
          <Bookmark size={18} />
        </IconButton>
        <IconButton label="Ajustes" onClick={() => setSettingsOpen(true)}>
          <Settings2 size={18} />
        </IconButton>
      </div>
    </header>
  )
}
