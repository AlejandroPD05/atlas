import { useCallback } from 'react'
import { useAppStore } from '../store/appStore'

/* Geolocalización bajo demanda y con explicaciones claras.
   El permiso se pide solo cuando el usuario pulsa «Mi ubicación». */

export interface GeolocationController {
  status: 'idle' | 'requesting' | 'granted' | 'denied' | 'error'
  coords: { lng: number; lat: number } | null
  request: () => void
}

export function useGeolocation(): GeolocationController {
  const status = useAppStore((s) => s.locationStatus)
  const coords = useAppStore((s) => s.userLocation)

  const request = useCallback(() => {
    const store = useAppStore.getState()

    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      store.setLocationStatus('error')
      store.pushNotice({
        kind: 'error',
        title: 'Este navegador no ofrece geolocalización',
        detail: 'Puedes buscar tu dirección manualmente.',
      })
      return
    }

    store.setLocationStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        store.setUserLocation({ lng: pos.coords.longitude, lat: pos.coords.latitude })
        store.setLocationStatus('granted')
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          store.setLocationStatus('denied')
          store.pushNotice({
            kind: 'warn',
            title: 'Ubicación bloqueada',
            detail:
              'Has denegado el permiso. Puedes habilitarlo en los ajustes del navegador para este sitio.',
          })
        } else {
          store.setLocationStatus('error')
          store.pushNotice({
            kind: 'error',
            title: 'No se pudo obtener tu ubicación',
            detail: 'El servicio de localización no respondió. Inténtalo de nuevo.',
          })
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }, [])

  return { status, coords, request }
}
