# PROGRESS — ATLAS

> Documento de continuidad para retomar el proyecto sin perder contexto.
> Adjunta o pega este archivo al inicio de la nueva conversación.

- **Fecha de corte:** 2026-10-28
- **Proyecto:** `C:\Users\OneCu\Desktop\Personal\Yo\Profesional\Proyectos personales\atlas`
- **Último commit funcional:** `9d9908d feat(routes): exportar la ruta en gpx y geojson`; el despliegue y su configuración van en el commit de cierre.
- **Documentación:** este `PROGRESS.md` se actualiza en el commit de cierre posterior.
- **Estado:** fase 5 y calidad cerradas (radio de POI, exportación de rutas y pruebas de integración). Publicado en Cloudflare Pages como demostración: <https://atlas-explorador.pages.dev>. Dominio propio, licencias de mapas y validación en teléfono físico siguen pendientes.
- **Servidor de desarrollo:** detenido al cerrar la sesión. Arrancar con `npm run dev` en el puerto 5175.

---

## 1. Objetivo

ATLAS es una aplicación web en español que funciona como alternativa funcional a Google Maps:

- Mapa dominante, navegable y realista.
- Búsqueda de lugares reales.
- Ficha de lugar.
- Planificación de rutas con paradas.
- Exploración de puntos de interés alrededor del mapa.
- Guardados con colecciones.
- Ajustes de usuario.
- Experiencia responsive: panel lateral en escritorio, bottom sheet en móvil.
- Estética oscura y cinematográfica inspirada en HorizonX, sin copiar código, assets, branding ni contenido.

Requisitos no negociables:

- React + TypeScript estricto + Vite.
- CSS Modules y design tokens.
- MapLibre GL para el mapa.
- Proveedores configurables por `.env`, sin secretos en el repositorio.
- Atribución visible y respeto a límites de servicios públicos.
- No simular datos: ni tráfico, ni accesibilidad, ni horarios, ni precios, ni tiempos, ni perfiles.
- Perfiles honestos: solo «Rápida» tiene datos reales de OSRM. A pie y bici quedan deshabilitados si no hay servidor configurado.
- Nunca mostrar todos los paneles a la vez.

---

## 2. Estado actual

### 2.1. Fases 1–4 y rediseño satelital: completados

Fases 1–4 y rediseño satelital: commit `9e82604`. Pulido visual: commits `8159f42` y `1695181`.

Incluye:

- Búsqueda real con Nominatim.
- Photon opcional para sugerencias, activable por `.env`.
- Cancelación de peticiones, estados de carga, vacío y error.
- Ficha de lugar con dirección, coordenadas, contacto publicado en OSM, enlace al registro original, centrado en el mapa, guardado y acciones de ruta.
- Planificador de rutas con origen, destino y hasta cuatro paradas reordenables.
- Alternativas reales de OSRM, pasos e indicaciones.
- Perfiles honestos: solo «Rápida» usa OSRM público; a pie/bici solo si se configura un servidor propio.
- Explorar/POI con Overpass: categorías, consulta, clustering, contador de grupo, expansión y selección.
- Guardados locales con colecciones, renombrar y eliminar.
- Ajustes de usuario.
- Layout de escritorio con panel lateral colapsable.
- Layout móvil con bottom sheet de dos alturas y navegación inferior.
- Code splitting: `MapStage` y controles se cargan en un chunk aparte; MapLibre no forma parte del bundle inicial.
- Persistencia versionada y saneada en `localStorage`.
- Limpieza de viewport en `sessionStorage`.

### 2.2. Mapa satelital realista

El mapa por defecto es un mapa satelital realista:

