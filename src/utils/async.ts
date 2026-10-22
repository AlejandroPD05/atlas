/* Utilidades asíncronas: cancelación y "solo la última petición importa". */

export function isAbortError(e: unknown): boolean {
  if (e instanceof DOMException && e.name === 'AbortError') return true
  if (e instanceof Error && (e.name === 'AbortError' || e.name === 'TimeoutError')) return true
  return false
}

export interface LatestRunner<T> {
  /** Lanza una nueva ejecución y cancela la anterior si seguía en curso. */
  run(): Promise<T>
  cancel(): void
}

/**
 * Envuelve una función que acepta un AbortSignal. Solo la última llamada
 * a run() puede resolver; las anteriores se abortan.
 */
export function createLatestRunner<T>(fn: (signal: AbortSignal) => Promise<T>): LatestRunner<T> {
  let controller: AbortController | null = null
  return {
    run(): Promise<T> {
      controller?.abort()
      controller = new AbortController()
      const signal = controller.signal
      return fn(signal)
    },
    cancel(): void {
      controller?.abort()
      controller = null
    },
  }
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(t)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    if (signal) {
      if (signal.aborted) {
        clearTimeout(t)
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }
      signal.addEventListener('abort', onAbort)
    }
  })
}
