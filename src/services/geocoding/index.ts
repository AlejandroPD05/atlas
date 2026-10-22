import { appConfig } from '../../app/config'
import { createNominatimGeocoder } from './nominatim'
import { createPhotonGeocoder } from './photon'
import type { Geocoder } from './types'

/** Proveedor de geocoding activo según la configuración. */
export const geocoder: Geocoder =
  appConfig.geocoding.provider === 'photon'
    ? createPhotonGeocoder(appConfig.geocoding.url, appConfig.geocoding.isDemo)
    : createNominatimGeocoder(appConfig.geocoding.url, appConfig.geocoding.isDemo)

export type { Geocoder, GeocoderSearchOptions } from './types'
