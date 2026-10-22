import { Compass } from 'lucide-react'
import { EmptyState } from '../../components/ui'
import panel from '../layout/panel.module.css'

/** Pestaña Explorar. En la fase 4 se conecta a Overpass. */
export function ExplorePanel() {
  return (
    <div className={panel.body}>
      <EmptyState
        icon={<Compass size={20} />}
        title="Descubre a tu alrededor"
        hint="Elige una categoría y verás los lugares que existen alrededor del centro del mapa, sobre datos de OpenStreetMap."
      />
    </div>
  )
}
