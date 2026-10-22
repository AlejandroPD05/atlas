import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

/* Vite emite el worker de MapLibre como asset propio. Sin esta URL, el
   worker interno se resuelve mal en el build y el mapa no carga en producción. */
setWorkerUrl(workerUrl)
