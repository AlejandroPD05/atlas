import { describe, expect, it } from 'vitest'
import type { RouteEndpoint } from '../../types/domain'
import {
  describeRoutingError,
  parseOsrmResponse,
  RoutingError,
  spanishInstruction,
  type OsrmResponse,
} from './osrm'

const stops = [
  { id: 'o', kind: 'origin', label: 'Origen', coords: { lng: -3.7038, lat: 40.4168 } },
  { id: 'd', kind: 'destination', label: 'Destino', coords: { lng: -3.69, lat: 40.41 } },
] satisfies RouteEndpoint[]

const response: OsrmResponse = {
  code: 'Ok',
  routes: [
    {
      distance: 1500,
      duration: 300,
      geometry: {
        type: 'LineString',
        coordinates: [
          [-3.7038, 40.4168],
          [-3.7, 40.42],
          [-3.69, 40.41],
        ],
      },
      legs: [
        {
          distance: 1500,
          duration: 300,
          steps: [
            {
              distance: 0,
              duration: 0,
              name: 'Calle de Alcalá',
              maneuver: { type: 'depart', modifier: 'straight' },
            },
            {
              distance: 600,
              duration: 120,
              name: 'Gran Vía',
              maneuver: { type: 'turn', modifier: 'right' },
            },
            {
              distance: 900,
              duration: 180,
              name: 'Plaza de España',
              maneuver: { type: 'arrive' },
            },
          ],
        },
      ],
    },
    {
      distance: 1800,
      duration: 360,
      geometry: {
        type: 'LineString',
        coordinates: [
          [-3.7038, 40.4168],
          [-3.71, 40.43],
          [-3.69, 40.41],
        ],
      },
      legs: [
        {
          distance: 1800,
          duration: 360,
          steps: [
            {
              distance: 1800,
              duration: 360,
              name: 'Calle Mayor',
              maneuver: { type: 'depart' },
            },
            {
              distance: 0,
              duration: 0,
              maneuver: { type: 'arrive' },
            },
          ],
        },
      ],
    },
  ],
}

describe('parseOsrmResponse', () => {
  it('convierte alternativas reales en planes con pasos en español', () => {
    const plans = parseOsrmResponse(response, { stops, mode: 'driving', isDemo: true })

    expect(plans).toHaveLength(2)
    expect(plans[0]?.provider).toBe('OSRM')
    expect(plans[0]?.providerIsDemo).toBe(true)
    expect(plans[0]?.distanceM).toBe(1500)
    expect(plans[0]?.durationS).toBe(300)
    expect(plans[0]?.preference).toBe('fast')
    expect(plans[0]?.stops).toHaveLength(2)
    expect(plans[0]?.legs[0]?.steps.map((s) => s.instruction)).toEqual([
      'Sal por Calle de Alcalá',
      'Gira a la derecha por Gran Vía',
      'Llegada al destino',
    ])
    expect(plans[0]?.notes.some((n) => n.text.includes('sin tráfico en directo'))).toBe(true)
    expect(plans[1]?.distanceM).toBe(1800)
  })

  it('rechaza una respuesta sin ruta con un mensaje comprensible', () => {
    expect(() =>
      parseOsrmResponse({ code: 'NoRoute' }, { stops, mode: 'driving', isDemo: true }),
    ).toThrow(RoutingError)
    expect(() =>
      parseOsrmResponse({ code: 'NoRoute' }, { stops, mode: 'driving', isDemo: true }),
    ).toThrow(/no encuentra una ruta viable/i)
  })

  it('descarta geometrías inválidas y falla si no queda ninguna', () => {
    expect(() =>
      parseOsrmResponse(
        {
          code: 'Ok',
          routes: [{ distance: 10, duration: 10, geometry: { coordinates: [[0, 0]] } }],
        },
        { stops, mode: 'driving', isDemo: false },
      ),
    ).toThrow(/geometría de ruta válida/i)
  })
})

describe('spanishInstruction', () => {
  it('describe giros, cambios de sentido y rotondas', () => {
    expect(
      spanishInstruction({ name: 'Calle A', maneuver: { type: 'turn', modifier: 'slight left' } }),
    ).toBe('Gira ligeramente a la izquierda por Calle A')
    expect(spanishInstruction({ maneuver: { type: 'turn', modifier: 'uturn' } })).toBe(
      'Haz un cambio de sentido',
    )
    expect(
      spanishInstruction({ name: 'Calle B', maneuver: { type: 'roundabout', exit: 2 } }),
    ).toBe('Toma la rotonda y sal por la salida 2 hacia Calle B')
    expect(
      spanishInstruction({ name: 'Calle de Sagasta', maneuver: { type: 'exit rotary' } }),
    ).toBe('Sal de la rotonda hacia Calle de Sagasta')
    expect(spanishInstruction({ maneuver: { type: 'exit roundabout' } })).toBe(
      'Sal de la rotonda',
    )
    expect(spanishInstruction({ maneuver: { type: 'arrive' } }, false)).toBe('Llegada a la parada')
  })
})

describe('describeRoutingError', () => {
  it('respeta el mensaje de RoutingError', () => {
    expect(describeRoutingError(new RoutingError('Sin proveedor'))).toBe('Sin proveedor')
  })
})
