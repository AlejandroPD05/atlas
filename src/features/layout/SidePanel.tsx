import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { Chip, IconButton } from '../../components/ui'
import { cn } from '../../utils/cn'
import { SearchPanel } from '../search/SearchPanel'
import { RoutePanel } from '../routes/RoutePanel'
import { ExplorePanel } from '../explore/ExplorePanel'
import { SavedPanel } from '../saved/SavedPanel'
import { PANEL_TABS } from './tabs'
import styles from './SidePanel.module.css'

function ActiveTabContent() {
  const activeTab = useAppStore((s) => s.activeTab)
  switch (activeTab) {
    case 'search':
      return <SearchPanel />
    case 'route':
      return <RoutePanel />
    case 'explore':
      return <ExplorePanel />
    case 'saved':
      return <SavedPanel />
  }
}

function TabList() {
  const activeTab = useAppStore((s) => s.activeTab)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  return (
    <>
      {PANEL_TABS.map((t) => {
        const Icon = t.icon
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            className={cn(styles.tab, activeTab === t.id && styles.tabActive)}
            onClick={() => setActiveTab(t.id)}
            title={t.label}
          >
            <Icon size={16} aria-hidden="true" />
            <span className={styles.tabLabel}>{t.label}</span>
          </button>
        )
      })}
    </>
  )
}

function ProviderFooter() {
  const locationStatus = useAppStore((s) => s.locationStatus)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)
  return (
    <footer className={styles.footer}>
      <Chip tone="ok" title="Datos cartográficos © OpenStreetMap contributors">
        OSM
      </Chip>
      <Chip tone="info" title="Servicios públicos de demostración, con límites de uso y sin SLA">
        demo
      </Chip>
      <button type="button" className={styles.footerLink} onClick={() => setSettingsOpen(true)}>
        Proveedores
      </button>
      <span className={styles.footerSpacer} />
      {locationStatus === 'granted' && (
        <Chip tone="accent" dot title="Ubicación disponible">
          Ubicación
        </Chip>
      )}
    </footer>
  )
}

function MobileSheet() {
  const setSheetOpen = useAppStore((s) => s.setMobileSheetOpen)
  const [expanded, setExpanded] = useState(false)
  const sheetRef = useRef<HTMLElement>(null)

  useEffect(() => {
    sheetRef.current?.focus()
  }, [])

  return (
    <aside
      ref={sheetRef}
      id="atlas-sheet"
      tabIndex={-1}
      className={cn(styles.sheet, expanded && styles.sheetExpanded)}
      aria-label="Panel de herramientas"
      onKeyDown={(e) => {
        if (e.key === 'Escape') setSheetOpen(false)
      }}
    >
      <div className={styles.sheetHead}>
        <button
          type="button"
          className={styles.handle}
          aria-label={expanded ? 'Contraer panel' : 'Expandir panel'}
          aria-expanded={expanded}
          aria-controls="atlas-sheet"
          title={expanded ? 'Contraer panel' : 'Expandir panel'}
          onClick={() => setExpanded((value) => !value)}
        >
          <span className={styles.handleBar} aria-hidden="true" />
        </button>
        <div className={styles.sheetTabs} role="tablist" aria-label="Secciones">
          <TabList />
        </div>
        <IconButton label="Cerrar panel" onClick={() => setSheetOpen(false)}>
          <X size={16} />
        </IconButton>
      </div>
      <div className={styles.content}>
        <ActiveTabContent />
      </div>
      <ProviderFooter />
    </aside>
  )
}

/** Panel lateral izquierdo (escritorio) o bottom sheet (móvil). */
export function SidePanel() {
  const collapsed = useAppStore((s) => s.sideCollapsed)
  const toggleCollapsed = useAppStore((s) => s.toggleSideCollapsed)
  const sheetOpen = useAppStore((s) => s.mobileSheetOpen)
  const isMobile = useIsMobile()

  if (isMobile) {
    return sheetOpen ? <MobileSheet /> : null
  }

  return (
    <aside className={cn(styles.panel, collapsed && styles.collapsed)} aria-label="Panel de herramientas">
      <div className={styles.tabs} role="tablist" aria-label="Secciones">
        <TabList />
        <button
          type="button"
          className={styles.collapse}
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expandir panel' : 'Contraer panel'}
          title={collapsed ? 'Expandir panel' : 'Contraer panel'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>
      {!collapsed && (
        <>
          <div className={styles.content}>
            <ActiveTabContent />
          </div>
          <ProviderFooter />
        </>
      )}
    </aside>
  )
}
