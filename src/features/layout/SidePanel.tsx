import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
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

/* Valores sincronizados con SidePanel.module.css. */
const SHEET_BOTTOM_OFFSET = 84
const SHEET_MEDIUM_RATIO = 0.58
const SHEET_EXPANDED_RATIO = 0.78
const SHEET_MEDIUM_MAX = 500
const SHEET_EXPANDED_MAX = 640
const DRAG_THRESHOLD = 4

interface SheetDrag {
  pointerId: number
  startY: number
  startHeight: number
  startExpanded: boolean
  currentHeight: number
  mediumHeight: number
  expandedHeight: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

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
  const [dragHeight, setDragHeight] = useState<number | null>(null)
  const sheetRef = useRef<HTMLElement>(null)
  const dragRef = useRef<SheetDrag | null>(null)
  const didDragRef = useRef(false)
  const dragClickTimerRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    sheetRef.current?.focus()
    return () => {
      if (dragClickTimerRef.current !== undefined) window.clearTimeout(dragClickTimerRef.current)
    }
  }, [])

  const onHandlePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return
    const sheet = sheetRef.current
    if (!sheet) return

    const viewportHeight = window.visualViewport?.height ?? window.innerHeight
    const maxHeight = Math.max(0, viewportHeight - SHEET_BOTTOM_OFFSET)
    const mediumHeight = Math.min(viewportHeight * SHEET_MEDIUM_RATIO, SHEET_MEDIUM_MAX, maxHeight)
    const expandedHeight = Math.min(viewportHeight * SHEET_EXPANDED_RATIO, SHEET_EXPANDED_MAX, maxHeight)
    const startHeight = sheet.getBoundingClientRect().height

    dragRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      startHeight,
      startExpanded: expanded,
      currentHeight: startHeight,
      mediumHeight,
      expandedHeight,
    }
    if (dragClickTimerRef.current !== undefined) {
      window.clearTimeout(dragClickTimerRef.current)
      dragClickTimerRef.current = undefined
    }
    didDragRef.current = false
    setDragHeight(startHeight)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onHandlePointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return

    const delta = e.clientY - drag.startY
    if (!didDragRef.current && Math.abs(delta) < DRAG_THRESHOLD) return
    didDragRef.current = true

    const next = clamp(drag.startHeight - delta, drag.mediumHeight, drag.expandedHeight)
    drag.currentHeight = next
    setDragHeight(next)
  }

  const endDrag = (e: ReactPointerEvent<HTMLButtonElement>, cancelled: boolean) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }

    if (cancelled) {
      setExpanded(drag.startExpanded)
    } else if (didDragRef.current) {
      const midpoint = (drag.mediumHeight + drag.expandedHeight) / 2
      setExpanded(drag.currentHeight > midpoint)
    }

    if (didDragRef.current) {
      /* El click posterior al arrastre no debe alternar otra vez. Si el
         navegador no lo emite, el siguiente click vuelve a funcionar. */
      if (dragClickTimerRef.current !== undefined) window.clearTimeout(dragClickTimerRef.current)
      dragClickTimerRef.current = window.setTimeout(() => {
        didDragRef.current = false
        dragClickTimerRef.current = undefined
      }, 300)
    }

    dragRef.current = null
    setDragHeight(null)
  }

  const onHandleClick = () => {
    if (didDragRef.current) {
      didDragRef.current = false
      if (dragClickTimerRef.current !== undefined) {
        window.clearTimeout(dragClickTimerRef.current)
        dragClickTimerRef.current = undefined
      }
      return
    }
    setExpanded((value) => !value)
  }

  const onHandleKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      /* Si el último gesto fue un arrastre cancelado, la activación
         por teclado debe seguir funcionando. */
      didDragRef.current = false
      return
    }
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    setExpanded(e.key === 'ArrowUp')
  }

  return (
    <aside
      ref={sheetRef}
      id="atlas-sheet"
      tabIndex={-1}
      className={cn(
        styles.sheet,
        expanded && styles.sheetExpanded,
        dragHeight !== null && styles.sheetDragging,
      )}
      style={dragHeight === null ? undefined : { height: dragHeight }}
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
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={(e) => endDrag(e, false)}
          onPointerCancel={(e) => endDrag(e, true)}
          onClick={onHandleClick}
          onKeyDown={onHandleKeyDown}
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
