import { Bookmark, Compass, Route, Search } from 'lucide-react'
import type { PanelTab } from '../../store/appStore'

export interface PanelTabDef {
  id: PanelTab
  label: string
  icon: typeof Search
}

export const PANEL_TABS: PanelTabDef[] = [
  { id: 'search', label: 'Buscar', icon: Search },
  { id: 'route', label: 'Ruta', icon: Route },
  { id: 'explore', label: 'Explorar', icon: Compass },
  { id: 'saved', label: 'Guardados', icon: Bookmark },
]
