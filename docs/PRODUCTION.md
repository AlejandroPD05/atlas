# ATLAS · preparación de producción

Esta guía deja el build listo para publicarse en cualquier hosting estático. El despliegue real
necesita un dominio, un proveedor de hosting y, si se quieren mapas comerciales, credenciales y
licencias. Nada de eso está incluido en el repositorio.

## 1. Qué se publica

ATLAS es una SPA de Vite: el artefacto es la carpeta `dist/`. No hay servidor propio, cuentas ni
base de datos. Los guardados y las preferencias viven en `localStorage` del navegador.

```bash
npm ci
npm run lint
npm test
npm run build
npm run preview
```

- Node.js: `^20.19.0 || >=22.12.0`.
- El build incluye `tsc --noEmit`; no hace falta lanzarlo aparte.
- `dist/` es inmutable: si cambian las variables de entorno hay que volver a construir.

## 2. Variables de entorno

Todas las variables `VITE_*` se compilan dentro del JavaScript público. **No pongas secretos,
tokens privados ni claves de servidor**: cualquiera puede leerlas en el navegador. Si un proveedor
exige una clave secreta, necesitas un proxy propio o un plan con claves restringidas por dominio.

| Variable | Producción |
| --- | --- |
| `VITE_STYLE_SATELLITE_URL` | Estilo satelital licenciado completo (recomendado si se sustituye el demo) |
| `VITE_TILES_SATELLITE_URL` / `..._ATTRIBUTION` | Teselas propias y su atribución exacta |
| `VITE_TILES_SATELLITE_LABELS_URL` / `..._ATTRIBUTION` | Etiquetas raster propias, si se usan |
| `VITE_TERRAIN_DEM_URL` / `VITE_TERRAIN_ATTRIBUTION` | DEM propio y atribución |
| `VITE_STYLE_DARK_URL` / `VITE_STYLE_LIGHT_URL` | Estilos vectoriales alternativos |
| `VITE_TILES_DARK_URL` / `VITE_TILES_LIGHT_URL` / `VITE_TILES_ATTRIBUTION` | Teselas raster alternativas |
| `VITE_GEOCODING_PROVIDER` / `VITE_GEOCODING_URL` | `nominatim` o `photon`, con servidor propio a ser posible |
| `VITE_ROUTING_URL` | OSRM de coche con SLA |
| `VITE_ROUTING_URL_WALK` / `VITE_ROUTING_URL_BIKE` | Perfiles peatonales y ciclistas reales; si faltan, la UI los desactiva |
| `VITE_OVERPASS_URL` | Overpass propio o con límites acordados |

Los valores por defecto son servicios públicos de demostración. Para producción hay que
sustituirlos o asumir sus límites, su disponibilidad y sus términos.

## 3. Cabeceras y CSP

Ejemplo para un hosting que admita un archivo `_headers` (Netlify, Cloudflare Pages). Ajusta los
dominios si cambias de proveedor de mapas o de rutas.

```text
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(self), camera=(), microphone=()
  Cross-Origin-Opener-Policy: same-origin
  Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://server.arcgisonline.com https://tiles.openfreemap.org https://s3.amazonaws.com; font-src 'self' data:; connect-src 'self' https://tiles.openfreemap.org https://server.arcgisonline.com https://s3.amazonaws.com https://router.project-osrm.org https://nominatim.openstreetmap.org https://overpass-api.de; worker-src 'self' blob:; child-src 'self' blob:; manifest-src 'self'; upgrade-insecure-requests

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/index.html
  Cache-Control: no-cache

/favicon.svg
  Cache-Control: public, max-age=86400
```

Notas:

- `img-src` y `connect-src` deben incluir **todos** los hosts de teselas, estilos, DEM, geocoding,
  routing y Overpass que configures. Si activas Photon, añade `https://photon.komoot.io`.
- `worker-src 'self' blob:` es necesario para el worker de MapLibre. No lo elimines.
- `style-src 'unsafe-inline'` cubre los estilos que MapLibre aplica al DOM. Se puede probar a
  quitarlo, pero verifica el mapa y los controles antes de hacerlo.