- Imagen real de **Esri World Imagery**.
- Etiquetas vectoriales propias sobre la imagen, usando **OpenFreeMap** (`place`, `transportation_name`, `water_name`, `poi`).
- Nombres en español cuando existe `name:es`, con fallback a `name`.
- Relieve 3D con **AWS Terrain Tiles** en formato Terrarium.
- Hillshade sutil sobre el terreno, con una fuente DEM separada para evitar el aviso de MapLibre.
- Cielo/horizonte con la propiedad `sky` de MapLibre.
- Gradación oscura, desaturada y cinematográfica.
- Inclinación inicial de **55°**.
- Zoom inicial de **13.2**.
- `maxPitch: 85`.
- Selector de capas con tres opciones: Satélite, Oscuro, Claro.
- La opción Satélite muestra el subtítulo «Imagen real con etiquetas y relieve 3D».
- Atribución de Esri, OpenFreeMap/OpenMapTiles/OSM y relieve.
- En móvil la atribución se pliega en un botón ⓘ para no tapar los controles; al desplegarla queda a la derecha de los controles del mapa.
- Sesión de viewport migrada a la clave `atlas.viewport.v2` para no restaurar la vista vectorial antigua.
- El global de depuración `window.__atlasMap` se eliminó.

### 2.3. Pulido visual de interfaz

- Bottom sheet móvil con dos alturas: media `min(58dvh, 500px)` y expandida `min(78dvh, 640px)`.
- El handle es un botón accesible con `aria-expanded` y `aria-controls`; un clic alterna entre ambas alturas.
- El handle también se arrastra con puntero o toque: la altura sigue al dedo entre ambos límites y hace snap al punto medio. `touch-action: none` evita que el gesto desplace la página.
- El clic que el navegador emite después de un arrastre se suprime durante 300 ms para que no vuelva a alternar la altura; si no llega, el siguiente clic funciona con normalidad.
- Con el handle enfocado, `ArrowUp` expande y `ArrowDown` contrae; `Enter` y `Espacio` conservan la alternancia nativa.
- Al cerrar y volver a abrir, el sheet vuelve a la altura media (el componente móvil se desmonta y reinicia su estado).
- La brújula vuelve al norte y al pitch por defecto del mapa base (55° en Satélite), no a un plano de 0°. Solo aparece cuando la cámara se sale de esa referencia.
- En pantallas de hasta 360 px las pestañas del sheet apilan icono y etiqueta, y la nav móvil reduce el `letter-spacing` para que «Guardados» no se recorte.
- El contenedor del sheet recibe foco sin anillo visible; las pestañas y el botón de cierre siguen siendo navegables.
- Ajustes usa un diálogo flex con cabecera fija y cuerpo con scroll propio, `max-height: min(88dvh, 780px)`.
- En escritorio, el diálogo mide 520×749.9 px a 1440×900 y muestra todo el contenido sin recortes.
- En móvil, el cuerpo de Ajustes hace scroll; el backdrop queda por encima de la navegación inferior y la nav se oculta mientras el diálogo está abierto.
- Checkboxes propios, coherentes con el tema oscuro/cian.
- Etiquetas del mapa: POI desde zoom 15.5 y calles menores desde 14.5, con más `text-padding`.
- A 13.2 y 14.2 se ven ciudades, distritos, agua y avenidas; no aparecen POI ni calles menores.
- El check del selector de capas se alinea con la primera línea del texto.
- Viñeta radial muy sutil sobre el mapa, con `pointer-events: none` para no bloquear la interacción.

### 2.4. Verificado en esta iteración

Escritorio:

- El mapa abre en Satélite con zoom 13.2 y pitch 55 (confirmado leyendo la sesión de viewport tras un movimiento: `zoom: 14.2` tras un paso de zoom, `pitch: 55`).
- Ajustes a 1440×900: caja de 520×749.9 px, cuerpo de 687 px sin scroll y sin anillo de foco en el contenedor.
- Check custom de «Capa de puntos de interés» visible y coherente; el check del selector de capas queda a 2 px del inicio de la primera línea del texto.
- A zoom 14.2 se ven avenidas, distritos y agua; no aparecen POI ni calles menores. La imagen sigue legible con la viñeta.
- Imagen de Esri oscura y desaturada, sin marca de agua.
- Etiquetas de ciudad, distrito, agua y carreteras con halo legible.
- Atribución completa: ATLAS, relieve, Esri/Maxar/Earthstar, OpenFreeMap/OpenMapTiles/OSM.
- Panel lateral a 1440×900: 384×808 px, sin sheet ni nav móvil; los controles del mapa siguen completos.
- Brújula: con pitch 70 y bearing 30 aparece; al pulsarla vuelve a pitch 55 y bearing 0 y se oculta. También aparece al girar a bearing 20 y se oculta al volver al norte.
- Cambio Satélite → Oscuro → Claro → Satélite verificado.
- Búsqueda de «Museo del Prado» con Nominatim: 1 resultado, ficha completa, teléfono, web y horario publicados en OSM.
- «Cómo llegar» abre el planificador con el destino rellenado.
- Ruta calculada con origen = centro del mapa y destino = Museo del Prado. Al coincidir ambos puntos, OSRM devolvió `< 1 min` y `0 m`; es un resultado real, no simulado. No se validó una ruta larga en esta sesión.
- POI «Cafeterías»: 60 resultados reales de Overpass tras ~38 s. El servicio público respondió en esta sesión.
- Guardado del Museo del Prado en «Sitios pendientes» verificado.
- Selector de capas y POI superpuestos sobre satélite sin errores de ATLAS en consola.

Móvil (390×844):

- Mapa satelital a pantalla completa, con bottom nav y controles.
- Atribución plegada por defecto; al desplegarla no tapa los iconos de los controles y el texto se lee completo.
- Selector de capas abre dentro del viewport y se puede cerrar; el check queda alineado con la primera línea.
- Bottom sheet de búsqueda: altura media 489.5 px y expandida 640 px; el handle alterna ambas con clic y teclado, y expone `aria-expanded`.
- Arrastre verificado a 390×844: subida 489.5 → 599.5 px en vivo → snap a 640 px; bajada 640 → 540 → snap a 489.5 px. El clic inmediato posterior al arrastre no vuelve a alternar; un clic posterior sí.
- Flechas del handle verificadas: `ArrowUp` lleva a 640 px y `ArrowDown` a 489.5 px.
- Al cerrar y reabrir el sheet vuelve a 489.5 px (estado reiniciado).
- Pestaña Ruta dentro del sheet y cierre del sheet verificados.
- Ajustes a 390×844: caja de 350×742.7 px, cuerpo con scroll (816 px de contenido), sin anillo de foco.
- Con Ajustes abierto la navegación inferior se oculta y el backdrop queda por encima de ella; al cerrar, la nav vuelve.
- A 320×568 las pestañas del sheet pasan a columna (61 px por pestaña) y «Guardados» cabe entero (52.9 px); las etiquetas de la nav móvil tampoco se recortan.
- No se muestran todos los paneles a la vez.

Relieve 3D:

- Comprobado visualmente en la iteración anterior en zona montañosa (Sierra de Guadarrama, centro aproximado `-3.956, 40.842`, zoom 13.2, pitch 68). La configuración de DEM, hillshade y exageración no cambió después de esa comprobación.

### 2.5. Fase 5: radio de POI, exportación y calidad

Calidad:

- `SidePanel.test.tsx` cubre clic, arrastre con altura en vivo, snap, supresión del clic posterior, teclado y reapertura del bottom sheet.
- `MapControls.test.tsx` cubre la brújula oculta en la vista por defecto, su aparición al inclinar/girar y el reset a pitch 55 / bearing 0.
- jsdom no implementa pointer capture ni un viewport móvil estable; las pruebas los sustituyen y restauran entre casos.
- La verificación en un teléfono físico no está disponible en este entorno y queda como checklist manual.

