/** Identificador único razonablemente seguro (navegador + tests). */
export function uid(prefix = ''): string {
  const core =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
  return prefix ? `${prefix}_${core}` : core
}
