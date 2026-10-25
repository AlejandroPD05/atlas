import { Settings2 } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { cn } from '../../utils/cn'
import { PANEL_TABS } from './tabs'
import styles from './MobileNav.module.css'

/** Navegación inferior táctil (solo móvil). */
export function MobileNav() {
  const isMobile = useIsMobile()
  const activeTab = useAppStore((s) => s.activeTab)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const sheetOpen = useAppStore((s) => s.mobileSheetOpen)
  const setSheetOpen = useAppStore((s) => s.setMobileSheetOpen)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)
  const settingsOpen = useAppStore((s) => s.settingsOpen)

  if (!isMobile) return null
  if (settingsOpen) return null

  return (
    <nav className={styles.nav} aria-label="Navegación principal">
      {PANEL_TABS.map((t) => {
        const Icon = t.icon
        const active = activeTab === t.id && sheetOpen
        return (
          <button
            key={t.id}
            type="button"
            className={cn(styles.item, active && styles.itemActive)}
            aria-current={active ? 'true' : undefined}
            onClick={() => {
              if (activeTab === t.id && sheetOpen) {
                setSheetOpen(false)
                return
              }
              setActiveTab(t.id)
              setSheetOpen(true)
            }}
          >
            <Icon size={19} aria-hidden="true" />
            <span className={styles.label}>{t.label}</span>
          </button>
        )
      })}
      <button type="button" className={styles.item} onClick={() => setSettingsOpen(true)}>
        <Settings2 size={19} aria-hidden="true" />
        <span className={styles.label}>Ajustes</span>
      </button>
    </nav>
  )
}