Comprobado sobre el build de producción (`npm run preview`):

- La raíz y una ruta desconocida responden `200` con la SPA.
- Selector de radio visible y usable a 1440×900 y a 390×844 (bottom sheet), sin recortes.
- Al elegir 3 km, `localStorage` guarda `poiRadiusM: 3000` y la interfaz refleja la selección.
- La exportación GPX/GeoJSON está cubierta por pruebas de serialización y de descarga; no se abrió un visor externo en esta sesión.

Radio de POI:

- Nueva preferencia persistida `poiRadiusM` con tres valores reales: 500 m, 1,5 km y 3 km. Por defecto, 1,5 km.
- El saneado de `localStorage` descarta valores fuera de la lista admitida.
- El selector vive en Explorar; al cambiarlo con una categoría activa se repite la consulta.
- El radio se aplica tanto a Explorar como a las búsquedas por categoría desde Buscar.
- La UI muestra el radio efectivo junto al proveedor y en la cabecera del selector.

Exportación de ruta:

- `exportRoute.ts` serializa GPX 1.1 y GeoJSON RFC 7946 a partir de la geometría, las paradas, la distancia y la duración devueltas por OSRM.
- El GPX incluye una traza, waypoints con nombre y un `desc` con distancia, duración y proveedor.
- El GeoJSON incluye una `LineString` y un `Point` por parada con coordenadas; las paradas sin coordenadas se omiten.
- Los nombres se escapan al generar XML.
- Los botones «Descargar GPX» y «Descargar GeoJSON» viven en el resultado de la ruta y usan una descarga local por `Blob`; no pasan por ningún servidor.
- No se añaden tráfico, peajes ni tiempos que el proveedor no haya devuelto.

Preparación de producción:

- `docs/PRODUCTION.md` reúne build, variables, cabeceras/CSP, caché, licencias, smoke test y limitaciones.
- `.env.example` avisa de que las variables `VITE_*` son públicas y de que cambiar proveedores exige reconstruir.
- `package.json` declara el rango de Node compatible.

### 2.6. Despliegue en Cloudflare Pages

