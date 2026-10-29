# ATLAS

Explorador cartográfico en español: busca lugares reales de OpenStreetMap, planifica rutas con OSRM y explora puntos de interés alrededor del mapa. La interfaz es oscura, cinematográfica y funciona en escritorio y móvil.

ATLAS no inventa datos. Cuando un perfil, un horario o una accesibilidad no se pueden calcular con las fuentes disponibles, la interfaz lo dice y mantiene la ruta real.

**Demo:** <https://atlas-explorador.pages.dev> · **Código:** <https://github.com/AlejandroPD05/atlas>

## Qué incluye

- **Mapa satelital realista por defecto**: imagen real del mundo, etiquetas, relieve 3D, cielo y perspectiva cinematográfica con MapLibre GL. Incluye estilos vectoriales de OpenFreeMap (oscuro y claro) como alternativas y acepta teselas propias.
- **Búsqueda de lugares** con Nominatim (una petición por segundo, sin autocompletado) o Photon opcional (con sugerencias). Incluye cancelación de peticiones, estados de carga, vacío y error.
- **Ficha de lugar** con dirección, coordenadas, contacto publicado en OSM, enlace al registro original, centrado en el mapa, guardado y acciones de ruta.
- **Planificador de rutas** con origen, destino y hasta cuatro paradas reordenables. Permite elegir puntos sobre el mapa, borrar puntos y comparar alternativas reales de OSRM.
- **Exportación de rutas** en GPX y GeoJSON con la geometría, las paradas y los datos devueltos por OSRM. No se añaden tiempos de tráfico ni datos inventados.
- **Pasos de viaje en español**, distancia, duración y geometría de la ruta seleccionada.
- **Perfiles honestos**: «Rápida» usa la ruta más rápida de OSRM. «Económica», «Tranquila», «Escénica», «Accesible» y «Explorar» explican por qué no hay datos para calcularlos; no se simulan.
- **Explorar** puntos de interés por categorías con Overpass, con radio de búsqueda configurable (500 m, 1,5 km o 3 km). El radio también se aplica a las búsquedas por categoría desde Buscar. Los resultados se agrupan con clustering real de MapLibre; al pulsar un grupo el mapa se acerca para separarlo.
- **Guardados locales** en colecciones versionadas: crear, renombrar, eliminar, quitar lugares, abrir la ficha y trazar una ruta.
- **Ajustes** de unidades, movimiento reducido y capa de POI.
- **Diseño responsive**: panel lateral colapsable en escritorio; bottom sheet de dos alturas en móvil, con arrastre desde el handle, clic y teclado, más navegación inferior. Nunca se muestran todos los paneles a la vez.
- **Accesibilidad básica**: navegación por teclado, etiquetas ARIA, foco visible, cierre con Escape y respeto a `prefers-reduced-motion`. El handle del bottom sheet responde a las flechas y conserva la activación con `Enter` y `Espacio`.

## Datos y honestidad

| Dato | Origen | Estado |
| --- | --- | --- |
| Lugares, direcciones y POI | OpenStreetMap (Nominatim, Photon u Overpass) | Real, con la disponibilidad del servicio público |
| Mapa base satelital | Esri World Imagery + etiquetas OpenFreeMap + AWS Terrain Tiles | Imagen real; atribución en el mapa |
| Etiquetas sobre satélite | OpenFreeMap / OpenMapTiles / OpenStreetMap | Reales; se dibujan como capas vectoriales propias |
| Relieve 3D | Modelo digital de elevación (DEM) | Real; la inclinación y el terreno dependen del DEM |
| Mapas vectoriales alternativos | OpenFreeMap / OpenMapTiles / OSM | Reales; atribución en el mapa |
| Ruta más rápida y alternativa | OSRM | Real; la alternativa solo existe si OSRM la devuelve |
| Tráfico, peajes, combustible, ruido, accesibilidad, horarios de apertura | — | **Desconocido**. No se estima ni se inventa |
| Perfiles económico, tranquilo, escénico, accesible y explorar | — | **No disponibles** con los datos actuales |
| Transporte público | — | **Sin proveedor** configurado |
| Rutas a pie y en bici | — | Solo si se configura `VITE_ROUTING_URL_WALK` / `VITE_ROUTING_URL_BIKE` |
| Guardados | Almacenamiento local del navegador | Copia local; no se sincroniza ni se actualiza sola |

Los servicios por defecto son públicos y de demostración: pueden limitar peticiones, tardar o fallar. La aplicación muestra el error y no rellena los huecos con datos falsos.

## Stack

- React 19 + TypeScript estricto + Vite 8
- MapLibre GL JS 6
- CSS Modules y tokens propios (sin Tailwind)
- Zustand con persistencia de preferencias, guardados y ajustes
- Lucide React para iconografía
- Vitest + Testing Library
- OSRM, Nominatim/Photon y Overpass vía HTTP configurable