- Prueba primero la CSP en modo `Content-Security-Policy-Report-Only` y revisa la consola y los
  informes antes de bloquear.
- No actives `Cross-Origin-Embedder-Policy: require-corp`: puede romper teselas y estilos de
  terceros que no envían CORP.

Ejemplo de nginx:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}

location /assets/ {
  add_header Cache-Control "public, max-age=31536000, immutable";
}

location = /index.html {
  add_header Cache-Control "no-cache";
}
```

El hosting debe servir `index.html` para las rutas de la SPA y forzar HTTPS.

## 4. Licencias y atribución

Antes de publicar con tráfico real, revisa cada fuente:

| Fuente | Situación | Acción |
| --- | --- | --- |
| OpenStreetMap | Datos bajo ODbL | Mantener «© OpenStreetMap contributors» y enlazar la licencia |
| Esri World Imagery | Servicio público de demo | **No usar como base comercial sin licencia**; sustituir por proveedor propio |
| OpenFreeMap | Estilos/teselas gratuitos | Revisar sus términos y capacidad para el tráfico previsto |
| AWS Terrain Tiles | DEM público | Revisar términos y disponibilidad; usar DEM propio si hay SLA |
| Nominatim público | Política de uso estricta | Máximo 1 req/s y sin autocompletado; para escala, servidor propio |
| OSRM público | Demo sin SLA | Servidor propio para producción |
| Overpass público | Demo sin SLA | Servidor propio o proveedor con límites acordados |
| Inter / Space Grotesk | SIL Open Font License | Conservar la licencia incluida en el paquete |
| MapLibre GL JS | BSD-3-Clause | Conservar aviso de licencia |
| Lucide | ISC | Conservar aviso de licencia |

La atribución del mapa no debe ocultarse ni plegarse de forma que desaparezca: en móvil se pliega
tras el botón ⓘ, pero sigue accesible.

## 5. Comprobación antes de publicar

1. `npm ci && npm run lint && npm test && npm run build` sin errores.
2. `npm run preview` y recarga completa: sin errores en consola ni peticiones 404.
3. Satélite, oscuro y claro cargan; la atribución es visible y correcta.
4. Buscar «Puerta del Sol» devuelve resultados reales; no se lanzan peticiones por cada tecla con
   Nominatim.
5. Explorar una categoría, cambiar el radio a 500 m / 1,5 km / 3 km y comprobar que la consulta
   usa ese radio. Repetir desde Buscar con una categoría.
6. Calcular una ruta en coche, abrir las alternativas y descargar GPX y GeoJSON. Abrir ambos
   archivos en un visor (por ejemplo gpx.studio o geojson.io) y comprobar que la geometría y las
   paradas coinciden.
7. A pie y bici siguen desactivados si no hay servidores configurados; transporte público sigue sin
   proveedor.
8. Simular un fallo de Overpass/OSRM (sin red o URL inválida): la UI muestra el error real, no
   resultados inventados.
9. Móvil 390×844 y 320×568: bottom sheet, arrastre, teclado, selector de capas, navegación inferior
   y diálogo de ajustes sin recortes.
10. Guardar un lugar, recargar y comprobar que persiste; borrar `localStorage` y comprobar que se
    restaura el estado inicial.
11. Comprobar la CSP en report-only durante unos minutos de navegación real.

## 6. Limitaciones que siguen siendo ciertas

- No hay backend, autenticación ni sincronización: los guardados son locales.
- No hay tráfico, precios, horarios verificados, accesibilidad, ruido ni perfiles temáticos: no se
  inventan.
- Solo la ruta «Rápida» usa OSRM; las alternativas existen solo si el proveedor las devuelve.
- El satélite es una imagen 2D sobre un DEM, no fotogrametría 3D global.
- Sin un proveedor de mapas licenciado, la configuración por defecto no es apta para producción
  comercial.