- Repositorio público: <https://github.com/AlejandroPD05/atlas> (rama `main`, topics y homepage configurados).
- Proyecto `atlas-explorador`, rama de producción `main`: <https://atlas-explorador.pages.dev>.
- `wrangler.toml` declara `pages_build_output_dir = "./dist"` y la fecha de compatibilidad.
- `public/_headers` aplica CSP, HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy` y COOP; también define caché inmutable para `/assets/*` y `no-cache` para `index.html`.
- `public/_redirects` devuelve `index.html` con `200` en cualquier ruta, así que la SPA funciona al recargar.
- `npm run deploy` construye y publica con `wrangler pages deploy dist --branch main`.
- El proyecto se creó con `wrangler pages project create --force`: la delegación automática a Workers fallaba con «Missing entry-point». Los despliegues posteriores van directos a Pages.
- Ajustes muestra que la imagen satelital de demostración (Esri World Imagery) no está licenciada para uso comercial.
- Comprobado en producción: raíz y ruta desconocida devuelven `200`; CSP y cabeceras presentes; mapa satelital, búsqueda real de «Museo del Prado», ficha y ruta OSRM de 17 pasos sin errores de consola.
- Sigue siendo un despliegue de demostración: no hay dominio propio y los proveedores públicos no tienen SLA.

### 2.7. Validación técnica

Última ejecución, con el código final de la fase 5 y el despliegue:

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | Pasa (incluido en `npm run build`) |
| `npm run lint` | Pasa |
| `npm test` | 74 pruebas, 15 archivos, todas pasando |
| `npm run build` | Pasa |
| `npm run deploy` | Publicado en Cloudflare Pages; raíz y ruta desconocida responden `200` |

Build de producción:

- Bundle inicial: `index-*.js` ~346 kB (109 kB gzip).
- MapLibre: ~1,06 MB (288 kB gzip), en chunk diferido.
- Worker de MapLibre: ~518 kB.
- El aviso de Vite por tamaño del chunk de MapLibre es esperado.

---

## 3. Estructura clave

```text
atlas/
  .env.example
  README.md
  PROGRESS.md
  package.json
  wrangler.toml
  public/
    _headers
    _redirects
    favicon.svg
  docs/
    PRODUCTION.md
  src/
    app/
      App.tsx
      config.ts
    components/
      ui.tsx
      ToastHost.tsx
    features/
      explore/
      layout/
      map/
      places/
      routes/
      saved/
      search/
      settings/
    hooks/
    services/
      geocoding/
      osm/
      pois/
      routing/
    store/
      appStore.ts
      persist.ts
    styles/
      base.css
      tokens.css
    test/
      setup.ts
    types/
      domain.ts
    utils/
```

### 3.1. Archivos relevantes del mapa

| Archivo | Función |
|---|---|
| `src/app/config.ts` | `BasemapId`, `BasemapDef`, proveedores, URLs por defecto, defaults de pitch/zoom y variables `.env`. |
| `src/features/map/basemap.ts` | Genera el estilo satelital: imagen, etiquetas vectoriales, DEM, hillshade, cielo, atribución y capas propias de ATLAS. |
| `src/features/map/basemap.test.ts` | Pruebas del estilo satelital y del fallback vectorial. |
| `src/features/map/MapView.tsx` | Inicialización de MapLibre, sesión de viewport v2, pitch/zoom inicial, `maxPitch: 85` y atribución compacta en móvil. |
| `src/features/map/MapStage.tsx` | Monta/desmonta `MapView` al cambiar de basemap y carga las capas de datos/ruta. |
| `src/features/map/MapControls.tsx` | Selector de capas con subtítulos y texto de atribución. |
| `src/styles/base.css` | Estilos de la atribución de MapLibre, incluida la versión compacta y su posición en móvil. |
| `src/features/map/MapDataLayer.tsx` | Capas GeoJSON de lugares y POI sobre el mapa base. |
| `src/features/map/MapRouteLayer.tsx` | Ruta y puntos sobre el mapa base. |
| `src/features/map/mapInstance.ts` | Puente entre React y la instancia de MapLibre. |

### 3.2. Pruebas existentes

```text
src/features/explore/categories.test.ts
src/features/explore/ExplorePanel.test.tsx (consulta, error, radio)
src/features/layout/SidePanel.test.tsx (bottom sheet)
src/features/map/MapControls.test.tsx (brújula y cámara)
src/features/routes/RoutePanel.test.tsx (exportación)
src/features/routes/exportRoute.test.ts (GPX/GeoJSON)
src/features/saved/SavedPanel.test.tsx
src/services/geocoding/nominatim.test.ts
src/services/geocoding/photon.test.ts
src/services/osm/normalize.test.ts
src/services/pois/overpass.test.ts
src/services/routing/osrm.test.ts
src/features/map/basemap.test.ts
src/store/persist.test.ts
src/utils/geo.test.ts
```

Total actual: **74 pruebas en 15 archivos**.

---

## 4. Decisiones técnicas

### 4.1. Stack

- React 19.
- TypeScript estricto.
- Vite 8.
- CSS Modules + tokens CSS.
- MapLibre GL 6.15.
- Zustand 5.
- Lucide React.
- Vitest + Testing Library + jsdom.

### 4.2. Mapa satelital

Fuentes por defecto, sin clave:

- **Imagen:** Esri World Imagery
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`
- **Etiquetas:** OpenFreeMap
  `https://tiles.openfreemap.org/planet`
  Glifos: `https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf`
- **DEM:** AWS Terrain Tiles / Terrarium
  `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`

Decisión importante: **no se usa CARTO para etiquetas**. Sin clave, sus teselas devuelven la marca de agua «API KEY REQUIRED». Se descartó tras comprobarlo visualmente.

En su lugar, `basemap.ts` genera capas `symbol` propias sobre la fuente vectorial de OpenFreeMap:

- `atlas-label-water`
- `atlas-label-poi`
- `atlas-label-road-minor`
- `atlas-label-road-major`
- `atlas-label-district`
- `atlas-label-city`
- `atlas-label-state`
- `atlas-label-country`

Esto permite controlar tipografía, tamaño, halo, densidad y color sin depender de un proveedor de etiquetas raster con clave.

El estilo se genera localmente porque combina:

- Raster satelital.
- Etiquetas vectoriales.
- DEM.
- Hillshade.
- Cielo.
- Capas propias de ATLAS.

Si se define `VITE_STYLE_SATELLITE_URL`, se usa un estilo completo externo y se ignoran las teselas generadas. Es la vía prevista para producción con MapTiler/Mapbox/otro proveedor licenciado.

### 4.3. Gradación visual

La imagen satelital se oscurece y desatura para que la interfaz y las capas de ATLAS sigan siendo legibles:

```ts
'raster-brightness-min': 0.01
'raster-brightness-max': 0.72
'raster-contrast': 0.18
'raster-saturation': -0.5
'raster-hue-rotate': 8
'raster-resampling': 'linear'
```

Fondo del mapa: `#04080a`.

Cielo:

```ts
'sky-color': '#091a22'
'horizon-color': '#173b40'
'fog-color': '#061014'
'fog-ground-blend': 0.82
'horizon-fog-blend': 0.55
'sky-horizon-blend': 0.86
'atmosphere-blend': 0.6
```

Sobre la imagen se superpone una viñeta radial CSS sutil (`MapView.module.css`): transparente en el centro y hasta `rgba(3, 7, 9, 0.34)` en los bordes. Tiene `pointer-events: none`, por lo que no bloquea el mapa, y queda por debajo de controles y paneles.

### 4.4. Relieve 3D

- Fuente `raster-dem` con `encoding: 'terrarium'`.
- `tileSize: 256`.
- `maxzoom: 15`.
- `terrain.exaggeration: 1.15`.
- Hillshade con una fuente DEM separada para evitar el warning de MapLibre.
- La inclinación inicial es 55° y `maxPitch` es 85.

Aclaración honesta: esto es **satélite 2D proyectado sobre un DEM**. No es fotogrametría 3D global tipo Google Photorealistic 3D Tiles. Para conseguir edificios y ciudades fotorrealistas en 3D hace falta un proveedor licenciado con clave y asumir sus costes y términos.

### 4.5. Comportamiento del mapa

- `basemapId` inicial: `satellite`.
- `MapStage` usa `key={basemapId}`, por lo que cambiar de capa remonta MapLibre.
- `maxPitch: 85`.
- `fadeDuration: 120`.
- Atribución con `customAttribution: 'ATLAS'`.
- En viewports de hasta 860 px, la atribución nace compacta y plegada; MapLibre la crea desplegada, así que `MapView` le quita la clase `maplibregl-compact-show` en el primer frame.
- Sesión de viewport en `sessionStorage` con clave `atlas.viewport.v2`.
- La clave v2 evita restaurar la vista antigua del mapa vectorial.
- `MapView` guarda centro, zoom, bearing y pitch en `sessionStorage` al terminar un movimiento.
- El relieve y el cielo solo se aplican al estilo satelital generado.

### 4.6. Datos y proveedores

- Búsqueda: Nominatim público por defecto, una petición por segundo, sin autocompletado.
- Photon opcional para sugerencias.
- Rutas: OSRM público de demo solo para coche.
- A pie/bici: deshabilitados salvo que se configure `VITE_ROUTING_URL_WALK` / `VITE_ROUTING_URL_BIKE`.
- POI: Overpass público. El radio de búsqueda es una preferencia persistida (500 m, 1,5 km o 3 km) y se aplica a Explorar y a Buscar por categoría.
- Exportación: GPX/GeoJSON generados en el navegador desde la respuesta de OSRM; no hay servicio de exportación ni datos añadidos.
- Guardados: `localStorage` versionado y saneado.
- Viewport: `sessionStorage`.
- No se simulan tráfico, accesibilidad, horarios, precios ni tiempos.

### 4.7. Interfaz móvil

- El bottom sheet se monta solo con `mobileSheetOpen`; al desmontarse se reinicia su estado de altura. Por eso al reabrir vuelve a la altura media.
- Altura media: `min(58dvh, 500px)`; expandida: `min(78dvh, 640px)`; transición de altura y `prefers-reduced-motion` respetado por la base global.
- El arrastre vive solo en el handle: captura el puntero, aplica un umbral de 4 px, limita la altura entre media y expandida y actualiza el alto en vivo con estilos inline. Al soltar hace snap al punto medio.
- Las constantes `SHEET_*` de `SidePanel.tsx` replican las alturas y el margen inferior del CSS; si se cambian en un sitio, hay que cambiarlas en el otro.
- El clic posterior al arrastre se ignora durante 300 ms mediante un temporizador que se limpia al desmontar. `ArrowUp`/`ArrowDown` controlan la altura desde el teclado.
- El diálogo de Ajustes vive en un backdrop con `z-index: calc(var(--z-modal) + 2)`, por encima de la nav móvil (`+1`).
- La nav móvil no se renderiza mientras Ajustes está abierto y reaparece al cerrarlo.
- El selector de capas alinea el check con la primera línea del texto, no con el centro de las dos líneas.

### 4.8. Rendimiento

- `MapStage` se carga con `React.lazy`.
- MapLibre se descarga en un chunk aparte.
- El bundle inicial no incluye MapLibre.
- El aviso de Vite por tamaño del chunk de MapLibre es esperado.

---

## 5. Problemas conocidos

1. **Fotorrealismo 3D global bloqueado:** sin proveedor licenciado/API key no se puede replicar Google Earth. El satélite + DEM es la solución open sin clave.
2. **Licencias de proveedores:** Esri World Imagery, OpenFreeMap y AWS Terrain Tiles se usan como servicios públicos de demostración. Para producción hay que revisar términos y configurar proveedor propio.
3. **Avisos de estilo de OpenFreeMap:** al cambiar a Oscuro o Claro, MapLibre muestra avisos de la propia plantilla de OpenFreeMap (`wood-pattern`, filtros de escudos de carretera). No vienen de las capas de ATLAS y no bloquean el mapa.
4. **Overpass público inestable por diseño:** puede devolver `502` o timeout. En esta sesión respondió y devolvió 60 cafeterías, pero no hay SLA.
5. **La capa de POI no se refresca sola al mover el mapa:** hay que pulsar «Buscar aquí» en Explorar.
6. **Bottom sheet sin inercia:** el arrastre sigue al puntero y hace snap al punto medio; no hay física de momentum ni rebote elástico. Es una decisión de alcance.
7. **Densidad de etiquetas:** POI desde zoom 15.5 y calles menores desde 14.5; a 14.2 quedan avenidas, distritos y agua. Si se quiere una referencia aún más limpia, subir el `minzoom` de carreteras mayores (10) o de distritos (11) en `basemap.ts`.
8. **Sin proveedor de producción configurado:** todo el mapa base funciona con servicios públicos de demo. La vía es `VITE_STYLE_SATELLITE_URL` o las variables `VITE_TILES_SATELLITE_*`.
9. **No hay 3D de edificios:** solo terreno y cielo. No afirmarlo de otra forma.
10. **Validación en teléfono físico pendiente:** el bottom sheet y la cámara están cubiertos con jsdom y eventos sintéticos, no con un dispositivo real.
11. **Despliegue de demostración publicado:** <https://atlas-explorador.pages.dev> funciona en Cloudflare Pages, pero no hay dominio propio ni proveedor de mapas con licencia. Esri World Imagery sigue siendo un servicio de demo y no es apto para uso comercial.

---

## 6. Siguiente paso

Las tres líneas acordadas están cerradas y el despliegue de demostración está publicado:

1. **Calidad:** pruebas de integración del bottom sheet y de la cámara.
2. **Fase 5:** radio de POI y exportación GPX/GeoJSON.
3. **Producción:** guía, variables, cabeceras, licencias, smoke test y publicación en Cloudflare Pages.

No hay deuda bloqueante de código. Para continuar, elegir con el usuario:

1. **Dominio propio y mapas licenciados:** conectar un dominio a Cloudflare Pages, contratar un estilo satelital (MapTiler/Mapbox) y actualizar CSP y variables. Después, `npm run deploy`.
2. **Validación física:** probar arrastre, teclado, atribución y ajustes en un teléfono real.
3. **Nueva fase de producto:** acordar alcance antes de escribir código; no simular datos para llenar funciones.

Antes de empezar cualquier línea, leer este archivo y ejecutar el quality gate para confirmar que la base sigue sana.

### Arranque

```powershell
cd "C:\Users\OneCu\Desktop\Personal\Yo\Profesional\Proyectos personales\atlas"
npm run dev
```

Abrir `http://127.0.0.1:5175`.

Para ver los defaults reales sin restaurar la vista guardada:

```js
sessionStorage.removeItem('atlas.viewport.v2')
location.reload()
```

---

## 7. Reglas para la nueva sesión

- No rehacer las fases 1–4: ya están implementadas y commiteadas.
- No volver al mapa vectorial como modo por defecto.
- No usar CARTO sin clave: devuelve watermark.
- No afirmar que hay 3D fotorrealista global: solo hay satélite + DEM.
- No simular datos para completar la interfaz.
- No copiar código, assets ni branding de HorizonX.
- Mantener proveedores configurables por `.env` y atribución visible.
- No commitear sin que `tsc`, ESLint, tests y build pasen.
- Mantener la atribución compacta en móvil: la versión completa tapaba los controles.

---

## 8. Prompt para continuar en una conversación nueva

```text
Continúa ATLAS desde el archivo PROGRESS.md adjunto.

Estado: fases 1–4 y rediseño satelital en `9e82604`; pulido visual en `8159f42` y `1695181`.
Calidad, fase 5 (radio de POI y exportación) y documentación de producción en `9dd8e48`,
`14fef2f`, `9d9908d` y el commit de cierre documental.
El proyecto está publicado en https://atlas-explorador.pages.dev (Cloudflare Pages, proyecto
`atlas-explorador`, rama `main`) y su código en https://github.com/AlejandroPD05/atlas.
El working tree está limpio y el servidor de desarrollo, detenido.

Empieza por:
1. Leer PROGRESS.md y revisar `git status` / `git log --oneline -5`.
2. Ejecutar `npm run lint`, `npm test` y `npm run build` (incluye `tsc --noEmit`).
3. Abrir https://atlas-explorador.pages.dev y comprobar que el mapa abre en Satélite con pitch 55.
4. Preguntar al usuario qué línea de la sección 6 quiere abordar antes de escribir código.

Para redesplegar: `npm run deploy` (si Wrangler no está autenticado, `npx wrangler login`).
No publiques con Esri World Imagery si el uso deja de ser una demostración: configura un
proveedor licenciado y actualiza la CSP de `public/_headers`.

No rehagas las fases 1–4 ni vuelvas al mapa vectorial por defecto. No simules datos. No uses CARTO sin clave. No afirmes que hay 3D fotorrealista global: es satélite 2D sobre DEM. Mantén la atribución compacta en móvil.
```