## Puesta en marcha

Requiere Node.js 20.19+ o 22.12+ y npm.

```bash
npm install
npm run dev
```

- Desarrollo: <http://127.0.0.1:5175>
- Build de producción: `npm run build`
- Vista previa del build: `npm run preview` → <http://127.0.0.1:5176>
- Producción: <https://atlas-explorador.pages.dev>

### Despliegue

El sitio se publica en Cloudflare Pages con el proyecto `atlas-explorador`:

```bash
npm run deploy
```

El comando construye, sube `dist/` y publica en la rama de producción `main`. Las cabeceras
(CSP, HSTS, caché) y el fallback de la SPA viven en `public/_headers` y `public/_redirects`, así
que Vite los copia a `dist/` en cada build. La configuración de Pages está en `wrangler.toml`.

Sigue siendo un despliegue de demostración: la imagen satelital de Esri no está licenciada para uso
comercial y los proveedores públicos no tienen SLA. Para un dominio propio o tráfico real, consulta
[`docs/PRODUCTION.md`](docs/PRODUCTION.md).

El proyecto no contiene claves ni secretos. Copia `.env.example` a `.env` solo si quieres cambiar de proveedor.

### Variables de entorno

| Variable | Uso | Valor por defecto |
| --- | --- | --- |
| `VITE_STYLE_SATELLITE_URL` | Estilo satelital completo (sustituye a las teselas) | — |
| `VITE_TILES_SATELLITE_URL` | Teselas de imagen satelital | Esri World Imagery |
| `VITE_TILES_SATELLITE_ATTRIBUTION` | Atribución de la imagen satelital | Esri / Maxar / Earthstar |
| `VITE_TILES_SATELLITE_LABELS_URL` | Etiquetas raster opcionales sobre satélite | Etiquetas vectoriales de OpenFreeMap |
| `VITE_TILES_SATELLITE_LABELS_ATTRIBUTION` | Atribución de esas etiquetas raster | — |
| `VITE_TERRAIN_DEM_URL` | Teselas DEM para el relieve 3D | AWS Terrain Tiles (Terrarium) |
| `VITE_TERRAIN_ATTRIBUTION` | Atribución del relieve | Mapzen / AWS |
| `VITE_STYLE_DARK_URL` | Estilo vectorial oscuro | `https://tiles.openfreemap.org/styles/dark` |
| `VITE_STYLE_LIGHT_URL` | Estilo vectorial claro | `https://tiles.openfreemap.org/styles/positron` |
| `VITE_TILES_DARK_URL` | Teselas raster oscuras (prioritarias) | — |
| `VITE_TILES_LIGHT_URL` | Teselas raster claras (prioritarias) | — |
| `VITE_TILES_ATTRIBUTION` | Atribución de teselas vectoriales propias | `© OpenStreetMap contributors` |
| `VITE_GEOCODING_PROVIDER` | `nominatim` o `photon` | `nominatim` |
| `VITE_GEOCODING_URL` | Servidor de geocodificación | Nominatim público |
| `VITE_ROUTING_URL` | OSRM para coche | `https://router.project-osrm.org` |
| `VITE_ROUTING_URL_WALK` | OSRM para rutas a pie | — |
| `VITE_ROUTING_URL_BIKE` | OSRM para rutas en bici | — |
| `VITE_OVERPASS_URL` | Consultas de POI | `https://overpass-api.de/api/interpreter` |

Si usas servicios públicos, respeta sus políticas: Nominatim no permite autocompletado y limita a una petición por segundo; Overpass y el OSRM de demo tienen límites y no ofrecen SLA. Para producción, configura servidores propios.

Las variables `VITE_*` se compilan en el JavaScript público: no pongas secretos. La guía de despliegue, CSP, caché, licencias y smoke test está en [`docs/PRODUCTION.md`](docs/PRODUCTION.md).

## Verificación

```bash
npm run lint
npm test
npm run build
```

Estado comprobado en esta versión:

- 74 pruebas en 15 archivos, todas pasando.
- `tsc --noEmit`, ESLint y build de producción pasando.
- MapLibre se carga en un chunk diferido; el bundle inicial queda en ~346 kB (109 kB gzip). El chunk de MapLibre (~1,06 MB, 288 kB gzip) y su worker (518 kB) solo se descargan para el mapa.
- Verificado en navegador de escritorio (1440×900): mapa satelital con etiquetas vectoriales, atribución completa, cambio Satélite / Oscuro / Claro y diálogo de Ajustes completo (520×750) sin recortes. La brújula vuelve al pitch 55° del mapa base y se oculta cuando la cámara está en la referencia. El relieve 3D se comprobó en zona montañosa.
- Verificado en navegador móvil (390×844): mapa satelital, atribución compacta que no tapa los controles, selector de capas, bottom sheet de búsqueda con alturas media/expandida, arrastre con snap y supresión del clic posterior, ajustes modales con scroll y planificador.
- Verificado a 320×568: pestañas del sheet en columna y etiquetas de la nav móvil completas, sin recortes.
- Verificado en navegador: clustering de POI, contador de grupo, expansión al pulsar, selección de un punto, visibilidad de la capa, guardado de un lugar, ficha, ruta desde un guardado, renombrar y eliminar colecciones.
- Integración automatizada del bottom sheet (clic, arrastre, snap, supresión del clic posterior, teclado y reapertura) y de la cámara (brújula y restauración del pitch). La comprobación en un teléfono físico sigue siendo manual.
- Build de producción servido con `npm run preview`: raíz y ruta desconocida devuelven la SPA; el selector de radio se comprobó a 1440×900 y 390×844 y persiste en `localStorage`. La exportación está cubierta por pruebas de serialización y descarga, sin abrir un visor externo.
- Desplegado en <https://atlas-explorador.pages.dev> (Cloudflare Pages): raíz y ruta desconocida devuelven `200` con la SPA, la CSP y las cabeceras se aplican, el mapa satelital carga, la búsqueda real de «Museo del Prado» devuelve su ficha y OSRM calcula una ruta de 17 pasos sin errores de consola.

El aviso de Vite sobre el tamaño del chunk de MapLibre es esperado: es una librería grande que se descarga de forma diferida y no forma parte del arranque inicial de la interfaz.

## Estructura

```text
src/
  app/            composición, configuración de proveedores
  components/     UI compartida, toasts
  features/
    explore/      categorías, consulta Overpass, panel de POI
    layout/       topbar, panel lateral, navegación móvil
    map/          MapLibre, capas, clustering, controles
    places/       ficha contextual
    routes/       planificador, perfiles, pasos
    saved/        colecciones locales
    search/       búsqueda y sugerencias
    settings/     diálogo de ajustes
  services/       clientes HTTP de geocoding, routing y POI
  store/          estado Zustand y persistencia versionada
  styles/         tokens y estilos base
  test/           setup de Vitest
  types/          dominio tipado
  utils/          formato, geometría, descarga y utilidades
docs/
  PRODUCTION.md   despliegue, CSP, licencias y smoke test
```

## Atribución

- Imagen satelital: [Esri World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9) · © Esri, Maxar, Earthstar Geographics y la comunidad de usuarios SIG.
- Etiquetas sobre satélite: [OpenFreeMap](https://openfreemap.org) · © OpenMapTiles · © OpenStreetMap contributors.
- Relieve: [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) · datos de Mapzen.
- Mapa vectorial alternativo: [OpenFreeMap](https://openfreemap.org) · © OpenMapTiles · Datos © OpenStreetMap contributors.
- Datos geográficos: © OpenStreetMap contributors, disponibles bajo ODbL.
- Routing: [OSRM](https://project-osrm.org).
- Geocodificación: [Nominatim](https://nominatim.org) o [Photon](https://photon.komoot.io).
- MapLibre GL JS: licencia BSD de 3 cláusulas.

La referencia visual de este proyecto es solo estética. No se ha copiado código, assets ni branding de otras aplicaciones.

## Limitaciones conocidas

- Solo la ruta más rápida de OSRM es real. Los perfiles temáticos no se calculan porque faltan datos de tráfico, coste, ruido, paisaje o accesibilidad.
- El OSRM público de demostración solo sirve rutas en coche. Sin servidores propios, a pie y en bici aparecen desactivados; transporte público no está implementado.
- Overpass público puede responder con `502`, timeout o resultados vacíos. La UI lo explica y permite reintentar; no hay datos de reserva.
- Las alternativas de ruta solo se muestran si OSRM las devuelve. No se generan variantes artificiales.
- Los guardados son locales: no hay cuentas, sincronización entre dispositivos ni actualización automática de los datos de OSM.
- Los horarios, teléfonos y webs de las fichas solo aparecen si OSM los publica; no se verifican.
- La capa de POI no se refresca automáticamente al mover el mapa: hay que pulsar «Buscar aquí» en Explorar.
- El mapa no está pensado como navegación giro a giro en tiempo real; no hay voz, tráfico en vivo ni recálculo por desvío.
- El modo satelital usa imagen 2D proyectada sobre un DEM. No es fotogrametría 3D global: para edificios y ciudades fotorrealistas en 3D hace falta un proveedor licenciado con clave (por ejemplo, Google Photorealistic 3D Tiles o un estilo satelital 3D de MapTiler/Mapbox) y asumir sus costes y términos.
- Esri World Imagery, OpenFreeMap y AWS Terrain Tiles se usan aquí como servicios públicos de demostración, con atribución visible. Para producción hay que revisar sus licencias y configurar un proveedor propio con `VITE_STYLE_SATELLITE_URL` o las variables `VITE_TILES_SATELLITE_*`.
