import { Clock3, RotateCcw, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { geocoder } from '../../services/geocoding'
import type { Place } from '../../types/domain'
import { cn } from '../../utils/cn'
import { CategoryIcon } from '../explore/categoryIcons'
import { IconButton, Input } from '../../components/ui'
import { useSearchController } from './useSearchController'
import styles from './SearchBar.module.css'

interface SuggestionAction {
  key: string
  label: string
  sub?: string
  kind: 'place' | 'recent'
  place?: Place
  term?: string
}

/** Búsqueda global con sugerencias accesibles (combobox + listbox). */
export function SearchBar() {
  const query = useAppStore((s) => s.searchQuery)
  const setQuery = useAppStore((s) => s.setSearchQuery)
  const clearSearch = useAppStore((s) => s.clearSearch)
  const recents = useAppStore((s) => s.recentSearches)
  const { runSearch, selectResult, supportsSuggestions, providerLabel } = useSearchController()

  const debounced = useDebouncedValue(query, 650)
  const [suggestions, setSuggestions] = useState<Place[]>([])
  const [suggestionsFor, setSuggestionsFor] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  /* Sugerencias en vivo solo si el proveedor lo permite (Photon). */
  useEffect(() => {
    if (!supportsSuggestions) return
    const q = debounced.trim()
    if (q.length < 3) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    geocoder
      .search(q, {
        signal: ctrl.signal,
        limit: 5,
        near: useAppStore.getState().userLocation ?? undefined,
      })
      .then((places) => {
        if (!ctrl.signal.aborted) {
          setSuggestions(places)
          setSuggestionsFor(q)
          setActive(-1)
        }
      })
      .catch(() => {
        if (!ctrl.signal.aborted) {
          setSuggestions([])
          setSuggestionsFor('')
        }
      })
    return () => {
      ctrl.abort()
    }
  }, [debounced, supportsSuggestions])

  /* Recientes locales mientras se escribe (sin peticiones). */
  const localMatches = useMemo(() => {
    if (supportsSuggestions) return []
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    return recents.filter((r) => r.toLowerCase().includes(q)).slice(0, 4)
  }, [query, recents, supportsSuggestions])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const actions: SuggestionAction[] = useMemo(() => {
    /* Solo mostramos sugerencias que correspondan al texto actual:
       evita ofrecer resultados obsoletos mientras llega el debounce. */
    const freshSuggestions = supportsSuggestions && query.trim() === suggestionsFor ? suggestions : []
    const places: SuggestionAction[] = freshSuggestions.map((p) => ({
      key: p.id,
      label: p.name,
      ...(p.address ? { sub: p.address } : {}),
      kind: 'place',
      place: p,
    }))
    const local: SuggestionAction[] = localMatches.map((r) => ({
      key: `recent-${r}`,
      label: r,
      sub: 'Búsqueda reciente',
      kind: 'recent',
      term: r,
    }))
    return [...places, ...local]
  }, [suggestions, suggestionsFor, query, supportsSuggestions, localMatches])

  const showList = open && actions.length > 0

  const chooseAction = (action: SuggestionAction) => {
    setOpen(false)
    setActive(-1)
    if (action.kind === 'place' && action.place) {
      setQuery(action.place.name)
      selectResult({ id: action.place.id, place: action.place })
    } else if (action.term) {
      setQuery(action.term)
      void runSearch(action.term)
    }
  }

  const submit = () => {
    setOpen(false)
    if (active >= 0 && actions[active]) {
      chooseAction(actions[active])
      return
    }
    setActive(-1)
    void runSearch()
  }

  return (
    <div className={styles.wrap} ref={rootRef}>
      <Input
        icon={<Search size={15} />}
        value={query}
        placeholder="Busca direcciones, lugares o categorías…"
        aria-label="Buscar en el mapa"
        role="combobox"
        aria-expanded={showList}
        aria-controls="atlas-search-suggestions"
        aria-autocomplete={supportsSuggestions ? 'list' : 'none'}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setActive(-1)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setOpen(true)
            setActive((i) => Math.min(i + 1, actions.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((i) => Math.max(i - 1, -1))
          } else if (e.key === 'Enter') {
            e.preventDefault()
            submit()
          } else if (e.key === 'Escape') {
            setOpen(false)
          }
        }}
        trailing={
          query ? (
            <IconButton
              label="Limpiar búsqueda"
              onClick={() => {
                clearSearch()
                setSuggestions([])
                setOpen(false)
              }}
            >
              <X size={14} />
            </IconButton>
          ) : undefined
        }
      />

      {showList && (
        <div
          className={styles.dropdown}
          id="atlas-search-suggestions"
          role="listbox"
          aria-label="Sugerencias de búsqueda"
        >
          {actions.map((action, i) => (
            <button
              key={action.key}
              type="button"
              role="option"
              aria-selected={active === i}
              className={cn(styles.item, active === i && styles.itemActive)}
              onMouseEnter={() => setActive(i)}
              onClick={() => chooseAction(action)}
            >
              <span className={styles.itemIcon}>
                {action.kind === 'place' && action.place ? (
                  <CategoryIcon id={action.place.category} size={15} />
                ) : (
                  <RotateCcw size={14} />
                )}
              </span>
              <span className={styles.itemText}>
                <span className={styles.itemName}>{action.label}</span>
                {action.sub && <span className={styles.itemSub}>{action.sub}</span>}
              </span>
              {action.kind === 'recent' && <Clock3 size={12} className={styles.itemClock} />}
            </button>
          ))}
          <p className={styles.foot}>
            {supportsSuggestions
              ? `Sugerencias en vivo · ${providerLabel} / OpenStreetMap`
              : `Intro para buscar · ${providerLabel} / OpenStreetMap`}
          </p>
        </div>
      )}
    </div>
  )
}
