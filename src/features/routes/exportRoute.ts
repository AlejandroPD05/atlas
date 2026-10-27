import type { RoutePlan } from '../../types/domain'

/* Exportación de la ruta calculada. Solo se serializa lo que devolvió el
   proveedor (geometría, distancia, duración y paradas): no se añaden tiempos
   de tráfico, precios ni otros datos que no tengamos. */

export type RouteExportFormat = 'gpx' | 'geojson'

const MODE_LABEL: Record<RoutePlan['mode'], string> = {
  driving: 'Coche',
  walking: 'A pie',
  cycling: 'Bici',
  transit: 'Transporte público',
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function roundCoord(value: number): number {
  return Math.round(value * 1e6) / 1e6
}

function summary(plan: RoutePlan): string {
  return `Ruta ${MODE_LABEL[plan.mode]} · ${Math.round(plan.distanceM)} m · ${Math.round(plan.durationS)} s · ${plan.provider}${plan.providerIsDemo ? ' (demo)' : ''}`
}

export function routeExportFileName(plan: RoutePlan, format: RouteExportFormat): string {
  return `atlas-ruta-${plan.mode}.${format}`
}

/** GeoJSON RFC 7946: una línea con la geometría y un punto por parada con coordenadas. */
export function routeToGeoJson(plan: RoutePlan): string {
  const stops = plan.stops.filter((stop) => stop.coords)
  const features = [
    {
      type: 'Feature' as const,
      properties: {
        name: `Ruta ${MODE_LABEL[plan.mode]}`,
        mode: plan.mode,
        preference: plan.preference,
        distance_m: Math.round(plan.distanceM),
        duration_s: Math.round(plan.durationS),
        provider: plan.provider,
        provider_is_demo: plan.providerIsDemo,
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: plan.geometry.map(([lng, lat]) => [roundCoord(lng), roundCoord(lat)]),
      },
    },
    ...stops.map((stop, index) => ({
      type: 'Feature' as const,
      properties: {
        name: stop.label,
        role: stop.kind,
        stop_index: index,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [roundCoord(stop.coords!.lng), roundCoord(stop.coords!.lat)],
      },
    })),
  ]

  return JSON.stringify({ type: 'FeatureCollection', features }, null, 2)
}

/** GPX 1.1 con la traza y las paradas como waypoints. */
export function routeToGpx(plan: RoutePlan): string {
  const name = `Ruta ${MODE_LABEL[plan.mode]}`
  const waypoints = plan.stops
    .filter((stop) => stop.coords)
    .map(
      (stop) =>
        `  <wpt lat="${roundCoord(stop.coords!.lat)}" lon="${roundCoord(stop.coords!.lng)}">\n` +
        `    <name>${escapeXml(stop.label)}</name>\n` +
        `  </wpt>`,
    )
  const points = plan.geometry.map(
    ([lng, lat]) => `      <trkpt lat="${roundCoord(lat)}" lon="${roundCoord(lng)}" />`,
  )

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="ATLAS" xmlns="http://www.topografix.com/GPX/1/1">',
    '  <metadata>',
    `    <name>${escapeXml(name)}</name>`,
    `    <desc>${escapeXml(summary(plan))}</desc>`,
    '  </metadata>',
    ...waypoints,
    '  <trk>',
    `    <name>${escapeXml(name)}</name>`,
    '    <trkseg>',
    ...points,
    '    </trkseg>',
    '  </trk>',
    '</gpx>',
    '',
  ].join('\n')
}
