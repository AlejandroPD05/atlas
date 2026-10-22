/* Cliente HTTP con timeout, cancelación y errores tipados.
   Todas las llamadas a proveedores externos pasan por aquí. */

export type HttpErrorKind = 'network' | 'http' | 'parse' | 'timeout' | 'aborted'

export class HttpError extends Error {
  readonly kind: HttpErrorKind
  readonly status?: number
  readonly retryAfterS?: number

  constructor(kind: HttpErrorKind, message: string, opts: { status?: number; retryAfterS?: number } = {}) {
    super(message)
    this.name = kind === 'aborted' ? 'AbortError' : 'HttpError'
    this.kind = kind
    if (opts.status !== undefined) this.status = opts.status
    if (opts.retryAfterS !== undefined) this.retryAfterS = opts.retryAfterS
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: string
  contentType?: string
  headers?: Record<string, string>
  signal?: AbortSignal
  timeoutMs?: number
}

/**
 * Petición HTTP con cuerpo de texto. Lanza HttpError con un `kind`
 * que la interfaz puede traducir a un mensaje comprensible.
 */
export async function requestText(url: string, opts: RequestOptions = {}): Promise<string> {
  const { method = 'GET', body, contentType, headers = {}, signal, timeoutMs = 12000 } = opts

  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  const onOuterAbort = () => controller.abort()
  signal?.addEventListener('abort', onOuterAbort, { once: true })
  if (signal?.aborted) controller.abort()

  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers: contentType ? { 'Content-Type': contentType, ...headers } : headers,
      body,
      signal: controller.signal,
      // Nominatim/Overpass exigen identificación vía Referer; el navegador la envía solo.
      credentials: 'omit',
      referrerPolicy: 'strict-origin-when-cross-origin',
    })
  } catch (e) {
    if (timedOut) {
      throw new HttpError('timeout', 'La petición tardó demasiado. Inténtalo de nuevo.')
    }
    if (isAbort(e)) {
      throw new HttpError('aborted', 'Petición cancelada.')
    }
    throw new HttpError('network', 'No hay conexión con el servicio. Comprueba tu red.')
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onOuterAbort)
  }

  if (!res.ok) {
    const retryAfter = parseRetryAfter(res.headers.get('Retry-After'))
    const kind = res.status === 429 || res.status === 503 ? 'http' : 'http'
    throw new HttpError(kind, `El servicio respondió con un error (${res.status}).`, {
      status: res.status,
      retryAfterS: retryAfter,
    })
  }

  try {
    return await res.text()
  } catch (e) {
    if (timedOut) throw new HttpError('timeout', 'La respuesta tardó demasiado.')
    if (isAbort(e)) throw new HttpError('aborted', 'Petición cancelada.')
    throw new HttpError('parse', 'La respuesta del servicio no se pudo leer.')
  }
}

/** Petición que espera JSON y lo parsea con errores tipados. */
export async function fetchJson<T>(url: string, opts: RequestOptions = {}): Promise<T> {
  const text = await requestText(url, opts)
  try {
    return JSON.parse(text) as T
  } catch {
    throw new HttpError('parse', 'La respuesta del servicio no tiene el formato esperado.')
  }
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined
  const seconds = Number(header)
  if (Number.isFinite(seconds)) return seconds
  const date = Date.parse(header)
  if (Number.isFinite(date)) return Math.max(0, Math.round((date - Date.now()) / 1000))
  return undefined
}

function isAbort(e: unknown): boolean {
  if (e instanceof DOMException && e.name === 'AbortError') return true
  return e instanceof Error && e.name === 'AbortError'
}

/** Mensaje comprensible para el usuario a partir de un error de proveedor. */
export function describeHttpError(e: unknown): string {
  if (e instanceof HttpError) {
    switch (e.kind) {
      case 'network':
        return 'Sin conexión con el servicio. Revisa tu red o inténtalo más tarde.'
      case 'timeout':
        return 'El servicio tardó demasiado en responder. Inténtalo de nuevo.'
      case 'http':
        if (e.status === 429) return 'Demasiadas peticiones al servicio. Espera unos segundos.'
        if (e.status === 403 || e.status === 401) return 'El servicio rechazó la petición (acceso no autorizado).'
        if (e.status && e.status >= 500) return 'El servicio no está disponible ahora mismo. Inténtalo más tarde.'
        return `El servicio respondió con un error (${e.status ?? 'desconocido'}).`
      case 'parse':
        return 'La respuesta del servicio no tiene el formato esperado.'
      case 'aborted':
        return 'Petición cancelada.'
    }
  }
  return 'Ocurrió un error inesperado. Inténtalo de nuevo.'
}
