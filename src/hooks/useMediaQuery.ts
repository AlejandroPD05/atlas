import { useEffect, useState } from 'react'

/** Suscripción a una media query CSS desde React. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

/** Punto de corte móvil único de la aplicación. */
export const MOBILE_QUERY = '(max-width: 860px)'

export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_QUERY)
}
