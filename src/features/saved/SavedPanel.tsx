import { Bookmark } from 'lucide-react'
import { EmptyState } from '../../components/ui'
import panel from '../layout/panel.module.css'

/** Pestaña Guardados. En la fase 4 se completan colecciones y persistencia. */
export function SavedPanel() {
  return (
    <div className={panel.body}>
      <EmptyState
        icon={<Bookmark size={20} />}
        title="Tus sitios, en colecciones"
        hint="Guarda lugares desde su ficha y organízalos en colecciones como «Escapadas» o «Comer». Todo se guarda en este navegador."
      />
    </div>
  )
}
