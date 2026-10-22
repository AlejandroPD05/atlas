import { useMemo, useState } from 'react'
import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Navigation,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'
import { Button, EmptyState, Eyebrow, IconButton, Input } from '../../components/ui'
import { useAppStore } from '../../store/appStore'
import type { Place, SavedCollection, SavedPlace } from '../../types/domain'
import { categoryLabel } from '../explore/categories'
import { CategoryIcon } from '../explore/categoryIcons'
import { getMapInstance } from '../map/mapInstance'
import { uid } from '../../utils/id'
import styles from './SavedPanel.module.css'

function savedToPlace(saved: SavedPlace): Place {
  return {
    id: saved.id,
    name: saved.name,
    category: saved.category,
    ...(saved.address ? { address: saved.address } : {}),
    coords: saved.coords,
    source: 'osm',
    quality: 'real',
  }
}

function CollectionBlock({
  collection,
  initiallyOpen,
}: {
  collection: SavedCollection
  initiallyOpen: boolean
}) {
  const [open, setOpen] = useState(initiallyOpen)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(collection.name)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const renameCollection = useAppStore((s) => s.renameCollection)
  const deleteCollection = useAppStore((s) => s.deleteCollection)
  const removePlaceFromCollection = useAppStore((s) => s.removePlaceFromCollection)
  const selectPlace = useAppStore((s) => s.selectPlace)
  const setRouteDestination = useAppStore((s) => s.setRouteDestination)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const setMobileSheetOpen = useAppStore((s) => s.setMobileSheetOpen)

  const listId = `saved-list-${collection.id}`

  const closeOnMobile = () => {
    if (window.matchMedia('(max-width: 860px)').matches) setMobileSheetOpen(false)
  }

  const openPlace = (place: SavedPlace) => {
    selectPlace(savedToPlace(place))
    const map = getMapInstance()
    if (map) {
      map.flyTo({
        center: [place.coords.lng, place.coords.lat],
        zoom: Math.max(map.getZoom(), 16),
        duration: useAppStore.getState().prefs.reduceMotion ? 0 : 700,
      })
    }
    closeOnMobile()
  }

  const routeTo = (place: SavedPlace) => {
    setRouteDestination({
      id: uid('endpoint'),
      kind: 'destination',
      label: place.name,
      coords: place.coords,
      placeId: place.id,
    })
    setActiveTab('route')
    closeOnMobile()
  }

  const saveName = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    renameCollection(collection.id, trimmed)
    setEditing(false)
  }

  return (
    <section className={styles.collection} aria-label={`Colección ${collection.name}`}>
      <div className={styles.collectionHead}>
        <button
          type="button"
          className={styles.collectionToggle}
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <FolderPlus size={14} className={styles.folderIcon} aria-hidden="true" />
          <span className={styles.collectionName}>{collection.name}</span>
          <span className={styles.count}>{collection.places.length}</span>
        </button>
        <div className={styles.collectionActions}>
          {!editing && (
            <IconButton
              label={`Renombrar ${collection.name}`}
              className={styles.smallAction}
              onClick={() => {
                setName(collection.name)
                setEditing(true)
              }}
            >
              <Pencil size={13} />
            </IconButton>
          )}
          {!confirmDelete && (
            <IconButton
              label={`Eliminar ${collection.name}`}
              className={styles.smallAction}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={13} />
            </IconButton>
          )}
        </div>
      </div>

      {editing && (
        <form
          className={styles.inlineForm}
          onSubmit={(event) => {
            event.preventDefault()
            saveName()
          }}
        >
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-label={`Nuevo nombre para ${collection.name}`}
            maxLength={40}
            autoFocus
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setEditing(false)
                setName(collection.name)
              }
            }}
          />
          <Button type="submit" variant="primary" small icon={<Check size={13} />}>
            Guardar
          </Button>
          <Button
            variant="ghost"
            small
            icon={<X size={13} />}
            onClick={() => {
              setEditing(false)
              setName(collection.name)
            }}
          >
            Cancelar
          </Button>
        </form>
      )}

      {confirmDelete && (
        <div className={styles.confirm} role="group" aria-label={`Confirmar eliminación de ${collection.name}`}>
          <p>
            ¿Eliminar «{collection.name}»{collection.places.length > 0 ? ` y sus ${collection.places.length} lugares` : ''}?
          </p>
          <div className={styles.confirmActions}>
            <Button
              variant="danger"
              small
              onClick={() => {
                deleteCollection(collection.id)
                setConfirmDelete(false)
              }}
            >
              Eliminar
            </Button>
            <Button variant="ghost" small onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {open && (
        <div id={listId}>
          {collection.places.length === 0 ? (
            <p className={styles.emptyCollection}>
              Aún no hay lugares aquí. Abre una ficha en el mapa y pulsa «Guardar».
            </p>
          ) : (
            <ul className={styles.places}>
              {collection.places.map((place) => (
                <li key={place.id} className={styles.placeRow}>
                  <button
                    type="button"
                    className={styles.placeMain}
                    onClick={() => openPlace(place)}
                    aria-label={`Ver ${place.name} en el mapa`}
                  >
                    <span className={styles.placeIcon}>
                      <CategoryIcon id={place.category} size={14} />
                    </span>
                    <span className={styles.placeText}>
                      <span className={styles.placeName}>{place.name}</span>
                      <span className={styles.placeSub}>
                        {categoryLabel(place.category)}
                        {place.address ? ` · ${place.address}` : ''}
                      </span>
                    </span>
                    <ChevronRight size={14} className={styles.chevron} aria-hidden="true" />
                  </button>
                  <div className={styles.placeActions}>
                    <IconButton
                      label={`Cómo llegar a ${place.name}`}
                      className={styles.smallAction}
                      onClick={() => routeTo(place)}
                    >
                      <Navigation size={13} />
                    </IconButton>
                    <IconButton
                      label={`Quitar ${place.name} de ${collection.name}`}
                      className={styles.smallAction}
                      onClick={() => removePlaceFromCollection(collection.id, place.id)}
                    >
                      <X size={13} />
                    </IconButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}

/** Pestaña Guardados: colecciones locales, sin cuentas ni sincronización. */
export function SavedPanel() {
  const collections = useAppStore((s) => s.collections)
  const createCollection = useAppStore((s) => s.createCollection)
  const pushNotice = useAppStore((s) => s.pushNotice)
  const [newName, setNewName] = useState('')

  const total = useMemo(
    () => collections.reduce((sum, collection) => sum + collection.places.length, 0),
    [collections],
  )

  const create = () => {
    const name = newName.trim()
    if (!name) return
    if (collections.some((c) => c.name.toLocaleLowerCase('es') === name.toLocaleLowerCase('es'))) {
      pushNotice({
        kind: 'warn',
        title: 'Esa colección ya existe',
        detail: 'Elige otro nombre para no mezclar lugares.',
      })
      return
    }
    createCollection(name)
    setNewName('')
  }

  return (
    <div className={styles.root}>
      <header className={styles.head}>
        <Eyebrow>Guardados</Eyebrow>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Tus sitios</h2>
          <span className={styles.total}>{total}</span>
        </div>
        <p className={styles.intro}>
          Colecciones guardadas solo en este navegador. Puedes abrir un lugar, trazar una ruta
          hasta él o quitarlo sin borrar la colección.
        </p>
      </header>

      <form
        className={styles.createForm}
        onSubmit={(event) => {
          event.preventDefault()
          create()
        }}
      >
        <Input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Nueva colección (p. ej. «Escapadas»)"
          aria-label="Nombre de la nueva colección"
          maxLength={40}
        />
        <Button type="submit" variant="outline" small icon={<FolderPlus size={13} />} disabled={!newName.trim()}>
          Crear
        </Button>
      </form>

      {collections.length === 0 ? (
        <EmptyState
          icon={<Bookmark size={20} />}
          title="Sin colecciones todavía"
          hint="Crea una colección arriba y guarda lugares desde su ficha en el mapa."
        />
      ) : (
        <div className={styles.collections}>
          {collections.map((collection, index) => (
            <CollectionBlock
              key={collection.id}
              collection={collection}
              initiallyOpen={index === 0 || collection.places.length > 0}
            />
          ))}
        </div>
      )}

      <p className={styles.footnote}>
        Los guardados son una copia local de datos de OpenStreetMap. Si el lugar cambia en la
        fuente, esta copia no se actualiza automáticamente. No hay cuentas ni sincronización.
      </p>
    </div>
  )
}
