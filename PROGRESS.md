# PROGRESS — ATLAS

> Documento de continuidad para retomar el proyecto sin perder contexto.
> Adjunta o pega este archivo al inicio de la nueva conversación.

- **Fecha de corte:** 2026-10-26
- **Proyecto:** `C:\Users\OneCu\Desktop\Personal\Yo\Profesional\Proyectos personales\atlas`
- **Último commit de código:** `1695181 feat(ui): arrastrar el bottom sheet y afinar la camara`
- **Documentación:** este `PROGRESS.md` se actualiza en el commit de cierre posterior.
- **Estado:** rediseño satelital y pulido cerrados, incluidos el arrastre del bottom sheet, la cámara y la tipografía estrecha. Sin cambios pendientes en el código.
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

### 2.5. Validación técnica

Última ejecución, con el código final `1695181`:

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | Pasa (incluido en `npm run build`) |
| `npm run lint` | Pasa |
| `npm test` | 59 pruebas, 11 archivos, todas pasando |
| `npm run build` | Pasa |

Build de producción:

- Bundle inicial: `index-*.js` ~343 kB (107 kB gzip).
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
src/features/explore/ExplorePanel.test.tsx
src/features/saved/SavedPanel.test.tsx
src/services/geocoding/nominatim.test.ts
src/services/geocoding/photon.test.ts
src/services/osm/normalize.test.ts
src/services/pois/overpass.test.ts
src/services/routing/osrm.test.ts
src/features/map/basemap.test.ts
...
```

Total actual: **59 pruebas en 11 archivos**.

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
- POI: Overpass público.
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

---

## 6. Siguiente paso

El rediseño satelital y todo el pulido visual (bottom sheet, cámara y tipografía estrecha) ya están cerrados. **No hay tareas pendientes ni deuda bloqueante de esta iteración.**

Para continuar, elegir una línea de trabajo con el usuario antes de escribir código:

1. **Fase 5 de producto:** nuevas funciones (por ejemplo, filtros de POI, exportar rutas, comparador de alternativas, historial de búsquedas).
2. **Producción:** proveedor de mapa con clave, variables `.env`, atribución definitiva, revisión de licencias y despliegue.
3. **Calidad:** ampliar pruebas de integración del mapa y de los flujos móviles.

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
El working tree está limpio. El servidor de desarrollo está detenido.

Empieza por:
1. Leer PROGRESS.md y revisar `git status` / `git log --oneline -3`.
2. Ejecutar `npm run lint`, `npm test` y `npm run build` (incluye `tsc --noEmit`).
3. Arrancar `npm run dev` y confirmar que el mapa abre en Satélite, con pitch 55 y zoom 13.2.
4. Preguntar al usuario qué línea de la sección 6 quiere abordar antes de escribir código.

No rehagas las fases 1–4 ni vuelvas al mapa vectorial por defecto. No simules datos. No uses CARTO sin clave. No afirmes que hay 3D fotorrealista global: es satélite 2D sobre DEM. Mantén la atribución compacta en móvil.
```
