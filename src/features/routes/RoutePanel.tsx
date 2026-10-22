import { Route } from 'lucide-react'
import { EmptyState } from '../../components/ui'
import panel from '../layout/panel.module.css'

/** Pestaña Ruta. En la fase 3 se conecta al proveedor de routing. */
export function RoutePanel() {
  return (
    <div className={panel.body}>
      <EmptyState
        icon={<Route size={20} />}
        title="Planifica tu viaje"
        hint="Origen, destino y hasta cuatro paradas. Después podrás elegir cómo quieres vivir la ruta: rápida, tranquila, escénica…"
      />
    </div>
  )
}
